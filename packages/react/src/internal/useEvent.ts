import { useCallback, useRef } from 'react';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyFunction = (...arguments_: any[]) => any;

export const useEvent = <T extends AnyFunction>(handler: T): T => {
	const handlerReference = useRef(handler);
	handlerReference.current = handler;

	return useCallback((...parameters: Parameters<T>): ReturnType<T> => {
		return handlerReference.current(...parameters);
	}, []) as T;
};
