import { useCallback, useEffect, useState } from 'react';


export type ResetHandle = () => void;

/**
 * Schedules execution of a one-time `callback` after `delayMillis` milliseconds.
 * Returns a callback that will reset the timer.
 */
export function useResettableTimeout(action: () => void, delayMillis: number): ResetHandle {
	const getTime = useCallback(() => new Date().getTime(), []);
	const [startTime, setStartTime] = useState(getTime);

	useEffect(
		() => {
			const timeElapsed = getTime() - startTime;
			const clearTimeoutHandle = setTimeout(action, delayMillis - timeElapsed);
			return () => { clearTimeout(clearTimeoutHandle); };
		},
		[action, delayMillis, getTime, startTime],
	);

	return useCallback(
		() => { setStartTime(getTime); },
		[getTime, setStartTime],
	);
}
