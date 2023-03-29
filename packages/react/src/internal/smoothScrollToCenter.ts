import { getScrollEndValue } from './getScrollEndValue';

export type AnimationParameters = {
	/**
	 * Easing function.
	 * Takes an argument in range [0, 1] and returns value in range [0, 1].
	 */
	easing: (t: number) => number;

	/**
	 * Animation duration function.
	 * Takes distance in pixels and returns duration in milliseconds.
	 */
	duration: (distance: number) => number;
};

export const smoothScrollToCenter = async (
	container: HTMLElement,
	element: HTMLElement,
	parameters: AnimationParameters,
	controller?: AbortController,
) => {
	const startPos = container.scrollTop;
	const scrollEndValue = getScrollEndValue(container, element);
	let startTime = 0;

	const duration = parameters.duration(scrollEndValue - startPos);

	return new Promise<void>((resolve, reject) => {
		const scroll = (timestamp: number) => {
			if (controller?.signal.aborted) {
				reject(controller.signal.reason);
				return;
			}
			startTime = startTime || timestamp;
			const elapsed = timestamp - startTime;
			container.scrollTop = startPos + (scrollEndValue - startPos) * parameters.easing(elapsed / duration);
			if (elapsed <= duration) {
				window.requestAnimationFrame(scroll);
			} else {
				resolve();
			}
		};

		if (startPos !== scrollEndValue) {
			window.requestAnimationFrame(scroll);
		} else {
			resolve();
		}
	});
};
