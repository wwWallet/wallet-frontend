import { RefCallback, useEffect, useRef } from "react";

export function useInterval(callback: any, delay: number) {
    const savedCallback: React.MutableRefObject<any> = useRef();
    // Remember the latest callback.
    useEffect(() => {
        savedCallback.current = callback;
    }, [callback]);

    // Set up the interval.
    useEffect(() => {
        function tick() {
            if (savedCallback.current) savedCallback.current();
        }
        if (delay != null) {
            const id = setInterval(tick, delay);
            return () => {
                clearInterval(id);
            };
        };
    }, [callback, delay]);
}