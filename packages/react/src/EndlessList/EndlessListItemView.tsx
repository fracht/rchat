import { RefObject, useEffect, useRef } from 'react';
import { mergeReferences } from '../internal/mergeReferences';
import { ItemComponentType } from './ItemComponentType';
import { PlaceholderComponentType } from './PlaceholderComponentType';
import type { EndlessListItem } from './useEndlessList';

export type EndlessListItemViewProps<TMessageType> = EndlessListItem<TMessageType> & {
	ItemComponent: ItemComponentType<TMessageType>;
	PlaceholderComponent: PlaceholderComponentType;
	itemObserver: IntersectionObserver | undefined;
	focusElementReference: RefObject<HTMLElement>;
};

export const EndlessListItemView = <TMessageType,>({
	ItemComponent,
	PlaceholderComponent,
	itemObserver,
	focusElementReference,
	...item
}: EndlessListItemViewProps<TMessageType>) => {
	const itemReference = useRef<HTMLElement>(null);

	useEffect(() => {
		const currentElement = itemReference.current;
		if (currentElement && itemObserver) {
			itemObserver.observe(currentElement);

			return () => itemObserver.unobserve(currentElement);
		}
	}, [itemObserver]);

	if (item.type === 'placeholder') {
		return <PlaceholderComponent ref={itemReference} itemKey={item.itemKey} />;
	}

	return <ItemComponent ref={mergeReferences(itemReference, item.focused && focusElementReference)} {...item} />;
};
