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
	compareItems: (a: T, b: T) => number;
	initialChunkSize: number;
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
	initialChunkSize,
	maxChunkSize,
	additionalChunkSize,
	chatClient,
	roomIdentifier,
	compareItems,
}: UseMessagesConfig<TMessage>): UseMessagesBag<TMessage> => {
	const isFetching = useRef(false);
	const visibleFrame = useRef<Frame>({ begin: -1, end: -1 });
	const containerReference = useRef<HTMLElement>(null);
	const [isLoaded, setIsLoaded] = useState(false);
	const searchResults = useRef<MessageSearchResult<TMessage>>();
	const selectedSearchResult = useRef(0);
	const focusedItem = useRef<TMessage>();

	const [
		messages,
		{
			push: pushMessages,
			unshift: unshiftMessages,
			set: setMessages,
			insert: insertMessage,
			at: getMessage,
			getAll: getAllMessages,
		},
	] = useBoundedArray<TMessage>([], maxChunkSize);

	const messagesState = useRef<Omit<MessageFetchResult<TMessage>, 'messages'>>({
		noMessagesAfter: true,
		noMessagesBefore: false,
	});

	const handleIncomingMessage = useCallback(
		(event: CustomEvent<[message: TMessage, roomIdentifier: string]>) => {
			const [message, messageRoomIdentifier] = event.detail;

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
			focusedItem.current = item;
			if (!item) {
				return;
			}

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
		[additionalChunkSize, chatClient, roomIdentifier, setMessages],
	);

	const handleSearch = useCallback(
		(event: CustomEvent<[roomIdentifier: string, searchResult: MessageSearchResult<TMessage>]>) => {
			const [searchRoomIdentifier, searchResult] = event.detail;

			if (searchRoomIdentifier === roomIdentifier) {
				searchResults.current = searchResult;
				selectedSearchResult.current = 0;
				focusItem(searchResult.results[0]);
			}
		},
		[focusItem, roomIdentifier],
	);

	const handlePreviousSearchResult = useCallback(
		(event: CustomEvent<[roomIdentifier: string]>) => {
			const [searchRoomIdentifier] = event.detail;

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
		(event: CustomEvent<[roomIdentifier: string]>) => {
			const [searchRoomIdentifier] = event.detail;

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

	useEffect(() => {
		const load = async () => {
			const fetchedMessagesState = await chatClient.fetchMessages(
				roomIdentifier,
				initialChunkSize,
				undefined,
				undefined,
			);

			setMessages(fetchedMessagesState.messages, 'ending');
			setIsLoaded(true);
			messagesState.current = fetchedMessagesState;
		};

		load();
	}, [roomIdentifier, chatClient, initialChunkSize, setMessages]);

	useEffect(() => {
		if (isLoaded) {
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
	}, [isLoaded]);

	const handleTopReached = useEvent(async () => {
		if (messagesState.current.noMessagesBefore || isFetching.current) {
			return;
		}

		isFetching.current = true;
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
		messagesState.current = newState;
		isFetching.current = false;
	});

	const handleBottomReached = useEvent(async () => {
		if (messagesState.current.noMessagesAfter || isFetching.current) {
			return;
		}

		isFetching.current = true;
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

		messagesState.current = newState;
		isFetching.current = false;
	});

	const onVisibleFrameChange = (frame: Frame) => {
		visibleFrame.current = frame;
	};

	return {
		messages,
		onTopReached: handleTopReached,
		onBottomReached: handleBottomReached,
		noMessagesBefore: messagesState.current.noMessagesBefore,
		noMessagesAfter: messagesState.current.noMessagesAfter,
		onVisibleFrameChange,
		containerReference,
		focusedItem: focusedItem.current,
	};
};
