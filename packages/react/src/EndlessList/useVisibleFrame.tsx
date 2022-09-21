import { Key, RefObject, useEffect, useRef, useState } from 'react';
import { useEvent } from '../internal/useEvent';

export type UseVisibleFrameConfig<TValue> = {
	containerReference: RefObject<HTMLElement>;
	items: TValue[];
	getKey: (item: TValue) => Key;
	onVisibleFrameUpdated: (frame: Frame) => void;
};

export type Frame = {
	begin: number;
	end: number;
};

export const useVisibleFrame = <TValue,>({
	containerReference,
	items,
	getKey,
	onVisibleFrameUpdated,
}: UseVisibleFrameConfig<TValue>) => {
	const [observer, setObserver] = useState<IntersectionObserver>();
	const visibilityRecord = useRef<Record<string, boolean>>({});

	const updateVisibleFrame = useEvent((entries: IntersectionObserverEntry[]) => {
		for (const { target, isIntersecting } of entries) {
			const key = (target as HTMLElement).dataset.key;

			if (!key) {
				throw new Error('// TODO: update error');
			}

			visibilityRecord.current[key] = isIntersecting;
		}

		let begin = -1;
		for (const [index, item] of items.entries()) {
			if (visibilityRecord.current[getKey(item)]) {
				begin = index;
				break;
			}
		}

		let end = -1;
		for (let index = items.length - 1; index >= 0; --index) {
			if (visibilityRecord.current[getKey(items[index])]) {
				end = index;
				break;
			}
		}

		onVisibleFrameUpdated({ begin, end });
	});

	useEffect(() => {
		const containerElement = containerReference.current;
		if (containerElement) {
			const observer = new IntersectionObserver(updateVisibleFrame, { root: containerElement, threshold: 1 });

			setObserver(observer);
		}
	}, [containerReference, updateVisibleFrame]);

	return { observer };
};
