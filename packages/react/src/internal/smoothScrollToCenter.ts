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
	const elementRect = element.getBoundingClientRect();
	const containerRect = container.getBoundingClientRect();

	const top = elementRect.top - containerRect.top - containerRect.height / 2 + elementRect.height / 2;

	const startPos = container.scrollTop;
	const clientHeight = container.clientHeight;
	const maxScroll = container.scrollHeight - clientHeight;
	const scrollIntendedDestination = startPos + top;
	const scrollEndValue = Math.min(Math.max(scrollIntendedDestination, 0), maxScroll);
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
