export const getScrollEndValue = (container: HTMLElement, element: HTMLElement) => {
	const elementRect = element.getBoundingClientRect();
	const containerRect = container.getBoundingClientRect();

	const top = elementRect.top - containerRect.top - containerRect.height / 2 + elementRect.height / 2;

	const startPos = container.scrollTop;
	const clientHeight = container.clientHeight;
	const maxScroll = container.scrollHeight - clientHeight;
	const scrollIntendedDestination = startPos + top;
	return Math.min(Math.max(scrollIntendedDestination, 0), maxScroll);
};
