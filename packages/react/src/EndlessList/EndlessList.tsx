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

import { mergeReferences } from '../internal/mergeReferences';
import { AnimationParameters, smoothScrollToCenter } from '../internal/smoothScrollToCenter';
import { useEvent } from '../internal/useEvent';
import { useScheduleOnNextRender } from '../internal/useScheduleOnNextRender';
import { useToggleEvent } from '../internal/useToggleEvent';

import { EndlessListItemView } from './EndlessListItemView';
import { ItemComponentType } from './ItemComponentType';
import { PlaceholderComponentType } from './PlaceholderComponentType';
import { useEndlessList } from './useEndlessList';
import { Frame, useVisibleFrame } from './useVisibleFrame';
import { useVisibleItems } from './useVisibleItems';
import type { KeysOfType } from '../internal/KeysOfType';

export type ContainerComponentProps = PropsWithChildren<RefAttributes<HTMLElement>>;

export type ItemKey<T> = KeysOfType<T, string> | ((value: T) => string);

export type EndlessListProps<TItemType> = {
	ItemComponent: ItemComponentType<TItemType>;
	PlaceholderComponent: PlaceholderComponentType;
	ContainerComponent: ComponentType<ContainerComponentProps>;
	items: TItemType[];
	itemKey: ItemKey<TItemType>;
	triggerDistance: number;
	onTopReached?: () => void;
	onBottomReached?: () => void;
	compareItems: (first: TItemType, second: TItemType) => number;
	focusedItem?: TItemType;
	jumpAnimation?: AnimationParameters;
	canStickToBottom?: boolean;
	onVisibleFrameChange?: (frame: Frame) => void;
	containerReference?: Ref<HTMLElement>;
};

const noop = () => {
	/** No operation */
};

const defaultAnimationParameters: AnimationParameters = {
	// Constant duration
	duration: () => 500,
	// Linear easing
	easing: (t) => t,
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
	jumpAnimation = defaultAnimationParameters,
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
	const visibleFrame = useRef<Frame>({ begin: -1, end: -1 });

	const setBottomReached = useToggleEvent(onBottomReached ?? noop);
	const setTopReached = useToggleEvent(onTopReached ?? noop);

	const getKey = useMemo(() => {
		return typeof itemKey === 'function' ? itemKey : (value: T) => value[itemKey] as unknown as string;
	}, [itemKey]);

	useEffect(() => {
		setBottomReached(false);
		setTopReached(false);
	}, [items, setBottomReached, setTopReached]);

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

	const smoothScrolling = useEvent((container: HTMLElement, item: HTMLElement, abortController?: AbortController) => {
		return smoothScrollToCenter(container, item, jumpAnimation, abortController);
	});

	const abortControllerReference = useRef<AbortController>();
	const handleJumpScroll = useCallback(
		async (abortController = new AbortController()) => {
			if (abortControllerReference.current) {
				abortControllerReference.current.abort();
			}

			if (!containerReference.current || !focusElementReference.current) {
				return;
			}

			abortControllerReference.current = abortController;
			isScrolling.current = true;

			await smoothScrolling(containerReference.current, focusElementReference.current, abortController);
			isScrolling.current = false;

			checkBounds();
		},
		[checkBounds, smoothScrolling],
	);

	const onVisibleItemsChange = useVisibleFrame({
		getKey,
		items,
		onVisibleFrameUpdated: checkBounds,
	});
	const { observer, visibleItemKeys } = useVisibleItems(containerReference, onVisibleItemsChange);
	const [scheduleJumpScroll, isJumpScheduled] = useScheduleOnNextRender(handleJumpScroll);

	const lastScrolledItem = useRef<T | undefined>();
	const handleScrollToFocusItem = useEvent(() => {
		if (focusedItem === lastScrolledItem.current) {
			return;
		}

		lastScrolledItem.current = focusedItem;
		if (focusedItem && !isJumpScheduled()) {
			handleJumpScroll().catch(() => {
				/* Ignore aborted jump error */
			});
		}
	});

	const itemsToRender = useEndlessList({
		getKey,
		items,
		compareItems,
		handleJump: scheduleJumpScroll,
		focusedItem,
		visibleItemKeys,
	});

	useEffect(() => {
		handleScrollToFocusItem();
	}, [handleScrollToFocusItem, itemsToRender]);
	const handleStickToBottom = useEvent(() => {
		const container = containerReference.current;
		if (container && stickToBottomReached.current && !focusedItem) {
			container.scrollTo({ top: container.scrollHeight });
		}
	});

	useLayoutEffect(() => {
		if (canStickToBottom) {
			handleStickToBottom();
		}
	}, [itemsToRender, canStickToBottom, handleStickToBottom]);

	const isScrolledToBottom = useRef(false);
	useLayoutEffect(() => {
		if (isScrolledToBottom.current) {
			return;
		}

		if (itemsToRender.length === 0) {
			return;
		}

		const container = containerReference.current;
		if (container) {
			container.scrollTo({ top: container.scrollHeight });
		}

		isScrolledToBottom.current = true;
	}, [itemsToRender.length]);

	return (
		<ContainerComponent ref={mergeReferences(containerReference, propsContainerReference)}>
			{itemsToRender.map((item) => (
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
