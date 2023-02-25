import { useCallback, useEffect, useRef } from 'react';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyAsyncFunction = (...arguments_: any[]) => Promise<any>;

export const useScheduleOnNextRender = <T extends AnyAsyncFunction>(
	handler: T,
): [schedule: (...parameters: Parameters<T>) => ReturnType<T>, isScheduled: () => boolean] => {
	type PromiseHandle = {
		parameters: Parameters<T>;
		resolve: (value: ReturnType<Awaited<T>>) => void;
		reject: (reason: unknown) => void;
	};
	const unresolvedHandle = useRef<PromiseHandle>();

	useEffect(() => {
		const currentHandle = unresolvedHandle.current;
		unresolvedHandle.current = undefined;
		if (currentHandle) {
			handler(...currentHandle.parameters)
				.then(currentHandle.resolve)
				.catch(currentHandle.reject);
		}
	});

	const wrappedFunction = useCallback((...parameters: Parameters<T>): ReturnType<T> => {
		return new Promise<Awaited<ReturnType<T>>>((resolve, reject) => {
			unresolvedHandle.current = {
				parameters,
				resolve,
				reject,
			};
		}) as ReturnType<T>;
	}, []);

	const isScheduled = useCallback(() => {
		return unresolvedHandle.current !== undefined;
	}, []);

	return [wrappedFunction, isScheduled];
};
