import { RefObject, useEffect, useState } from 'react';
import { useEvent } from '../internal/useEvent';

export type VisibleItemsBag = {
	observer: IntersectionObserver | undefined;
	visibleItemKeys: Set<string>;
};

export const useVisibleItems = (containerReference: RefObject<HTMLElement>): VisibleItemsBag => {
	const [observer, setObserver] = useState<IntersectionObserver>();
	const [visibleItemKeys, setVisibleItemKeys] = useState<Set<string>>(new Set());

	const updateVisibleFrame = useEvent((entries: IntersectionObserverEntry[]) => {
		const items = new Set<string>();
		for (const { target, isIntersecting } of entries) {
			const key = (target as HTMLElement).dataset.key;

			if (!key) {
				// eslint-disable-next-line no-console
				console.warn('Item component doesn\'t have "data-key" attribute.');
			} else if (isIntersecting) {
				items.add(key);
			}
		}

		setVisibleItemKeys(items);
	});

	useEffect(() => {
		const containerElement = containerReference.current;
		if (containerElement) {
			const observer = new IntersectionObserver(updateVisibleFrame, { root: containerElement, threshold: 1 });

			setObserver(observer);
		}
	}, [containerReference, updateVisibleFrame]);

	return { observer, visibleItemKeys };
};
