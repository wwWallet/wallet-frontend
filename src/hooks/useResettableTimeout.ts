import { useCallback, useEffect, useRef } from 'react';


export type ResetHandle = () => void;

/**
 * Schedules execution of a one-time `callback` after `delayMillis` milliseconds.
 * Returns a callback that will reset the timer.
 */
export function useResettableTimeout(action: () => void, delayMillis: number): ResetHandle {
	const startTimeRef = useRef<number | null>(null);
	const timerRef = useRef<NodeJS.Timeout>();

	const start = useCallback(
		() => {
			const getTime = () => new Date().getTime();

			if (timerRef.current) {
				clearTimeout(timerRef.current);
			}
			if (!startTimeRef.current) {
				startTimeRef.current = getTime();
			}

			// If the timer was already started, then the action or the delay has changed.
			// "Resume" the timer from the time already elapsed instead of starting over.
			const timeElapsed = getTime() - startTimeRef.current;
			timerRef.current = setTimeout(action, delayMillis - timeElapsed);
		},
		[action, delayMillis, startTimeRef, timerRef],
	);

	const reset = useCallback(
		() => {
			startTimeRef.current = null;
			start();
		},
		[start, startTimeRef],
	);

	useEffect(start, [start]);

	return reset;
}
