import { useEffect } from 'react';
import { useEvent } from '../internal/useEvent';

export type UseVisibleFrameConfig<TValue> = {
	items: TValue[];
	getKey: (item: TValue) => string;
	onVisibleFrameUpdated: (frame: Frame) => void;
	visibleItemKeys: Set<string>;
};

export type Frame = {
	begin: number;
	end: number;
};

export const useVisibleFrame = <TValue,>({
	visibleItemKeys,
	items,
	getKey,
	onVisibleFrameUpdated,
}: UseVisibleFrameConfig<TValue>): void => {
	const updateVisibleFrame = useEvent((visibleItemKeys: Set<string>) => {
		let begin = -1;
		for (const [index, item] of items.entries()) {
			if (visibleItemKeys.has(getKey(item))) {
				begin = index;
				break;
			}
		}

		let end = -1;
		for (let index = 0; index <= items.length; ++index) {
			const item = items.at(-index - 1);
			if (item && visibleItemKeys.has(getKey(item))) {
				end = index;
				break;
			}
		}

		onVisibleFrameUpdated({ begin, end });
	});

	useEffect(() => {
		updateVisibleFrame(visibleItemKeys);
	}, [visibleItemKeys, updateVisibleFrame]);
};
