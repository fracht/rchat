import { renderHook, act } from '@testing-library/react';

import { EndlessListItem, useEndlessList, UseEndlessListConfig } from '../../src/EndlessList/useEndlessList';

const renderEndlessListHook = (initialItems: number[], handleJump?: () => Promise<void>, itemKeys?: Set<string>) => {
	const defaultHookConfig: Omit<UseEndlessListConfig<number>, 'initialItems' | 'items' | 'visibleItemKeys'> = {
		getKey: (value) => value.toString(),
		compareItems: (a, b) => a - b,
		handleJump: handleJump ?? jest.fn(),
	};

	const emptySet = new Set<string>();

	type InitialProps = {
		items: number[];
		initialItems?: number[];
		visibleItemKeys?: Set<string>;
	}

	const hookBag = renderHook<EndlessListItem<number>[], InitialProps>(
		({ items, visibleItemKeys, initialItems: propsInitialItems }) =>
			useEndlessList({ ...defaultHookConfig, items, initialItems: propsInitialItems ?? initialItems, visibleItemKeys: { current: visibleItemKeys ?? emptySet } }),
		{
			initialProps: {
				items: initialItems,
				visibleItemKeys: itemKeys,
			},
		},
	);

	return hookBag;
};

describe('useEndlessList', () => {
	it('should not perform jump on first render', () => {
		const initialValues = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
		const jump = jest.fn();
		renderEndlessListHook(initialValues, jump);
		expect(jump).toBeCalledTimes(0);
	})

	it('should set new items when initial items has been changed', () => {
		const initialValues = [1, 2, 3];
		const jump = jest.fn();
		const {result, rerender} = renderEndlessListHook(initialValues, jump);

		const updatedInitialValues = [5, 6];
		rerender({ items: updatedInitialValues, initialItems: updatedInitialValues });

		expect(result.current).toStrictEqual([
			{
				array: updatedInitialValues,
				index: 0,
				focused: false,
				itemKey: '5',
				type: 'real',
				value: 5
			},
			{
				array: updatedInitialValues,
				index: 1,
				focused: false,
				itemKey: '6',
				type: 'real',
				value: 6
			}
		]);
		expect(jump).toBeCalledTimes(0);
	})

	it('must convert items into EndlessListItem', () => {
		const input = [1, 2, 3];
		const { result } = renderEndlessListHook(input);

		expect(result.current).toStrictEqual([
			{
				array: input,
				index: 0,
				focused: false,
				itemKey: '1',
				type: 'real',
				value: 1,
			},
			{
				array: input,
				index: 1,
				focused: false,
				itemKey: '2',
				type: 'real',
				value: 2,
			},
			{
				array: input,
				index: 2,
				focused: false,
				itemKey: '3',
				type: 'real',
				value: 3,
			},
		] satisfies Array<EndlessListItem<number>>);
	});

	it('must return new array of endless list items after rerender', () => {
		const input = [1, 2, 3];
		const { result, rerender } = renderEndlessListHook(input);

		const secondInput = [2, 3, 4];
		rerender({ items: secondInput, visibleItemKeys: undefined });

		expect(result.current).toStrictEqual([
			{
				array: secondInput,
				index: 0,
				focused: false,
				itemKey: '2',
				type: 'real',
				value: 2,
			},
			{
				array: secondInput,
				index: 1,
				focused: false,
				itemKey: '3',
				type: 'real',
				value: 3,
			},
			{
				array: secondInput,
				index: 2,
				focused: false,
				itemKey: '4',
				type: 'real',
				value: 4,
			},
		] satisfies Array<EndlessListItem<number>>);
	});

	it('must return correct items, during jump', async () => {
		const input = [1, 2, 3];
		let resolveJump!: () => void;
		let rejectJump!: () => void;
		const handleJump = jest.fn().mockImplementation(() => {
			if (rejectJump) {
				rejectJump();
			}

			return new Promise<void>((resolve, reject) => {
				resolveJump = resolve;
				rejectJump = reject;
			});
		});
		const { result, rerender } = renderEndlessListHook(input, handleJump);

		const secondInput = [6, 7, 8];
		rerender({ items: secondInput, visibleItemKeys: undefined });

		expect(result.current).toStrictEqual([
			{
				array: input,
				index: 0,
				focused: false,
				itemKey: '1',
				type: 'real',
				value: 1,
			},
			{
				array: input,
				index: 1,
				focused: false,
				itemKey: '2',
				type: 'real',
				value: 2,
			},
			{
				array: input,
				index: 2,
				focused: false,
				itemKey: '3',
				type: 'real',
				value: 3,
			},
			{
				type: 'placeholder',
				itemKey: ':rchat:-1',
			},
			{
				array: secondInput,
				index: 0,
				focused: false,
				itemKey: '6',
				type: 'real',
				value: 6,
			},
			{
				array: secondInput,
				index: 1,
				focused: true,
				itemKey: '7',
				type: 'real',
				value: 7,
			},
			{
				array: secondInput,
				index: 2,
				focused: false,
				itemKey: '8',
				type: 'real',
				value: 8,
			},
		] satisfies Array<EndlessListItem<number>>);

		await act(async () => {
			resolveJump();

			await Promise.resolve();
		});
	});

	it('must return items in correct order, during jump', async () => {
		const input = [6, 7, 8];
		let resolveJump!: () => void;
		let rejectJump!: () => void;
		const handleJump = jest.fn().mockImplementation(() => {
			if (rejectJump) {
				rejectJump();
			}

			return new Promise<void>((resolve, reject) => {
				resolveJump = resolve;
				rejectJump = reject;
			});
		});
		const { result, rerender } = renderEndlessListHook(input, handleJump);

		const secondInput = [1, 2, 3];
		rerender({ items: secondInput, visibleItemKeys: undefined });

		expect(result.current).toStrictEqual([
			{
				array: secondInput,
				index: 0,
				focused: false,
				itemKey: '1',
				type: 'real',
				value: 1,
			},
			{
				array: secondInput,
				index: 1,
				focused: true,
				itemKey: '2',
				type: 'real',
				value: 2,
			},
			{
				array: secondInput,
				index: 2,
				focused: false,
				itemKey: '3',
				type: 'real',
				value: 3,
			},
			{
				type: 'placeholder',
				itemKey: ':rchat:-1',
			},
			{
				array: input,
				index: 0,
				focused: false,
				itemKey: '6',
				type: 'real',
				value: 6,
			},
			{
				array: input,
				index: 1,
				focused: false,
				itemKey: '7',
				type: 'real',
				value: 7,
			},
			{
				array: input,
				index: 2,
				focused: false,
				itemKey: '8',
				type: 'real',
				value: 8,
			},
		] satisfies Array<EndlessListItem<number>>);

		await act(async () => {
			resolveJump();

			await Promise.resolve();
		});
	});

	it('must abort one jump, and continue performing another', async () => {
		const input = [6, 7, 8];
		let resolveJump!: () => void;
		let rejectJump!: () => void;
		const handleJump = jest.fn().mockImplementation((abortController: AbortController) => {
			if (rejectJump) {
				rejectJump();
			}

			return new Promise<void>((resolve, reject) => {
				resolveJump = resolve;
				rejectJump = reject;
				abortController.signal.addEventListener('abort', reject);
			});
		});
		const { result, rerender } = renderEndlessListHook(input, handleJump);

		const secondInput = [1, 2, 3];
		rerender({ items: secondInput, visibleItemKeys: undefined });
		const thirdInput = [4, 5, 6];
		rerender({ items: thirdInput, visibleItemKeys: new Set(['3']) });
		const fixedInput = [2, 3]

		expect(result.current).toStrictEqual([
			{
				array: fixedInput,
				index: 0,
				focused: false,
				itemKey: '2',
				type: 'real',
				value: 2,
			},{
				array: fixedInput,
				index: 1,
				focused: false,
				itemKey: '3',
				type: 'real',
				value: 3,
			},
			{
				type: 'placeholder',
				itemKey: ':rchat:-2',
			},
			{
				array: thirdInput,
				index: 0,
				focused: false,
				itemKey: '4',
				type: 'real',
				value: 4,
			},
			{
				array: thirdInput,
				index: 1,
				focused: true,
				itemKey: '5',
				type: 'real',
				value: 5,
			},
			{
				array: thirdInput,
				index: 2,
				focused: false,
				itemKey: '6',
				type: 'real',
				value: 6,
			},
		] satisfies Array<EndlessListItem<number>>);

		await act(async () => {
			resolveJump();

			await Promise.resolve();
		});

		expect(result.current).toStrictEqual([
			{
				array: thirdInput,
				index: 0,
				focused: false,
				itemKey: '4',
				type: 'real',
				value: 4,
			},
			{
				array: thirdInput,
				index: 1,
				focused: false,
				itemKey: '5',
				type: 'real',
				value: 5,
			},
			{
				array: thirdInput,
				index: 2,
				focused: false,
				itemKey: '6',
				type: 'real',
				value: 6,
			},
		] satisfies Array<EndlessListItem<number>>);
	});

	it('must abort one jump, and continue performing another (ensure correct item order)', async () => {
		const input = [7, 8, 9];
		let resolveJump!: () => void;
		let rejectJump!: () => void;
		const handleJump = jest.fn().mockImplementation((abortController: AbortController) => {
			if (rejectJump) {
				rejectJump();
			}

			return new Promise<void>((resolve, reject) => {
				resolveJump = resolve;
				rejectJump = reject;
				abortController.signal.addEventListener('abort', reject);
			});
		});
		const { result, rerender } = renderEndlessListHook(input, handleJump);

		const secondInput = [4, 5, 6];
		rerender({ items: secondInput, visibleItemKeys: undefined });
		const thirdInput = [1, 2, 3];
		rerender({ items: thirdInput, visibleItemKeys: new Set([':rchat:-1', '7', '8']) });
		const fixedInput = [7, 8, 9]

		expect(result.current).toStrictEqual([
			{
				array: thirdInput,
				index: 0,
				focused: false,
				itemKey: '1',
				type: 'real',
				value: 1,
			},
			{
				array: thirdInput,
				index: 1,
				focused: true,
				itemKey: '2',
				type: 'real',
				value: 2,
			},
			{
				array: thirdInput,
				index: 2,
				focused: false,
				itemKey: '3',
				type: 'real',
				value: 3,
			},
			{
				type: 'placeholder',
				itemKey: ':rchat:-1'
			},
			{
				array: fixedInput,
				index: 0,
				focused: false,
				itemKey: '7',
				type: 'real',
				value: 7,
			},
			{
				array: fixedInput,
				index: 1,
				focused: false,
				itemKey: '8',
				type: 'real',
				value: 8,
			},
			{
				array: fixedInput,
				index: 2,
				focused: false,
				itemKey: '9',
				type: 'real',
				value: 9,
			},
		] satisfies Array<EndlessListItem<number>>);

		await act(async () => {
			resolveJump();

			await Promise.resolve();
		});

		expect(result.current).toStrictEqual([
			{
				array: thirdInput,
				index: 0,
				focused: false,
				itemKey: '1',
				type: 'real',
				value: 1,
			},
			{
				array: thirdInput,
				index: 1,
				focused: false,
				itemKey: '2',
				type: 'real',
				value: 2,
			},
			{
				array: thirdInput,
				index: 2,
				focused: false,
				itemKey: '3',
				type: 'real',
				value: 3,
			},
		] satisfies Array<EndlessListItem<number>>);
	});

	it('must repeat jump algorithm, if the same array came twice', async () => {
		const input = [7, 8, 9];
		let resolveJump!: () => void;
		let rejectJump!: () => void;
		const handleJump = jest.fn().mockImplementation((abortController: AbortController) => {
			if (rejectJump) {
				rejectJump();
			}

			return new Promise<void>((resolve, reject) => {
				resolveJump = resolve;
				rejectJump = reject;
				abortController.signal.addEventListener('abort', reject);
			});
		});
		const { result, rerender } = renderEndlessListHook(input, handleJump);

		const secondInput = [1, 2, 3, 4, 5, 6];
		rerender({ items: secondInput, visibleItemKeys: undefined });
		const thirdInput = [1, 2, 3];
		rerender({ items: thirdInput, visibleItemKeys: new Set(['7', '8']) });
		const fixedInput = [7, 8, 9]

		expect(result.current).toStrictEqual([
			{
				array: thirdInput,
				index: 0,
				focused: false,
				itemKey: '1',
				type: 'real',
				value: 1,
			},
			{
				array: thirdInput,
				index: 1,
				focused: true,
				itemKey: '2',
				type: 'real',
				value: 2,
			},
			{
				array: thirdInput,
				index: 2,
				focused: false,
				itemKey: '3',
				type: 'real',
				value: 3,
			},
			{
				type: 'placeholder',
				itemKey: ':rchat:-2',
			},
			{
				array: fixedInput,
				index: 0,
				focused: false,
				itemKey: '7',
				type: 'real',
				value: 7,
			},
			{
				array: fixedInput,
				index: 1,
				focused: false,
				itemKey: '8',
				type: 'real',
				value: 8,
			},
			{
				array: fixedInput,
				index: 2,
				focused: false,
				itemKey: '9',
				type: 'real',
				value: 9,
			},
		] satisfies Array<EndlessListItem<number>>);

		await act(async () => {
			resolveJump();

			await Promise.resolve();
		});

		expect(result.current).toStrictEqual([
			{
				array: thirdInput,
				index: 0,
				focused: false,
				itemKey: '1',
				type: 'real',
				value: 1,
			},
			{
				array: thirdInput,
				index: 1,
				focused: false,
				itemKey: '2',
				type: 'real',
				value: 2,
			},
			{
				array: thirdInput,
				index: 2,
				focused: false,
				itemKey: '3',
				type: 'real',
				value: 3,
			},
		] satisfies Array<EndlessListItem<number>>);
	});

	it('must not duplicate placeholders, when jump aborted', async () => {
		const input = [6, 7, 8];
		let resolveJump!: () => void;
		let rejectJump!: () => void;
		const handleJump = jest.fn().mockImplementation((abortController: AbortController) => {
			if (rejectJump) {
				rejectJump();
			}

			return new Promise<void>((resolve, reject) => {
				resolveJump = resolve;
				rejectJump = reject;
				abortController.signal.addEventListener('abort', reject);
			});
		});
		const { result, rerender } = renderEndlessListHook(input, handleJump);

		const secondInput = [1, 2, 3];
		rerender({ items: secondInput, visibleItemKeys: undefined });
		const thirdInput = [4, 5, 6];
		rerender({ items: thirdInput, visibleItemKeys: new Set(['3', ':rchat:-1']) });
		const fixedInput = [2, 3];

		expect(result.current).toStrictEqual([
			{
				array: fixedInput,
				index: 0,
				focused: false,
				itemKey: '2',
				type: 'real',
				value: 2,
			},{
				array: fixedInput,
				index: 1,
				focused: false,
				itemKey: '3',
				type: 'real',
				value: 3,
			},
			{
				type: 'placeholder',
				itemKey: ':rchat:-1',
			},
			{
				array: thirdInput,
				index: 0,
				focused: false,
				itemKey: '4',
				type: 'real',
				value: 4,
			},
			{
				array: thirdInput,
				index: 1,
				focused: true,
				itemKey: '5',
				type: 'real',
				value: 5,
			},
			{
				array: thirdInput,
				index: 2,
				focused: false,
				itemKey: '6',
				type: 'real',
				value: 6,
			},
		] satisfies Array<EndlessListItem<number>>);

		await act(async () => {
			resolveJump();

			await Promise.resolve();
		});

		expect(result.current).toStrictEqual([
			{
				array: thirdInput,
				index: 0,
				focused: false,
				itemKey: '4',
				type: 'real',
				value: 4,
			},
			{
				array: thirdInput,
				index: 1,
				focused: false,
				itemKey: '5',
				type: 'real',
				value: 5,
			},
			{
				array: thirdInput,
				index: 2,
				focused: false,
				itemKey: '6',
				type: 'real',
				value: 6,
			},
		] satisfies Array<EndlessListItem<number>>);
	});

	it('must merge incoming and existing items', async () => {
		const input = [6, 7, 8];
		let resolveJump!: () => void;
		let rejectJump!: () => void;
		const handleJump = jest.fn().mockImplementation((abortController: AbortController) => {
			if (rejectJump) {
				rejectJump();
			}

			return new Promise<void>((resolve, reject) => {
				resolveJump = resolve;
				rejectJump = reject;
				abortController.signal.addEventListener('abort', reject);
			});
		});
		const { result, rerender } = renderEndlessListHook(input, handleJump);

		const secondInput = [1, 2, 3];
		rerender({ items: secondInput, visibleItemKeys: undefined });
		const thirdInput = [4, 5, 6];
		rerender({ items: thirdInput, visibleItemKeys: new Set([':rchat:-1', '6', '7', '8']) });

		const mergedInput = [4, 5, 6, 7, 8];

		expect(result.current).toStrictEqual([
			{
				itemKey: ':rchat:-1',
				type: 'placeholder'
			},
			{
				array: mergedInput,
				index: 0,
				focused: false,
				itemKey: '4',
				type: 'real',
				value: 4,
			},
			{
				array: mergedInput,
				index: 1,
				focused: true,
				itemKey: '5',
				type: 'real',
				value: 5,
			},
			{
				array: mergedInput,
				index: 2,
				focused: false,
				itemKey: '6',
				type: 'real',
				value: 6,
			},
			{
				array: mergedInput,
				index: 3,
				focused: false,
				itemKey: '7',
				type: 'real',
				value: 7,
			},
			{
				array: mergedInput,
				index: 4,
				focused: false,
				itemKey: '8',
				type: 'real',
				value: 8,
			},
		] satisfies Array<EndlessListItem<number>>);

		await act(async () => {
			resolveJump();

			await Promise.resolve();
		});

		expect(result.current).toStrictEqual([
			{
				array: thirdInput,
				index: 0,
				focused: false,
				itemKey: '4',
				type: 'real',
				value: 4,
			},
			{
				array: thirdInput,
				index: 1,
				focused: false,
				itemKey: '5',
				type: 'real',
				value: 5,
			},
			{
				array: thirdInput,
				index: 2,
				focused: false,
				itemKey: '6',
				type: 'real',
				value: 6,
			},
		] satisfies Array<EndlessListItem<number>>)
	});

	it('must merge incoming and existing items (array with placeholder)', async () => {
		const input = [6, 7, 8];
		let resolveJump!: () => void;
		let rejectJump!: () => void;
		const handleJump = jest.fn().mockImplementation((abortController: AbortController) => {
			if (rejectJump) {
				rejectJump();
			}

			return new Promise<void>((resolve, reject) => {
				resolveJump = resolve;
				rejectJump = reject;
				abortController.signal.addEventListener('abort', reject);
			});
		});
		const { result, rerender } = renderEndlessListHook(input, handleJump);

		const secondInput = [1, 2, 3];
		rerender({ items: secondInput, visibleItemKeys: undefined });
		const thirdInput = [4, 5, 6];
		rerender({ items: thirdInput, visibleItemKeys: new Set(['2', '3', ':rchat:-1', '6', '7']) });

		const mergedInput = [1, 2, 3];
		const mergedInput2 = [4, 5, 6, 7, 8];

		expect(result.current).toStrictEqual([
			{
				array: mergedInput,
				index: 0,
				focused: false,
				itemKey: '1',
				type: 'real',
				value: 1,
			},{
				array: mergedInput,
				index: 1,
				focused: false,
				itemKey: '2',
				type: 'real',
				value: 2,
			},
			{
				array: mergedInput,
				index: 2,
				focused: false,
				itemKey: '3',
				type: 'real',
				value: 3,
			},
			{
				itemKey: ':rchat:-1',
				type: 'placeholder'
			},
			{
				array: mergedInput2,
				index: 0,
				focused: false,
				itemKey: '4',
				type: 'real',
				value: 4,
			},
			{
				array: mergedInput2,
				index: 1,
				focused: true,
				itemKey: '5',
				type: 'real',
				value: 5,
			},
			{
				array: mergedInput2,
				index: 2,
				focused: false,
				itemKey: '6',
				type: 'real',
				value: 6,
			},
			{
				array: mergedInput2,
				index: 3,
				focused: false,
				itemKey: '7',
				type: 'real',
				value: 7,
			},
			{
				array: mergedInput2,
				index: 4,
				focused: false,
				itemKey: '8',
				type: 'real',
				value: 8,
			},
		] satisfies Array<EndlessListItem<number>>);

		await act(async () => {
			resolveJump();

			await Promise.resolve();
		});

		expect(result.current).toStrictEqual([
			{
				array: thirdInput,
				index: 0,
				focused: false,
				itemKey: '4',
				type: 'real',
				value: 4,
			},
			{
				array: thirdInput,
				index: 1,
				focused: false,
				itemKey: '5',
				type: 'real',
				value: 5,
			},
			{
				array: thirdInput,
				index: 2,
				focused: false,
				itemKey: '6',
				type: 'real',
				value: 6,
			},
		] satisfies Array<EndlessListItem<number>>)
	});

	it('must merge incoming and existing items (array with placeholder, correct direction)', async () => {
		const input = [6, 7, 8];
		let resolveJump!: () => void;
		let rejectJump!: () => void;
		const handleJump = jest.fn().mockImplementation((abortController: AbortController) => {
			if (rejectJump) {
				rejectJump();
			}

			return new Promise<void>((resolve, reject) => {
				resolveJump = resolve;
				rejectJump = reject;
				abortController.signal.addEventListener('abort', reject);
			});
		});
		const { result, rerender } = renderEndlessListHook(input, handleJump);

		const secondInput = [1, 2, 3];
		rerender({ items: secondInput, visibleItemKeys: undefined });
		const thirdInput = [3, 4, 5];
		rerender({ items: thirdInput, visibleItemKeys: new Set(['2', '3', ':rchat:-1', '6', '7']) });

		const mergedInput = [1, 2, 3, 4, 5];
		const mergedInput2 = [6, 7, 8];

		expect(result.current).toStrictEqual([
			{
				array: mergedInput,
				index: 0,
				focused: false,
				itemKey: '1',
				type: 'real',
				value: 1,
			},
			{
				array: mergedInput,
				index: 1,
				focused: false,
				itemKey: '2',
				type: 'real',
				value: 2,
			},
			{
				array: mergedInput,
				index: 2,
				focused: false,
				itemKey: '3',
				type: 'real',
				value: 3,
			},
			{
				array: mergedInput,
				index: 3,
				focused: true,
				itemKey: '4',
				type: 'real',
				value: 4,
			},
			{
				array: mergedInput,
				index: 4,
				focused: false,
				itemKey: '5',
				type: 'real',
				value: 5,
			},
			{
				itemKey: ':rchat:-1',
				type: 'placeholder'
			},
			{
				array: mergedInput2,
				index: 0,
				focused: false,
				itemKey: '6',
				type: 'real',
				value: 6,
			},
			{
				array: mergedInput2,
				index: 1,
				focused: false,
				itemKey: '7',
				type: 'real',
				value: 7,
			},
			{
				array: mergedInput2,
				index: 2,
				focused: false,
				itemKey: '8',
				type: 'real',
				value: 8,
			},
		] satisfies Array<EndlessListItem<number>>);

		await act(async () => {
			resolveJump();

			await Promise.resolve();
		});

		expect(result.current).toStrictEqual([
			{
				array: thirdInput,
				index: 0,
				focused: false,
				itemKey: '3',
				type: 'real',
				value: 3,
			},
			{
				array: thirdInput,
				index: 1,
				focused: false,
				itemKey: '4',
				type: 'real',
				value: 4,
			},
			{
				array: thirdInput,
				index: 2,
				focused: false,
				itemKey: '5',
				type: 'real',
				value: 5,
			},
		] satisfies Array<EndlessListItem<number>>)
	});
});
