/**
 * Updates the app icon badge (https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/How_to/Display_badge_on_app_icon)
 * with the given count, or clears it when the count is 0. No-op in browsers without Badging API support.
 */
export async function setAppBadgeCount(count: number): Promise<void> {
	if (!('setAppBadge' in navigator) || !('clearAppBadge' in navigator)) {
		return;
	}
	try {
		if (count > 0) {
			await navigator.setAppBadge(count);
		} else {
			await navigator.clearAppBadge();
		}
	} catch (err) {
		console.warn('Failed to update app badge', err);
	}
}
