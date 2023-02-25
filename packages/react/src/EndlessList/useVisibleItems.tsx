import { RefObject, useEffect, useState, MutableRefObject, useRef } from 'react';
import { useEvent } from '../internal/useEvent';

export type VisibleItemsBag = {
	observer: IntersectionObserver | undefined;
	visibleItemKeys: MutableRefObject<Set<string>>;
};

export const useVisibleItems = (
	containerReference: RefObject<HTMLElement>,
	onVisibleItemsChange?: (items: Set<string>) => void,
): VisibleItemsBag => {
	const [observer, setObserver] = useState<IntersectionObserver>();
	const visibleItemKeysReference = useRef(new Set<string>());

	const updateVisibleFrame = useEvent((entries: IntersectionObserverEntry[]) => {
		for (const { target, isIntersecting } of entries) {
			const key = (target as HTMLElement).dataset.key;

			if (!key) {
				// eslint-disable-next-line no-console
				console.warn('Item component doesn\'t have "data-key" attribute.');
			} else if (isIntersecting) {
				visibleItemKeysReference.current.add(key);
			} else {
				visibleItemKeysReference.current.delete(key);
			}
		}

		onVisibleItemsChange?.(visibleItemKeysReference.current);
	});

	useEffect(() => {
		const containerElement = containerReference.current;
		if (containerElement) {
			const observer = new IntersectionObserver(updateVisibleFrame, { root: containerElement, threshold: 1 });

			setObserver(observer);
		}
	}, [containerReference, updateVisibleFrame]);

	return { observer, visibleItemKeys: visibleItemKeysReference };
};
