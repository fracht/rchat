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
	type Key,
} from 'react';

import { mergeReferences } from '../internal/mergeReferences';
import { smoothScrollToCenter } from '../internal/smoothScrollToCenter';
import { useEvent } from '../internal/useEvent';
import { useToggleEvent } from '../internal/useToggleEvent';

import { EndlessListItemView } from './EndlessListItemView';
import { ItemComponentType } from './ItemComponentType';
import { useEndlessList } from './useEndlessList';
import { Frame, useVisibleFrame } from './useVisibleFrame';
import type { KeysOfType } from '../internal/KeysOfType';

export type ContainerComponentProps = PropsWithChildren<RefAttributes<HTMLElement>>;

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
	focusedItem?: TItemType;
	jumpAnimationDuration?: number;
	canStickToBottom?: boolean;
	onVisibleFrameChange?: (frame: Frame) => void;
	containerReference?: Ref<HTMLElement>;
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
	focusedItem,
	ContainerComponent,
	canStickToBottom,
	onVisibleFrameChange,
	containerReference: propsContainerReference,
}: EndlessListProps<T>) => {
	const containerReference = useRef<HTMLElement>(null);
	const focusElementReference = useRef<HTMLElement>(null);
	const stickToBottomReached = useRef(false);
	const isScrolling = useRef(false);
	const scrollAbortController = useRef<AbortController>();
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
		const container = containerReference.current;
		if (container && stickToBottomReached.current && canStickToBottom) {
			container.scrollTo({ top: container.scrollHeight });
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
		if (!containerReference.current || !focusElementReference.current) {
			return;
		}

		if (scrollAbortController.current) {
			scrollAbortController.current.abort();
		}
		isScrolling.current = true;
		const abortController = new AbortController();
		scrollAbortController.current = abortController;

		try {
			await smoothScrollToCenter(
				containerReference.current,
				focusElementReference.current,
				jumpAnimationDuration,
				abortController,
			);
			isScrolling.current = false;

			checkBounds();
		} catch {
			/* Ignore error */
		}
	}, [checkBounds, jumpAnimationDuration]);

	const visibleItems = useEndlessList({
		getKey,
		items,
		compareItems,
		handleJump: scrollToFocusItem,
		focusedItem,
	});

	useEffect(() => {
		if (focusedItem) {
			scrollToFocusItem();
		}
	}, [focusedItem, scrollToFocusItem]);

	const { observer } = useVisibleFrame({
		containerReference,
		items,
		getKey,
		onVisibleFrameUpdated: checkBounds,
	});

	return (
		<ContainerComponent ref={mergeReferences(containerReference, propsContainerReference)}>
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
