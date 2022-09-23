import {
	ComponentType,
	PropsWithChildren,
	Ref,
	RefAttributes,
	useCallback,
	useEffect,
	useLayoutEffect,
	useMemo,
	useRef,
} from 'react';

import { smoothScrollToCenter } from '../internal/smoothScrollToCenter';
import { useEvent } from '../internal/useEvent';
import { useToggleEvent } from '../internal/useToggleEvent';

import { EndlessListItemView } from './EndlessListItemView';
import { ItemComponentType } from './ItemComponentType';
import { useEndlessList } from './useEndlessList';
import { Frame, useVisibleFrame } from './useVisibleFrame';
import type { KeysOfType } from '../internal/KeysOfType';
import type { Key } from 'react';

export type ContainerComponentProps = PropsWithChildren<{
	innerContainerRef: Ref<HTMLElement>;
}> &
	RefAttributes<HTMLElement>;

export type ItemKey<T> = KeysOfType<T, Key> | ((value: T) => Key);

export type EndlessListProps<TItemType> = {
	ItemComponent: ItemComponentType<TItemType>;
	PlaceholderComponent: ComponentType;
	ContainerComponent: ComponentType<ContainerComponentProps>;
	items: TItemType[];
	itemKey: ItemKey<TItemType>;
	triggerDistance: number;
	onTopReached?: () => void;
	onBottomReached?: () => void;
	compareItems: (first: TItemType, second: TItemType) => number;
	focusedItemKey?: Key;
	jumpAnimationDuration?: number;
	canStickToBottom?: boolean;
	onVisibleFrameChange?: (frame: Frame) => void;
};

const noop = () => {
	/** No operation */
};

export const EndlessList = <T,>({
	ItemComponent,
	items,
	itemKey,
	triggerDistance,
	onTopReached,
	onBottomReached,
	compareItems,
	PlaceholderComponent,
	jumpAnimationDuration = 500,
	focusedItemKey,
	ContainerComponent,
	canStickToBottom,
	onVisibleFrameChange,
}: EndlessListProps<T>) => {
	const scrollableContainerReference = useRef<HTMLElement>(null);
	const contentContainerReference = useRef<HTMLElement>(null);
	const focusElementReference = useRef<HTMLElement>(null);
	const stickToBottomReached = useRef(false);
	const isScrolling = useRef(false);
	const visibleFrame = useRef<Frame>({ begin: -1, end: -1 });

	const setBottomReached = useToggleEvent(onBottomReached ?? noop);
	const setTopReached = useToggleEvent(onTopReached ?? noop);

	const getKey = useMemo(() => {
		return typeof itemKey === 'function' ? itemKey : (value: T) => value[itemKey] as unknown as Key;
	}, [itemKey]);

	useEffect(() => {
		setBottomReached(false);
		setTopReached(false);
	}, [items, setBottomReached, setTopReached]);

	useLayoutEffect(() => {
		if (scrollableContainerReference.current && contentContainerReference.current) {
			scrollableContainerReference.current.scrollTop =
				contentContainerReference.current.getBoundingClientRect().height;
		}
	}, []);

	useLayoutEffect(() => {
		if (stickToBottomReached.current && canStickToBottom) {
			scrollableContainerReference.current!.scrollTop =
				contentContainerReference.current!.getBoundingClientRect().height;
		}
	}, [items, canStickToBottom]);

	const checkBounds = useEvent((frame: Frame = visibleFrame.current) => {
		onVisibleFrameChange?.(frame);
		visibleFrame.current = frame;
		if (frame.begin === -1 || frame.end === -1 || isScrolling.current) {
			return;
		}

		setBottomReached(frame.end <= triggerDistance);
		setTopReached(frame.begin <= triggerDistance);
		stickToBottomReached.current = frame.end === 0;
	});

	const scrollToFocusItem = useCallback(async () => {
		if (isScrolling.current || !scrollableContainerReference.current || !focusElementReference.current) {
			return;
		}
		isScrolling.current = true;

		await smoothScrollToCenter(
			scrollableContainerReference.current,
			focusElementReference.current,
			jumpAnimationDuration,
		);

		isScrolling.current = false;

		checkBounds();
	}, [checkBounds, jumpAnimationDuration]);

	const visibleItems = useEndlessList({
		getKey,
		items,
		compareItems,
		handleJump: scrollToFocusItem,
		focusedItemKey,
	});

	useEffect(() => {
		if (focusedItemKey) {
			scrollToFocusItem();
		}
	}, [focusedItemKey, scrollToFocusItem]);

	const { observer } = useVisibleFrame({
		containerReference: scrollableContainerReference,
		items,
		getKey,
		onVisibleFrameUpdated: checkBounds,
	});

	return (
		<ContainerComponent ref={scrollableContainerReference} innerContainerRef={contentContainerReference}>
			{visibleItems.map((item) => (
				<EndlessListItemView
					key={item.itemKey}
					focusElementReference={focusElementReference}
					ItemComponent={ItemComponent}
					PlaceholderComponent={PlaceholderComponent}
					itemObserver={observer}
					{...item}
				/>
			))}
		</ContainerComponent>
	);
};
