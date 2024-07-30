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
