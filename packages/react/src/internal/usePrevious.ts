import { useEffect, useReducer, useRef } from 'react';

export const usePrevious = <T>(value: T): [value: T, invalidate: () => void] => {
    const previous = useRef(value);

    const [triggerValue, trigger] = useReducer((old) => ++old, 0);

    useEffect(() => {
        previous.current = value;
    }, [triggerValue, value]);

    return [previous.current, trigger];
};
