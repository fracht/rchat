const easeInOutCubic = (value: number) => {
    return value < 0.5 ? 4 * value * value * value : (value - 1) * (2 * value - 2) * (2 * value - 2) + 1;
};

export const smoothScrollToCenter = async (container: HTMLElement, element: HTMLElement, duration: number) => {
    const elementRect = element.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();

    const top = elementRect.top - containerRect.top - containerRect.height / 2 + elementRect.height / 2;

    const startPos = container.scrollTop;
    const clientHeight = container.clientHeight;
    const maxScroll = container.scrollHeight - clientHeight;
    const scrollIntendedDestination = startPos + top;
    const scrollEndValue = Math.min(Math.max(scrollIntendedDestination, 0), maxScroll);
    let startTime = 0;

    return new Promise<void>((resolve) => {
        const scroll = (timestamp: number) => {
            startTime = startTime || timestamp;
            const elapsed = timestamp - startTime;
            container.scrollTop = startPos + (scrollEndValue - startPos) * easeInOutCubic(elapsed / duration);
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
