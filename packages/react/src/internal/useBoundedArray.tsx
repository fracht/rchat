import { useCallback, useRef, useState } from 'react';

export type KeepDirection = 'beginning' | 'ending';

export type BoundedArrayControl<T> = {
	/**
	 * Add elements to the end of the array.
	 * Clips array by specified "maxSize".
	 * Ensures, that last item won't be clipped.
	 */
	push: (items: T[]) => boolean;
	/**
	 * Add elements to the beginning of the array.
	 * Clips array by specified "maxSize".
	 * Ensures, that first item won't be clipped.
	 */
	unshift: (items: T[]) => boolean;
	/**
	 * Set all elements to the array.
	 * Clips array by specified "maxSize".
	 * Keeps elements according to "keep" argument's value:
	 *   beginning - array will be clipped from the end.
	 *   ending - array will be clipped from the beginning.
	 */
	set: (items: T[], keep: KeepDirection) => boolean;

	insert: (item: T, index: number, keep: KeepDirection) => boolean;
	/**
	 * Works exactly like "Array.prototype.at".
	 */
	at: (index: number) => T | undefined;
	/**
	 * Returns reference to current array.
	 */
	getAll: () => readonly T[];
	/**
	 * Sets state to the old one in order to rerender.
	 */
	refresh: () => void;
};

const getClippedArray = <T,>(items: T[], maxSize: number, keep: KeepDirection) => {
	if (items.length <= maxSize) {
		return items;
	}

	if (keep === 'beginning') {
		return items.slice(0, maxSize);
	}

	if (keep === 'ending') {
		return items.slice(-maxSize);
	}

	throw new Error(`Unrecognized "keep" option value: "${keep}"`);
};

export const useBoundedArray = <T,>(
	initial: T[],
	maxChunkSize: number,
): [items: T[], control: BoundedArrayControl<T>] => {
	const [itemsState, setItemsState] = useState(initial);
	const itemsReference = useRef(initial);

	const setItems = useCallback(
		(items: T[], keep: KeepDirection) => {
			const clippedItems = getClippedArray(items, maxChunkSize, keep);
			setItemsState(clippedItems);
			itemsReference.current = clippedItems;

			return items.length > clippedItems.length;
		},
		[maxChunkSize],
	);

	const unshift = useCallback(
		(items: T[]) => {
			return setItems([...items, ...itemsReference.current], 'beginning');
		},
		[setItems],
	);

	const push = useCallback(
		(items: T[]) => {
			return setItems([...itemsReference.current, ...items], 'ending');
		},
		[setItems],
	);

	const at = useCallback((index: number) => {
		return itemsReference.current.at(index);
	}, []);

	const insert = useCallback(
		(item: T, index: number, keep: KeepDirection) => {
			itemsReference.current.splice(index, 0, item);
			return setItems([...itemsReference.current], keep);
		},
		[setItems],
	);

	const getAll = useCallback(() => itemsReference.current, []);

	const refresh = useCallback(() => setItemsState((old) => [...old]), []);

	return [itemsState, { push, unshift, set: setItems, at, getAll, insert, refresh }];
};
