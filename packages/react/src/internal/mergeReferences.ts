import { Ref, MutableRefObject } from 'react';

export const mergeReferences = <T>(
	...inputReferences: Array<Ref<T> | MutableRefObject<T> | undefined | false>
): Ref<T> | undefined => {
	const filteredInputReferences = inputReferences.filter(Boolean as unknown as (value: unknown) => value is Ref<T>);

	if (filteredInputReferences.length <= 1) {
		return filteredInputReferences[0];
	}
	return function mergedReferences(reference: T | null) {
		for (const inputReference of filteredInputReferences) {
			if (typeof inputReference === 'function') {
				inputReference(reference);
			} else if (inputReference) {
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				(inputReference as any).current = reference;
			}
		}
	};
};
