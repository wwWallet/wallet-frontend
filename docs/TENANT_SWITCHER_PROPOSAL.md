# Tenant Switcher Proposal

## Problem Statement

Users may have identities (passkeys) in multiple tenants, including the default tenant. Since each tenant is isolated (tenant A cannot know about tenant B), and each passkey is tied to exactly one user in one tenant, the only way to enable tenant switching is through frontend-cached information.

**Key constraints:**
1. **1:1 User-Passkey relationship**: Each passkey belongs to exactly one user in exactly one tenant (encoded in `userHandle` as `tenantId:userId`)
2. **No cross-tenant backend APIs**: Tenant A's backend cannot query tenant B's users
3. **Privacy preservation**: The backend must not be able to correlate passkeys across tenants as belonging to the "same real person"
4. **Frontend-only solution**: Tenant switching must be purely client-side based on cached login history

## Current State Analysis

### CachedUser Structure
```typescript
// src/services/LocalStorageKeystore.ts
export type CachedUser = {
    displayName: string;           // e.g., "alice @ TenantName" or "alice"
    userHandleB64u: string;        // Base64URL-encoded userHandle (contains tenantId:userId)
    prfKeys: WebauthnPrfSaltInfo[];
}
```

### Current Display Name Format
The `formatCachedUserDisplayName()` function in `api/index.ts` already formats cached users with tenant info:
```typescript
// "alice @ TenantName" for multi-tenant users
// "alice" for default tenant users
function formatCachedUserDisplayName(name: string, tenantDisplayName?: string): string {
    if (tenantDisplayName) {
        return `${name} @ ${tenantDisplayName}`;
    }
    return name;
}
```

### Login Flow
The login page already shows cached users:
```tsx
// src/pages/Login/Login.tsx - Line 557
{cachedUsers.filter(cachedUser => cachedUser?.prfKeys?.length > 0).map((cachedUser, index) => (
    <Button onClick={() => onLoginCachedUser(cachedUser)}>
        {cachedUser.displayName}  // Shows "alice @ TenantA" or "bob"
    </Button>
))}
```

### Missing Information
The `CachedUser` type does **NOT** currently store:
- `tenantId` - The tenant this user belongs to
- `tenantDisplayName` - The human-readable tenant name

This information is embedded in `displayName` as a formatted string but not as structured data.

---

## Proposed Solution

### Phase 1: Extend CachedUser with Tenant Information

**1.1 Update CachedUser Type**
```typescript
// src/services/LocalStorageKeystore.ts
export type CachedUser = {
    displayName: string;           // Pure user name (e.g., "alice")
    userHandleB64u: string;        // Base64URL-encoded userHandle
    prfKeys: WebauthnPrfSaltInfo[];

    // NEW: Tenant information (populated on login/signup)
    tenantId?: string;             // e.g., "acme-corp" or "default"
    tenantDisplayName?: string;    // e.g., "Acme Corporation" or undefined
}
```

**1.2 Store Tenant Info During Login/Signup**

Modify `loginWebauthn` and `signupWebauthn` in `api/index.ts` to store tenant information in cached user:

```typescript
// After successful login/signup, update cached user
const tenantId = finishResp?.data?.tenantId ?? 'default';
const tenantDisplayName = finishResp?.data?.tenantDisplayName;

// Store structured tenant info
keystore.updateCachedUserTenantInfo(userHandleB64u, tenantId, tenantDisplayName);
```

**1.3 Add Keystore Method**
```typescript
// src/services/LocalStorageKeystore.ts
updateCachedUserTenantInfo(userHandleB64u: string, tenantId: string, tenantDisplayName?: string): void,
```

### Phase 2: Tenant Switcher Component

**2.1 Create TenantSwitcher Component**

```tsx
// src/components/TenantSwitcher/TenantSwitcher.tsx

import React, { useMemo, useContext } from 'react';
import SessionContext from '@/context/SessionContext';
import { useTenant } from '@/context/TenantContext';
import { isDefaultTenant } from '@/lib/tenant';

interface TenantOption {
    tenantId: string;
    displayName: string;        // Tenant display name
    users: CachedUser[];        // Users in this tenant
}

export function TenantSwitcher() {
    const { keystore, logout } = useContext(SessionContext);
    const { tenantId: currentTenantId } = useTenant();

    const cachedUsers = keystore.getCachedUsers();

    // Group cached users by tenant
    const tenantOptions = useMemo((): TenantOption[] => {
        const tenantMap = new Map<string, TenantOption>();

        for (const user of cachedUsers) {
            const tid = user.tenantId ?? 'default';
            const existing = tenantMap.get(tid);

            if (existing) {
                existing.users.push(user);
            } else {
                tenantMap.set(tid, {
                    tenantId: tid,
                    displayName: user.tenantDisplayName ?? (isDefaultTenant(tid) ? 'Default' : tid),
                    users: [user],
                });
            }
        }

        return Array.from(tenantMap.values());
    }, [cachedUsers]);

    // Only show if user has cached logins in multiple tenants
    if (tenantOptions.length <= 1) {
        return null;
    }

    const handleSwitchTenant = async (targetTenant: TenantOption) => {
        // 1. Logout from current tenant
        await logout();

        // 2. Redirect to target tenant's login page with pre-selected user hint
        const targetUser = targetTenant.users[0]; // Default to first user
        const loginPath = isDefaultTenant(targetTenant.tenantId)
            ? '/login'
            : `/id/${targetTenant.tenantId}/login`;

        // Navigate with user hint for auto-selection
        window.location.href = `${loginPath}?user=${targetUser.userHandleB64u}`;
    };

    return (
        <div className="tenant-switcher">
            <label>{t('sidebar.switchTenant')}</label>
            <select
                value={currentTenantId ?? 'default'}
                onChange={(e) => {
                    const selected = tenantOptions.find(t => t.tenantId === e.target.value);
                    if (selected) handleSwitchTenant(selected);
                }}
            >
                {tenantOptions.map(tenant => (
                    <option
                        key={tenant.tenantId}
                        value={tenant.tenantId}
                    >
                        {tenant.displayName}
                        {tenant.users.length > 1 && ` (${tenant.users.length} accounts)`}
                    </option>
                ))}
            </select>
        </div>
    );
}
```

### Phase 3: Integration Points

**3.1 Sidebar Integration**
Add tenant switcher to sidebar (only shown when multiple tenants are available):

```tsx
// src/components/Layout/Navigation/Sidebar.jsx

import { TenantSwitcher } from '@/components/TenantSwitcher/TenantSwitcher';

// In the Sidebar component, add after the user info section:
<TenantSwitcher />
```

**3.2 Login Page Enhancement**
Group cached users by tenant on the login page:

```tsx
// src/pages/Login/Login.tsx

// Group cached users by tenant for display
const usersByTenant = useMemo(() => {
    const map = new Map<string, CachedUser[]>();
    for (const user of cachedUsers) {
        const tid = user.tenantId ?? 'default';
        const existing = map.get(tid) ?? [];
        existing.push(user);
        map.set(tid, existing);
    }
    return map;
}, [cachedUsers]);

// Render grouped by tenant
{Array.from(usersByTenant.entries()).map(([tenantId, users]) => (
    <div key={tenantId}>
        {usersByTenant.size > 1 && (
            <h3>{users[0].tenantDisplayName ?? tenantId}</h3>
        )}
        {users.map(user => (
            <Button onClick={() => onLoginCachedUser(user)}>
                {user.displayName}
            </Button>
        ))}
    </div>
))}
```

---

## User Experience Flow

### Switching Tenants (Authenticated User)

```
┌─────────────────────────────────────────────────────────────┐
│  Sidebar                                                     │
│  ─────────                                                   │
│  👤 alice                                                    │
│  📍 Currently: Acme Corp                                    │
│                                                              │
│  [Switch Tenant ▼]                                          │
│    • Acme Corp (current)                                    │
│    • Default                                                 │
│    • University X                                           │
└─────────────────────────────────────────────────────────────┘
                           │
                           │ User selects "University X"
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  1. Logout from current session                             │
│  2. Clear tenant from sessionStorage                        │
│  3. Redirect to /id/university-x/login?user=<handle>        │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  Login Page (University X)                                  │
│  ─────────────────────────                                  │
│  🔒 Pre-selected: bob @ University X                        │
│                                                              │
│  [Continue with Passkey]     [Use Different Account]        │
└─────────────────────────────────────────────────────────────┘
```

### Login Page with Multiple Tenants

```
┌─────────────────────────────────────────────────────────────┐
│  Login                                                       │
│  ─────                                                       │
│                                                              │
│  Acme Corp                                                  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ 👤 alice                                    [Login]  │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  Default                                                     │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ 👤 bob                                      [Login]  │  │
│  │ 👤 charlie                                  [Login]  │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  [Use Another Account]                                      │
└─────────────────────────────────────────────────────────────┘
```

---

## Migration Strategy

### Existing Cached Users
Users who logged in before this feature will have:
- `tenantId: undefined`
- `tenantDisplayName: undefined`

**Migration approach:**
1. On next login, populate the tenant fields
2. Parse legacy `displayName` format (`"name @ tenant"`) as fallback:
   ```typescript
   function migrateLegacyCachedUser(user: CachedUser): CachedUser {
       if (user.tenantId !== undefined) return user;

       const match = user.displayName.match(/^(.+) @ (.+)$/);
       if (match) {
           return {
               ...user,
               displayName: match[1],
               tenantDisplayName: match[2],
               tenantId: undefined, // Will be set on next login
           };
       }
       return { ...user, tenantId: 'default' };
   }
   ```

---

## Security Considerations

1. **No Backend Correlation**: The backend never learns that "alice@tenantA" and "bob@tenantB" are controlled by the same person. All correlation is purely frontend-side based on passkey access.

2. **Session Isolation**: Switching tenants requires a full logout/login cycle. No session tokens or credentials leak between tenants.

3. **localStorage vs sessionStorage**:
   - `cachedUsers` → localStorage (persists across sessions)
   - `currentTenant` → sessionStorage (per-tab isolation)

4. **Cross-Site Considerations**: If tenants are on different origins (future feature), this architecture still works since cached users are stored locally and passkeys are origin-bound.

---

## Implementation Checklist

- [ ] **Phase 1: Data Model**
  - [ ] Extend `CachedUser` type with `tenantId` and `tenantDisplayName`
  - [ ] Add `updateCachedUserTenantInfo()` to keystore
  - [ ] Update `loginWebauthn` to store tenant info
  - [ ] Update `signupWebauthn` to store tenant info
  - [ ] Add migration logic for legacy cached users

- [ ] **Phase 2: Components**
  - [ ] Create `TenantSwitcher` component
  - [ ] Add i18n keys for tenant switching UI
  - [ ] Style tenant switcher for both mobile and desktop

- [ ] **Phase 3: Integration**
  - [ ] Add `TenantSwitcher` to Sidebar
  - [ ] Update Login page to group users by tenant
  - [ ] Add URL parameter support for user pre-selection
  - [ ] Test tenant switching flow end-to-end

- [ ] **Phase 4: Polish**
  - [ ] Add confirmation dialog before switching
  - [ ] Show "switching tenant..." loading state
  - [ ] Handle offline mode gracefully
  - [ ] Add analytics/telemetry for tenant switches (privacy-preserving)

---

## Alternative Approaches Considered

### Option A: Tenant Dropdown Without Logout
**Rejected**: Would require keeping multiple sessions active simultaneously, increasing complexity and security risk.

### Option B: Browser Profile Per Tenant
**Rejected**: Poor UX - users shouldn't need separate browser profiles. Our solution is more user-friendly.

### Option C: Backend Correlation Service
**Rejected**: Violates the privacy constraint that tenants must be isolated. The backend must not be able to link users across tenants.

---

## Open Questions

1. **Should switching require explicit confirmation?**
   Recommendation: Yes, show a confirmation dialog: "Switch to {tenant}? You will be logged out of {currentTenant}."

2. **What if user has 10+ cached identities?**
   Consider pagination or a dedicated "manage identities" page in settings.

3. **Should we auto-login after switch, or always show passkey prompt?**
   Recommendation: Always show passkey prompt for security. The `?user=<handle>` hint pre-selects the account but doesn't bypass authentication.

4. **Mobile UX for tenant switcher?**
   Consider a bottom sheet modal instead of dropdown for better touch interaction.
