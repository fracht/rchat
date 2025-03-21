import { MessageFetchResult, MessageSearchResult } from '@rchat/client';
import { ChatClient } from '@rchat/client';
import { Ref, useCallback, useEffect, useRef, useState } from 'react';
import { Frame } from './EndlessList/useVisibleFrame';
import { clamp } from './internal/clamp';
import { KeepDirection, useBoundedArray } from './internal/useBoundedArray';
import { useEvent } from './internal/useEvent';

export type UseMessagesBag<T> = {
	messages: T[];
	onTopReached: () => void;
	onBottomReached: () => void;
	noMessagesBefore: boolean;
	noMessagesAfter: boolean;
	onVisibleFrameChange: (frame: Frame) => void;
	containerReference: Ref<HTMLElement>;
	focusedItem?: T;
};

export type UseMessagesConfig<T> = {
	initialMessagesState: MessageFetchResult<T>;
	initialSearchResult?: MessageSearchResult<T>;
	compareItems: (a: T, b: T) => number;
	maxChunkSize: number;
	additionalChunkSize: number;
	chatClient: ChatClient<T>;
	roomIdentifier: string;
};

// TODO: replace with binary search
const findNewElementIndex = <T,>(elements: readonly T[], element: T, compare: (a: T, b: T) => number): number => {
	return (
		elements.length -
		1 -
		[...elements].reverse().findIndex((a) => {
			return compare(element, a) > 0;
		})
	);
};

export const useMessages = <TMessage,>({
	maxChunkSize,
	additionalChunkSize,
	chatClient,
	roomIdentifier,
	compareItems,
	initialMessagesState,
	initialSearchResult,
}: UseMessagesConfig<TMessage>): UseMessagesBag<TMessage> => {
	const isFetching = useRef(false);
	const visibleFrame = useRef<Frame>({ begin: -1, end: -1 });
	const containerReference = useRef<HTMLElement>(null);
	const searchResults = useRef<MessageSearchResult<TMessage> | undefined>(initialSearchResult);
	const selectedSearchResult = useRef(0);
	const focusedItem = useRef<TMessage | undefined>(initialSearchResult?.results[0]);

	const [
		messages,
		{
			push: pushMessages,
			unshift: unshiftMessages,
			set: setMessages,
			insert: insertMessage,
			at: getMessage,
			getAll: getAllMessages,
			refresh,
		},
	] = useBoundedArray<TMessage>([...initialMessagesState.messages], maxChunkSize);

	const [noMessagesAfter, setNoMessagesAfter] = useState(initialMessagesState.noMessagesAfter);
	const [noMessagesBefore, setNoMessagesBefore] = useState(initialMessagesState.noMessagesBefore);
	const messagesState = useRef<Omit<MessageFetchResult<TMessage>, 'messages'>>(initialMessagesState);

	const handleIncomingMessage = useCallback(
		(message: TMessage, messageRoomIdentifier: string) => {
			if (messageRoomIdentifier === roomIdentifier && messagesState.current.noMessagesAfter) {
				const incomingMessageIndex = findNewElementIndex(getAllMessages(), message, compareItems);

				const keepDirection: KeepDirection =
					visibleFrame.current.begin < visibleFrame.current.end ? 'beginning' : 'ending';

				const clipped = insertMessage(message, incomingMessageIndex + 1, keepDirection);

				if (clipped) {
					if (keepDirection === 'beginning') {
						messagesState.current.noMessagesAfter = false;
					} else {
						messagesState.current.noMessagesBefore = false;
					}
				}
			}
		},
		[roomIdentifier, getAllMessages, compareItems, insertMessage],
	);

	const focusItem = useCallback(
		async (item: TMessage | undefined) => {
			if (!item) {
				if (focusedItem.current) {
					refresh();
				}

				focusedItem.current = item;
				return;
			}

			focusedItem.current = item;

			const [previousChunk, nextChunk] = await Promise.all([
				chatClient.fetchMessages(roomIdentifier, additionalChunkSize, item, undefined),
				chatClient.fetchMessages(roomIdentifier, additionalChunkSize, undefined, item),
			]);

			messagesState.current = {
				noMessagesBefore: previousChunk.noMessagesBefore,
				noMessagesAfter: nextChunk.noMessagesAfter,
			};

			setMessages([...previousChunk.messages, item, ...nextChunk.messages], 'beginning');
		},
		[additionalChunkSize, chatClient, roomIdentifier, setMessages, refresh],
	);

	const handleSearch = useCallback(
		(searchRoomIdentifier: string, searchResult: MessageSearchResult<TMessage>, focusIndex: number) => {
			if (searchRoomIdentifier === roomIdentifier) {
				searchResults.current = searchResult;
				focusIndex = Math.min(focusIndex, searchResult.results.length - 1);
				selectedSearchResult.current = focusIndex;
				focusItem(searchResult.results[focusIndex]);
			}
		},
		[focusItem, roomIdentifier],
	);

	const handlePreviousSearchResult = useCallback(
		(searchRoomIdentifier: string) => {
			if (searchResults.current && searchRoomIdentifier === roomIdentifier) {
				selectedSearchResult.current = clamp(
					selectedSearchResult.current - 1,
					0,
					Math.max(searchResults.current.results.length - 1, 0),
				);
				focusItem(searchResults.current.results[selectedSearchResult.current]);
			}
		},
		[focusItem, roomIdentifier],
	);

	const handleNextSearchResult = useCallback(
		(searchRoomIdentifier: string) => {
			if (searchResults.current && searchRoomIdentifier === roomIdentifier) {
				selectedSearchResult.current = clamp(
					selectedSearchResult.current + 1,
					0,
					Math.max(searchResults.current.results.length - 1, 0),
				);
				focusItem(searchResults.current.results[selectedSearchResult.current]);
			}
		},
		[focusItem, roomIdentifier],
	);

	useEffect(() => {
		chatClient.addEventListener('receiveMessage', handleIncomingMessage);
		chatClient.addEventListener('receiveSearchResults', handleSearch);
		chatClient.addEventListener('nextSearchResult', handleNextSearchResult);
		chatClient.addEventListener('previousSearchResult', handlePreviousSearchResult);

		return () => {
			chatClient.removeEventListener('receiveMessage', handleIncomingMessage);
			chatClient.removeEventListener('receiveSearchResults', handleSearch);
			chatClient.removeEventListener('nextSearchResult', handleNextSearchResult);
			chatClient.removeEventListener('previousSearchResult', handlePreviousSearchResult);
		};
	}, [chatClient, handleIncomingMessage, handleNextSearchResult, handlePreviousSearchResult, handleSearch]);

	// Scroll to bottom if there was no initial search
	useEffect(() => {
		if (!initialSearchResult) {
			const container = containerReference.current;
			if (container) {
				container.scrollTo({ top: container.scrollHeight });
			} else {
				// eslint-disable-next-line no-console
				console.warn(
					"RChat: container reference wasn't passed into EndlessList," +
						' so scrolling to the bottom after initial chat load failed.' +
						' This may cause inconsistent behavior',
				);
			}
		}
	}, [initialSearchResult]);

	useEffect(() => {
		setMessages([...initialMessagesState.messages], 'beginning');
		messagesState.current = initialMessagesState;
		setNoMessagesAfter(initialMessagesState.noMessagesAfter);
		setNoMessagesBefore(initialMessagesState.noMessagesBefore);
	}, [initialMessagesState, setMessages]);

	useEffect(() => {
		searchResults.current = initialSearchResult;
		focusedItem.current = initialSearchResult?.results[0];
	}, [initialSearchResult]);

	const handleTopReached = useEvent(async () => {
		if (messagesState.current.noMessagesBefore || isFetching.current) {
			return;
		}

		isFetching.current = true;
		try {
			const { messages: fetchedMessages, noMessagesBefore } = await chatClient.fetchMessages(
				roomIdentifier,
				additionalChunkSize,
				getMessage(0),
				undefined,
			);

			const clipped = unshiftMessages(fetchedMessages);

			const newState = {
				noMessagesBefore,
				noMessagesAfter: !clipped && messagesState.current.noMessagesAfter,
			};
			setNoMessagesAfter(newState.noMessagesAfter);
			setNoMessagesBefore(newState.noMessagesBefore);
			messagesState.current = newState;
		} finally {
			isFetching.current = false;
		}
	});

	const handleBottomReached = useEvent(async () => {
		if (messagesState.current.noMessagesAfter || isFetching.current) {
			return;
		}

		isFetching.current = true;
		try {
			const { messages: fetchedMessages, noMessagesAfter } = await chatClient.fetchMessages(
				roomIdentifier,
				additionalChunkSize,
				undefined,
				getMessage(-1),
			);

			const clipped = pushMessages(fetchedMessages);
			const newState = {
				noMessagesAfter,
				noMessagesBefore: !clipped && messagesState.current.noMessagesBefore,
			};

			setNoMessagesAfter(newState.noMessagesAfter);
			setNoMessagesBefore(newState.noMessagesBefore);
			messagesState.current = newState;
		} finally {
			isFetching.current = false;
		}
	});

	const onVisibleFrameChange = (frame: Frame) => {
		visibleFrame.current = frame;
	};

	return {
		messages,
		onTopReached: handleTopReached,
		onBottomReached: handleBottomReached,
		noMessagesBefore,
		noMessagesAfter,
		onVisibleFrameChange,
		containerReference,
		focusedItem: focusedItem.current,
	};
};
