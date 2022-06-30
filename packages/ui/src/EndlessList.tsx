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

import { mergeReferences } from './internal/mergeReferences';
import { smoothScrollToCenter } from './internal/smoothScrollToCenter';
import { usePrevious } from './internal/usePrevious';
import { useToggleEvent } from './internal/useToggleEvent';

import type { KeysOfType } from './internal/KeysOfType';
import type { Key } from 'react';

export type ItemComponentProps<T> = {
    item: T;
    index: number;
    items: T[];
};

export type ContainerComponentProps = PropsWithChildren<{
    innerContainerRef: Ref<HTMLElement>;
    onScroll: () => void;
}> &
    RefAttributes<HTMLElement>;

export type ItemKey<T> = KeysOfType<T, Key> | ((value: T) => Key);

export type EndlessListProps<T> = {
    ItemComponent: ComponentType<ItemComponentProps<T> & RefAttributes<HTMLElement>>;
    PlaceholderComponent: ComponentType;
    ContainerComponent: ComponentType<ContainerComponentProps>;
    items: T[];
    itemKey: ItemKey<T>;
    triggerDistance: number;
    onTopReached?: () => void;
    onBottomReached?: () => void;
    compareItems: (first: T, second: T) => number;
    focusedItem?: T;
    jumpAnimDuration?: number;
};

const getElementReference = <E,>(
    index: number,
    length: number,
    topReference: React.RefObject<E>,
    bottomReference: React.RefObject<E>,
) => {
    if (index === 0) {
        return topReference;
    }

    if (index === length - 1) {
        return bottomReference;
    }

    return;
};

const getFocusReference = <T, E>(
    focusItem: T | undefined,
    focusIndex: number,
    index: number,
    focusArray: Array<T>,
    currentArray: Array<T>,
    focusElementReference: React.RefObject<E>,
) => {
    if (currentArray !== focusArray) {
        return;
    }

    if (focusItem !== undefined) {
        return focusArray[index] === focusItem ? focusElementReference : undefined;
    }

    return index === focusIndex ? focusElementReference : undefined;
};

const noop = () => {
    /** No operation */
};

const placeholderItemSymbol = Symbol();

export const EndlessList = <T,>({
    ItemComponent,
    items,
    itemKey,
    triggerDistance,
    onTopReached,
    onBottomReached,
    compareItems,
    PlaceholderComponent,
    jumpAnimDuration = 500,
    focusedItem,
    ContainerComponent,
}: EndlessListProps<T>) => {
    const scrollableContainerReference = useRef<HTMLElement>(null);
    const contentContainerReference = useRef<HTMLElement>(null);
    const focusElementReference = useRef<HTMLElement>(null);
    const topElementReference = useRef<HTMLElement>(null);
    const bottomElementReference = useRef<HTMLElement>(null);

    const setBottomReached = useToggleEvent(onBottomReached ?? noop);
    const setTopReached = useToggleEvent(onTopReached ?? noop);
    const isScrolling = useRef(false);

    const keyExtractor = useMemo(() => {
        return typeof itemKey === 'function' ? itemKey : (value: T) => value[itemKey] as unknown as Key;
    }, [itemKey]);

    const [oldItems, invalidate] = usePrevious(items);

    const jumpItems = useMemo(() => {
        const keys = items.map(keyExtractor);
        const oldKeys = oldItems.map(keyExtractor);

        const moveForward = !oldKeys.includes(keys[0]) || !keys.includes(oldKeys[oldKeys.length - 1]);
        const moveBackward = !keys.includes(oldKeys[0]) || !oldKeys.includes(keys[keys.length - 1]);

        const isInJump = moveForward && moveBackward;

        if (isInJump) {
            setTimeout(invalidate, jumpAnimDuration);

            return compareItems(items[0], oldItems[0]) > 0
                ? { next: items, prev: oldItems, actual: items }
                : { prev: items, next: oldItems, actual: items };
        }

        return;
    }, [compareItems, invalidate, items, jumpAnimDuration, keyExtractor, oldItems]);

    const checkScrollPosition = useCallback(async () => {
        if (
            !topElementReference.current ||
            !bottomElementReference.current ||
            !scrollableContainerReference.current ||
            !contentContainerReference.current
        ) {
            return;
        }

        const containerRect = scrollableContainerReference.current.getBoundingClientRect();
        const bottomElementRect = bottomElementReference.current.getBoundingClientRect();
        const topElementRect = topElementReference.current.getBoundingClientRect();

        const distanceTillBottomElement = bottomElementRect.bottom - containerRect.bottom;
        const distanceTillTopElement = containerRect.top - topElementRect.top;

        setBottomReached(distanceTillBottomElement <= triggerDistance);
        setTopReached(distanceTillTopElement <= triggerDistance);
    }, [triggerDistance, setBottomReached, setTopReached]);

    const handleScroll = useCallback(async () => {
        if (isScrolling.current) {
            return;
        }

        checkScrollPosition();
    }, [checkScrollPosition]);

    useEffect(() => {
        if (
            !isScrolling.current &&
            (jumpItems !== undefined || focusedItem) &&
            focusElementReference.current &&
            scrollableContainerReference.current
        ) {
            isScrolling.current = true;
            smoothScrollToCenter(
                scrollableContainerReference.current,
                focusElementReference.current,
                jumpAnimDuration,
            ).then(() => {
                isScrolling.current = false;
                checkScrollPosition();
            });
        }
    }, [jumpAnimDuration, jumpItems, focusedItem, checkScrollPosition]);

    useLayoutEffect(() => {
        if (scrollableContainerReference.current && contentContainerReference.current) {
            scrollableContainerReference.current.scrollTop =
                contentContainerReference.current.getBoundingClientRect().height;
        }
    }, []);

    useEffect(() => {
        setTopReached(false);
        setBottomReached(false);
    }, [items, setBottomReached, setTopReached]);

    return (
        <ContainerComponent
            onScroll={handleScroll}
            ref={scrollableContainerReference}
            innerContainerRef={contentContainerReference}
        >
            {jumpItems
                ? ([...jumpItems.next, placeholderItemSymbol, ...jumpItems.prev] as const).map((item, index) => {
                      if (item === placeholderItemSymbol) {
                          return <PlaceholderComponent key={-1} />;
                      }

                      const focusIndex = jumpItems.next.length / 2;

                      let normalIndex = 0;
                      let normalArray: T[] = [];

                      if (index > jumpItems.next.length) {
                          normalIndex = index - jumpItems.next.length - 1;
                          normalArray = jumpItems.prev;
                      } else {
                          normalIndex = index;
                          normalArray = jumpItems.next;
                      }

                      return (
                          <ItemComponent
                              item={item}
                              index={normalIndex}
                              items={normalArray}
                              key={keyExtractor(item)}
                              ref={getFocusReference(
                                  focusedItem,
                                  focusIndex,
                                  normalIndex,
                                  jumpItems.actual,
                                  normalArray,
                                  focusElementReference,
                              )}
                          />
                      );
                  })
                : items.map((item, index, items) => (
                      <ItemComponent
                          item={item}
                          index={index}
                          items={items}
                          key={keyExtractor(item)}
                          ref={mergeReferences(
                              getElementReference(index, items.length, topElementReference, bottomElementReference),
                              getFocusReference(focusedItem, -1, index, items, items, focusElementReference),
                          )}
                      />
                  ))}
        </ContainerComponent>
    );
};
