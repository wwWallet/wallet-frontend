import React from "react";
import { act, render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { LocalStorageKeystore } from "./LocalStorageKeystore";
import { useLocalStorageKeystore } from "./LocalStorageKeystore";

const mocks = vi.hoisted(() => {
	let resolveWrite: (() => void) | undefined;
	let resolveWriteStarted: (() => void) | undefined;
	let writeStarted = Promise.resolve();
	const read = vi.fn(async () => ({ content: {
		prfKeys: [{ credentialId: new Uint8Array([0xaa]) }],
		jwe: "user-a",
	} }));
	const write = vi.fn(async () => await mocks.setWritePending());
	const destroy = vi.fn(async () => undefined);

	return {
		db: { read, write, destroy },
		resetWriteGate: () => {
			writeStarted = new Promise<void>((resolve) => {
				resolveWriteStarted = resolve;
			});
		},
		waitForWriteStarted: () => writeStarted,
		resolveWrite: () => resolveWrite?.(),
		setWritePending: () => new Promise<void>((resolve) => {
			resolveWriteStarted?.();
			resolveWrite = resolve;
		}),
	};
});

vi.mock("react-router-dom", () => ({
	useNavigate: () => vi.fn(),
}));

vi.mock("../hooks/useIndexedDb", () => ({
	useIndexedDb: () => mocks.db,
}));

vi.mock("../indexedDB", () => ({
	getItem: vi.fn(async () => null),
}));

vi.mock("./WalletStateSchema", () => ({
	foldState: vi.fn(() => ({ user: "unlocked" })),
	mergeEventHistories: vi.fn(),
}));

vi.mock("./keystore", async (importOriginal) => {
	const actual = await importOriginal<typeof import("./keystore")>();
	return {
		...actual,
		initPrf: vi.fn(async () => ({
			mainKey: { id: "user-b-main-key" },
			keyInfo: { id: "user-b-key-info" },
		})),
		init: vi.fn(async () => ({
			mainKey: { id: "user-b-main-key" },
			privateData: {
				prfKeys: [{ credentialId: new Uint8Array([0xbb]) }],
				jwe: "user-b",
			},
		})),
		openPrivateData: vi.fn(async () => [{}, {}, {}]),
		importMainKey: vi.fn(async () => ({})),
		exportMainKey: vi.fn(async () => new Uint8Array([0xbb])),
	};
});

const eventTarget = new EventTarget();

function KeystoreProbe({ onReady }: { onReady: (keystore: LocalStorageKeystore) => void }) {
	onReady(useLocalStorageKeystore(eventTarget));
	return null;
}

describe("useLocalStorageKeystore", () => {
	beforeEach(() => {
		window.localStorage.clear();
		window.sessionStorage.clear();
		mocks.resetWriteGate();
		mocks.resolveWrite();

		window.localStorage.setItem("cachedUsers", JSON.stringify([
			{
				displayName: "User A",
				userHandleB64u: "user-a",
				prfKeys: [{ credentialId: { $b64u: "qg" } }],
			},
		]));
		window.localStorage.setItem("userHandle", JSON.stringify("user-a"));
		window.localStorage.setItem("globalTabId", JSON.stringify("tab-a"));
		window.sessionStorage.setItem("userHandle", JSON.stringify("user-a"));
		window.sessionStorage.setItem("tabId", JSON.stringify("tab-a"));
	});

	it("does not update user A's cached PRF keys while unlocking user B", async () => {
		let keystore: LocalStorageKeystore | undefined;
		render(<KeystoreProbe onReady={(value) => { keystore = value; }} />);

		// Let the initial effect load user A's existing private data.
		await act(async () => { await Promise.resolve(); });

		const unlockPromise = keystore!.initPrf(
			{} as PublicKeyCredential,
			new Uint8Array([0xbb]),
			async () => false,
			{ displayName: "User B", userHandle: new TextEncoder().encode("user-b") },
		);

		try {
			// The IndexedDB write is intentionally pending. The cache-sync effect must
			// not observe B's private data with A's still-current user handle.
			await act(async () => { await mocks.waitForWriteStarted(); });

			expect(keystore!.getCachedUsers().find((user) => user.userHandleB64u === "user-a")?.prfKeys)
				.toEqual([{
					credentialId: new Uint8Array([0xaa]),
					transports: undefined,
					prfSalt: undefined,
				}]);
		} finally {
			mocks.resolveWrite();
			await act(async () => { await unlockPromise; });
		}
	});
});
