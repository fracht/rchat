export const binarySearch = <TItem, TValue extends TItem = TItem>(
	array: TItem[],
	value: TValue,
	comparator: (a: TValue, b: { value: TItem; index: number }) => number,
): number => {
	let low = 0;
	let high = array.length;

	if (high === 0) {
		return 0;
	}

	while (low < high) {
		const middle = Math.floor((low + high) / 2);

		if (comparator(value, { value: array[middle], index: middle }) > 0) {
			low = middle + 1;
		} else {
			high = middle;
		}
	}

	return high;
};
