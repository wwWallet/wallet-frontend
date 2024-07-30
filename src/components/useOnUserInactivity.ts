import { useEffect } from 'react';
import { useResettableTimeout } from './useResettableTimeout';
import { debounce } from '../util';


/**
 * Schedules execution of a one-time `callback` after `timeoutMillis` milliseconds.
 * The timer resets whenever the user interacts with the application,
 * but at most once every `timeoutMillis / 4` milliseconds.
 */
export function useOnUserInactivity(action: () => void, timeoutMillis: number) {
	const resetTimeout = useResettableTimeout(action, timeoutMillis);

	useEffect(
		() => {
			// I would have liked to use the User Activation API
			// (https://developer.mozilla.org/en-US/docs/Web/API/UserActivation/isActive)
			// for this, but it doesn't appear to provide an event source and the
			// transient activation duration is on the order of a few seconds, so
			// you'd have to poll `navigator.userActivation.isActive` in a fairly
			// tight loop in order to actually hit the transient activation window.

			const debouncedReset = debounce(resetTimeout, timeoutMillis / 4);
			const eventTypes = ["keydown", "pointermove", "pointerdown"];
			for (const eventType of eventTypes) {
				window.document.addEventListener(eventType, debouncedReset, { passive: true });
			}
			return () => {
				for (const eventType of eventTypes) {
					window.document.removeEventListener(eventType, debouncedReset);
				}
			}
		},
		[resetTimeout, timeoutMillis],
	);
}
