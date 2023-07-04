import { Key, useMemo, useRef, useState, MutableRefObject, useEffect } from 'react';
import useIsomorphicLayoutEffect from 'use-isomorphic-layout-effect';
import { binarySearch } from '../internal/binarySearch';
import { useEvent } from '../internal/useEvent';
import { useIdGenerator } from '../internal/useIdGenerator';

export type UseEndlessListConfig<T> = {
	initialItems: T[];
	items: T[];
	getKey: (item: T) => string;
	compareItems: (a: T, b: T) => number;
	handleJump: (abortController: AbortController) => Promise<void>;
	focusedItem?: T;
	visibleItemKeys: MutableRefObject<Set<string>>;
	lastScrolledItem: MutableRefObject<T | undefined>;
};

export type EndlessListRealItem<TValue> = {
	type: 'real';
	value: TValue;
	index: number;
	array: TValue[];
	itemKey: string;
	focused: boolean;
};

export type EndlessListPlaceholderItem = {
	type: 'placeholder';
	itemKey: string;
};

export type EndlessListItem<TValue> = EndlessListRealItem<TValue> | EndlessListPlaceholderItem;

const valueToEndlessListItem = <T,>(getKey: (value: T) => string, focusItemKey: string | undefined) => {
	return (value: T, index: number, array: T[]): EndlessListRealItem<T> => {
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
	initialItems,
	items,
	getKey,
	focusedItem,
	compareItems,
	handleJump,
	visibleItemKeys,
	lastScrolledItem,
}: UseEndlessListConfig<T>): Array<EndlessListItem<T>> => {
	const focusedItemKey = focusedItem === undefined ? undefined : getKey(focusedItem);
	const defaultConvertItem = useMemo(() => valueToEndlessListItem(getKey, focusedItemKey), [getKey, focusedItemKey]);
	const [renderedItems, setRenderedItems] = useState<Array<EndlessListItem<T>>>(() => items.map(defaultConvertItem));
	const jumpAbortController = useRef<AbortController>();
	const initialItemsReference = useRef(initialItems);
	const hasMounted = useRef(false);

	const getUniquePlaceholderKey = useIdGenerator();

	const performFixup = useEvent((): [items: Array<EndlessListItem<T>>, constructItems: boolean] => {
		/**
		 * Visible items fixup algorithm.
		 *
		 * Firstly, take all items, which are displayed on the screen.
		 */

		const visibleItems = renderedItems
			.filter(({ itemKey, type }, index, array) => {
				if (visibleItemKeys.current.has(itemKey)) {
					return true;
				}

				if (type === 'placeholder') {
					return false;
				}

				const previousItem = array[index - 1];
				if (
					previousItem &&
					previousItem.type !== 'placeholder' &&
					visibleItemKeys.current.has(previousItem.itemKey)
				) {
					return true;
				}

				const nextItem = array[index + 1];
				if (nextItem && nextItem.type !== 'placeholder' && visibleItemKeys.current.has(nextItem.itemKey)) {
					return true;
				}

				return false;
			})
			.map((item) => {
				if (item.type === 'real' && item.focused) {
					item.focused = false;
				}

				return item;
			});

		const keys = new Set(items.map(getKey));
		if (visibleItems.every((item) => !keys.has(item.itemKey))) {
			return [visibleItems, true];
		}

		const comparator = (a: EndlessListRealItem<T>, b: { value: EndlessListItem<T>; index: number }): number => {
			if (b.value.type === 'placeholder') {
				const nextValue = visibleItems[b.index + 1];

				if (nextValue !== undefined && nextValue.type !== 'placeholder') {
					return compareItems(nextValue.value, a.value);
				}

				return 1;
			}

			return compareItems(a.value, b.value.value);
		};

		const jumpKey = focusedItemKey ?? getKey(items[Math.floor(items.length / 2)]);
		const convertedItems = [...items.map(valueToEndlessListItem(getKey, jumpKey))];

		let pivotIndex = visibleItems.findIndex((item) => keys.has(item.itemKey));

		if (pivotIndex === -1) {
			pivotIndex = binarySearch(visibleItems, convertedItems.at(0)!, comparator);
		}
		visibleItems.splice(pivotIndex, 1, ...convertedItems);

		const dedupedKeys = new Set<Key>();
		const filteredItems = visibleItems.filter((item) => {
			if (dedupedKeys.has(item.itemKey)) {
				return false;
			}

			dedupedKeys.add(item.itemKey);
			return true;
		});

		return [filteredItems, false];
	});

	const update = useEvent(async () => {
		if (jumpAbortController.current) {
			jumpAbortController.current.abort();
			jumpAbortController.current = undefined;
		}

		if (renderedItems.length === 0 || items.length === 0 || initialItemsReference.current !== initialItems) {
			/**
			 * There is nothing to do:
			 *   1. If renderedItems array is empty, it means that there is nothing on the screen - render all items.
			 *   2. If items array is empty, it means that all items must disappear from the screen.
			 * 	 3. If initial items has been changed
			 */
			setRenderedItems(items.map(defaultConvertItem));
			initialItemsReference.current = initialItems;
			return;
		}

		/**
		 * Determine, if current update call has aborted previous jump.
		 */
		const isAbortedPreviousJump = renderedItems.some((item) => item.type === 'placeholder');

		let oldItems: Array<EndlessListItem<T>>;
		let constructItems = true;
		if (isAbortedPreviousJump) {
			/**
			 * Previous jump was terminated by current state update.
			 * Must perform one-time fixup.
			 */
			[oldItems, constructItems] = performFixup();

			let array = [];
			let index = 0;
			for (const item of oldItems) {
				if (item.type === 'placeholder') {
					index = 0;
					array = [];
				} else {
					item.index = index;
					item.array = array;
					array.push(item.value);
					++index;
				}
			}
		} else {
			const keys = items.map(getKey);
			const oldKeys = renderedItems.map((item) => item.itemKey);

			const mustMoveForward = !oldKeys.includes(keys[0]) && !keys.includes(oldKeys.at(-1)!);
			const mustMoveBack = !keys.includes(oldKeys[0]) && !oldKeys.includes(keys.at(-1)!);

			const mustJump = mustMoveForward && mustMoveBack;

			if (!mustJump) {
				setRenderedItems(items.map(defaultConvertItem));
				return;
			}
			oldItems = renderedItems.map((item) => {
				if (item.type === 'real' && item.focused) {
					item.focused = false;
				}

				return item;
			});
		}

		let constructedItems: Array<EndlessListItem<T>>;
		if (constructItems) {
			const firstItem = oldItems.find((item): item is EndlessListRealItem<T> => item.type === 'real');
			let jumpDirection = 'forward';
			if (firstItem) {
				jumpDirection = compareItems(items[0], firstItem.value) < 0 ? 'forward' : 'back';
			}

			const jumpKey = focusedItemKey ?? getKey(items[Math.floor(items.length / 2)]);

			let nextItems: Array<EndlessListItem<T>> | undefined;
			let previousItems: Array<EndlessListItem<T>> | undefined;

			const convertItem = valueToEndlessListItem(getKey, jumpKey);
			if (jumpDirection === 'forward') {
				nextItems = items.map(convertItem);
				previousItems = oldItems;
			} else {
				nextItems = oldItems;
				previousItems = items.map(convertItem);
			}

			const alreadyHasPlaceholder =
				nextItems.at(-1)?.type === 'placeholder' || previousItems.at(0)?.type === 'placeholder';

			constructedItems = [
				...nextItems,
				...(alreadyHasPlaceholder
					? []
					: [{ type: 'placeholder' as const, itemKey: getUniquePlaceholderKey() }]),
				...previousItems,
			];
		} else {
			constructedItems = oldItems;
		}

		lastScrolledItem.current = items[Math.floor(items.length / 2)];

		setRenderedItems(constructedItems);
		const newController = new AbortController();
		jumpAbortController.current = newController;

		try {
			if (hasMounted.current) {
				await handleJump(newController);
			}

			setRenderedItems(items.map(defaultConvertItem));
		} catch {
			/* Noop */
		} finally {
			jumpAbortController.current = undefined;
		}
	});

	useIsomorphicLayoutEffect(() => {
		update();
		hasMounted.current = true;
	}, [update, items]);

	useEffect(() => {
		return () => {
			hasMounted.current = false;
		};
	}, []);

	return useMemo(() => {
		if (focusedItemKey === undefined) {
			return renderedItems;
		}

		return renderedItems.map((item) => {
			if (item.type === 'real') {
				item.focused = item.itemKey === focusedItemKey;
			}
			return item;
		});
	}, [renderedItems, focusedItemKey]);
};
