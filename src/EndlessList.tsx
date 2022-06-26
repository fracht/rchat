import React, {
    ComponentType,
    RefAttributes,
    useCallback,
    useEffect,
    useLayoutEffect,
    useMemo,
    useReducer,
    useRef,
    useState,
} from 'react';
import type { Key } from 'react';
import type { KeysOfType } from './internal/KeysOfType';
import { usePrevious } from './internal/usePrevious';
import { useToggleEvent } from './internal/useToggleEvent';
import { smoothScrollToCenter } from './internal/smoothScrollToCenter';

export type ItemComponentProps<T> = {
    item: T;
    index: number;
    items: T[];
};

export type ItemKey<T> = KeysOfType<T, Key> | ((value: T) => Key);

export type EndlessListProps<T> = {
    ItemComponent: ComponentType<ItemComponentProps<T> & RefAttributes<HTMLElement>>;
    items: T[];
    itemKey: ItemKey<T>;
    // TODO: rename this parameter
    distance: number;
    onTopReached?: () => void;
    onBottomReached?: () => void;
    // TODO: rename this parameter
    compareItems: (first: T, second: T) => number;
    focusItem?: T;
    jumpAnimDuration?: number;
    PlaceholderComponent: ComponentType;
} & React.HTMLAttributes<HTMLDivElement>;

const getElRef = <E,>(index: number, length: number, topRef: React.RefObject<E>, bottomRef: React.RefObject<E>) => {
    if (index === 0) {
        return topRef;
    }

    if (index === length - 1) {
        return bottomRef;
    }

    return undefined;
};

const getFocusRef = <T, E>(
    focusItem: T | undefined,
    focusIndex: number,
    index: number,
    focusArray: Array<T>,
    currentArray: Array<T>,
    focusElementRef: React.RefObject<E>,
) => {
    if (currentArray !== focusArray) {
        return undefined;
    }

    if (focusItem !== undefined) {
        return focusArray[index] === focusItem ? focusElementRef : undefined;
    }

    return index === focusIndex ? focusElementRef : undefined;
};

const noop = () => {};

const PlaceholderItemSymbol = Symbol();

export const EndlessList = <T,>({
    ItemComponent,
    items,
    itemKey,
    distance,
    onTopReached,
    onBottomReached,
    onScroll,
    compareItems,
    PlaceholderComponent,
    jumpAnimDuration = 500,
    focusItem,
    ...other
}: EndlessListProps<T>) => {
    const scrollableContainerRef = useRef<HTMLDivElement>(null);
    const contentContainerRef = useRef<HTMLDivElement>(null);
    const focusElementRef = useRef<HTMLDivElement>(null);
    const topElementRef = useRef<HTMLElement>(null);
    const bottomElementRef = useRef<HTMLElement>(null);

    const setBottomReached = useToggleEvent(onBottomReached ?? noop);
    const setTopReached = useToggleEvent(onTopReached ?? noop);

    const keyExtractor = useMemo(() => {
        if (typeof itemKey === 'function') {
            return itemKey;
        } else {
            return (value: T) => value[itemKey] as unknown as Key;
        }
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

            if (compareItems(items[0], oldItems[0]) > 0) {
                return { next: items, prev: oldItems, actual: items };
            } else {
                return { prev: items, next: oldItems, actual: items };
            }
        }

        return undefined;
    }, [items, oldItems]);

    useEffect(() => {
        if (jumpItems !== undefined && focusElementRef.current && scrollableContainerRef.current) {
            smoothScrollToCenter(scrollableContainerRef.current, focusElementRef.current, jumpAnimDuration);
        }
    }, [jumpItems]);

    const handleScroll = useCallback(
        async (e: React.UIEvent<HTMLDivElement>) => {
            if (
                !topElementRef.current ||
                !bottomElementRef.current ||
                !scrollableContainerRef.current ||
                !contentContainerRef.current
            ) {
                return;
            }

            const containerRect = scrollableContainerRef.current.getBoundingClientRect();
            const bottomElRect = bottomElementRef.current.getBoundingClientRect();
            const topElRect = topElementRef.current.getBoundingClientRect();

            const distanceTillBottomEl = bottomElRect.bottom - containerRect.bottom;
            const distanceTillTopEl = containerRect.top - topElRect.top;

            setBottomReached(distanceTillBottomEl <= distance);
            setTopReached(distanceTillTopEl <= distance);

            onScroll?.(e);
        },
        [jumpItems],
    );

    useLayoutEffect(() => {
        if (scrollableContainerRef.current && contentContainerRef.current) {
            scrollableContainerRef.current.scrollTop = contentContainerRef.current.getBoundingClientRect().height;
        }
    }, []);

    useEffect(() => {
        setTopReached(false);
        setBottomReached(false);
    }, [items]);

    return (
        <div {...other} ref={scrollableContainerRef} onScroll={handleScroll}>
            <div ref={contentContainerRef}>
                {jumpItems
                    ? ([...jumpItems.next, PlaceholderItemSymbol, ...jumpItems.prev] as const).map((item, index) => {
                          if (item === PlaceholderItemSymbol) {
                              return <PlaceholderComponent key={-1} />;
                          }

                          let normalIndex = 0;
                          const focusIndex = jumpItems.next.length / 2;
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
                                  ref={getFocusRef(
                                      focusItem,
                                      focusIndex,
                                      normalIndex,
                                      jumpItems.actual,
                                      normalArray,
                                      focusElementRef,
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
                              ref={getElRef(index, items.length, topElementRef, bottomElementRef)}
                          />
                      ))}
            </div>
        </div>
    );
};
