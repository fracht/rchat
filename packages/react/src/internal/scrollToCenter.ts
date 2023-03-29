import { getScrollEndValue } from './getScrollEndValue';

export const scrollToCenter = (container: HTMLElement, element: HTMLElement) => {
	const scrollEndValue = getScrollEndValue(container, element);
	container.scrollTo({ top: scrollEndValue });
};
