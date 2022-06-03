import { ComponentType, RefAttributes, useCallback, useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import type { Key } from 'react';
import type { KeysOfType } from './internal/KeysOfType';
import { usePrevious } from './internal/usePrevious';
import { useToggleEvent } from './internal/useToggleEvent';

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

const noop = () => {};

export const EndlessList = <T,>({
    ItemComponent,
    items,
    itemKey,
    distance,
    onTopReached,
    onBottomReached,
    onScroll,
    ...other
}: EndlessListProps<T>) => {
    const scrollableContainerRef = useRef<HTMLDivElement>(null);
    const contentContainerRef = useRef<HTMLDivElement>(null);
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

    const handleScroll = useCallback(async (e: React.UIEvent<HTMLDivElement>) => {
        if (
            !scrollableContainerRef.current ||
            !contentContainerRef.current ||
            !topElementRef.current ||
            !bottomElementRef.current
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
    }, []);

    useLayoutEffect(() => {
        if (scrollableContainerRef.current && contentContainerRef.current) {
            scrollableContainerRef.current.scrollTop = contentContainerRef.current.getBoundingClientRect().height;
        }
    }, []);

    const oldItems = usePrevious(items);

    useEffect(() => {
        if (!contentContainerRef.current || !scrollableContainerRef.current) return;

        const keys = items.map(keyExtractor);
        const oldKeys = oldItems.map(keyExtractor);

        const moveForward = !oldKeys.includes(keys[0]) || !keys.includes(oldKeys[oldKeys.length - 1]);
        const moveBackward = !keys.includes(oldKeys[0]) || !oldKeys.includes(keys[keys.length - 1]);

        if (moveForward && moveBackward) {
            throw new Error('Cannot perform jump - currently not supported.');
        }

        if (moveForward) {
            setTopReached(false);
        }

        if (moveBackward) {
            setBottomReached(false);
        }
    }, [items]);

    return (
        <div {...other} ref={scrollableContainerRef} onScroll={handleScroll}>
            <div ref={contentContainerRef}>
                {items.map((item, index, items) => (
                    <ItemComponent
                        index={index}
                        items={items}
                        item={item}
                        key={keyExtractor(item)}
                        ref={getElRef(index, items.length, topElementRef, bottomElementRef)}
                    />
                ))}
            </div>
        </div>
    );
};
