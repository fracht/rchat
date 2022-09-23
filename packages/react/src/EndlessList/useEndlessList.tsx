import { Key, useCallback, useMemo, useRef, useState } from 'react';
import useIsomorphicLayoutEffect from 'use-isomorphic-layout-effect';

export type UseEndlessListConfig<T> = {
	items: T[];
	getKey: (item: T) => Key;
	compareItems: (a: T, b: T) => number;
	handleJump: () => Promise<void>;
	focusedItemKey?: Key;
};

export type EndlessListRealItem<TValue> = {
	type: 'real';
	value: TValue;
	index: number;
	array: TValue[];
	itemKey: Key;
	focused: boolean;
};

export type EndlessListPlaceholderItem = {
	type: 'placeholder';
	itemKey: Key;
};

export type EndlessListItem<TValue> = EndlessListRealItem<TValue> | EndlessListPlaceholderItem;

const valueToEndlessListItem = <T,>(getKey: (value: T) => Key, focusItemKey?: Key) => {
	return (value: T, index: number, array: T[]): EndlessListItem<T> => {
		const key = getKey(value);

		return {
			type: 'real',
			value,
			index,
			array,
			focused: key === focusItemKey,
			itemKey: key,
		};
	};
};

export const useEndlessList = <T,>({
	getKey,
	items,
	compareItems,
	handleJump,
	focusedItemKey,
}: UseEndlessListConfig<T>): Array<EndlessListItem<T>> => {
	type JumpItems = {
		prev: T[];
		next: T[];
		jumpKey: Key;
	};

	const oldItems = useRef(items);

	const [isPerformingJump, setIsPerformingJump] = useState(false);

	const jump = useCallback(async () => {
		if (!isPerformingJump) {
			return;
		}
		await handleJump();

		oldItems.current = items;
		setIsPerformingJump(false);
	}, [handleJump, isPerformingJump, items]);

	useIsomorphicLayoutEffect(() => {
		jump();
	}, [jump]);

	const jumpItems = useMemo(() => {
		if (items.length === 0 || oldItems.current.length === 0) {
			oldItems.current = items;
			return undefined;
		}

		const keys = items.map(getKey);
		const oldKeys = oldItems.current.map(getKey);

		const mustMoveForward = !oldKeys.includes(keys[0]) || !keys.includes(oldKeys.at(-1)!);
		const mustMoveBack = !keys.includes(oldKeys[0]) || !oldKeys.includes(keys.at(-1)!);

		const mustJump = mustMoveForward && mustMoveBack;

		if (mustJump) {
			const jumpDirection = compareItems(items[0], oldItems.current[0]) > 0 ? 'forward' : 'back';

			const jumpKey = getKey(items[items.length / 2]);

			let newJumpItems: JumpItems | undefined;

			if (jumpDirection === 'forward') {
				newJumpItems = { next: items, prev: oldItems.current, jumpKey };
			} else {
				newJumpItems = { next: oldItems.current, prev: items, jumpKey };
			}
			setIsPerformingJump(true);

			return newJumpItems;
		} else {
			oldItems.current = items;
		}
		return undefined;
	}, [compareItems, getKey, items]);

	const visibleItems = useMemo<Array<EndlessListItem<T>>>(() => {
		if (!isPerformingJump || !jumpItems) {
			return items.map(valueToEndlessListItem(getKey, focusedItemKey));
		}

		return [
			...jumpItems.next.map(valueToEndlessListItem(getKey, focusedItemKey ?? jumpItems.jumpKey)),
			{ type: 'placeholder', itemKey: -1 },
			...jumpItems.prev.map(valueToEndlessListItem(getKey, focusedItemKey ?? jumpItems.jumpKey)),
		];
	}, [focusedItemKey, getKey, isPerformingJump, items, jumpItems]);

	return visibleItems;
};
