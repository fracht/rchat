import {
	Ref,
	useRef,
	useState,
	startTransition as startDefaultTransition,
	TransitionFunction,
	useEffect,
	useCallback,
} from 'react';
import { Frame } from './EndlessList/useVisibleFrame';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEvent } from './internal/useEvent';
import { ChatClient, MessageFetchResult, MessageSearchResult } from '@rchat/client';
import { findNewElementIndex } from './useMessages';
import { clamp } from './internal/clamp';

export type UseMessagesBag<TMessage> = {
	messages: TMessage[];
	onTopReached: () => void;
	onBottomReached: () => void;
	noMessagesBefore: boolean;
	noMessagesAfter: boolean;
	onVisibleFrameChange: (frame: Frame) => void;
	containerReference: Ref<HTMLElement>;
	focusedItem?: TMessage;
};

export type UseMessagesConfig<TMessage> = {
	initialMessagesState: MessageFetchResult<TMessage>;
	initialSearchResult?: MessageSearchResult<TMessage>;
	compareItems: (a: TMessage, b: TMessage) => number;
	maxChunkSize: number;
	additionalChunkSize: number;
	chatClient: ChatClient<TMessage>;
	roomIdentifier: string;
	startTransition?: (scope: TransitionFunction) => void;
};

export type Anchors<TMessage> = {
	before: TMessage | undefined;
	after: TMessage | undefined;
};

export type KeepDirection = 'beginning' | 'ending';

const getClippedArray = <T,>(items: T[], maxSize: number, keep: KeepDirection) => {
	if (items.length <= maxSize) {
		return items;
	}

	if (keep === 'beginning') {
		return items.slice(0, maxSize);
	}

	if (keep === 'ending') {
		return items.slice(-maxSize);
	}

	throw new Error(`Unrecognized "keep" option value: "${keep}"`);
};

const insertInArray = <T,>(array: T[], item: T, index: number) => {
	return [...array.slice(0, index), item, ...array.slice(index)];
};

export const useSuspenseMessages = <TMessage,>({
	roomIdentifier,
	chatClient,
	initialMessagesState,
	startTransition = startDefaultTransition,
	maxChunkSize,
	additionalChunkSize,
	initialSearchResult,
	compareItems,
}: UseMessagesConfig<TMessage>): UseMessagesBag<TMessage> => {
	const visibleFrame = useRef<Frame>({ begin: -1, end: -1 });
	const containerReference = useRef<HTMLElement>(null);
	const messagesState = useRef<Omit<MessageFetchResult<TMessage>, 'messages'>>(initialMessagesState);

	const searchResults = useRef<MessageSearchResult<TMessage> | undefined>(initialSearchResult);
	const selectedSearchResult = useRef(0);

	const focusedItem = useRef<TMessage | undefined>(initialSearchResult?.results[0]);
	const oldMessagesRef = useRef([...initialMessagesState.messages]);

	const [anchors, setAnchors] = useState<Anchors<TMessage>>({
		before: undefined,
		after: undefined,
	});

	const queryClient = useQueryClient();

	const fetchMessages = async (roomIdentifier: string, { before, after }: Anchors<TMessage>) => {
		let clippedItems;
		let newState;

		if (before && after) {
			// ACTION 1: search message. Both before and after are the same item.

			const [previousChunk, nextChunk] = await Promise.all([
				chatClient.fetchMessages(roomIdentifier, additionalChunkSize, before, undefined),
				chatClient.fetchMessages(roomIdentifier, additionalChunkSize, undefined, after),
			]);

			newState = {
				noMessagesBefore: previousChunk.noMessagesBefore,
				noMessagesAfter: nextChunk.noMessagesAfter,
			};

			clippedItems = getClippedArray(
				[...previousChunk.messages, before, ...nextChunk.messages],
				maxChunkSize,
				'beginning',
			);
		} else {
			const { messages, noMessagesAfter, noMessagesBefore } = await chatClient.fetchMessages(
				roomIdentifier,
				additionalChunkSize,
				before,
				after,
			);

			if (before) {
				// ACTION 2: on top reached.

				const items = [...messages, ...oldMessagesRef.current];
				clippedItems = getClippedArray(items, maxChunkSize, 'beginning');

				const clipped = items.length > clippedItems.length;
				newState = {
					noMessagesBefore,
					noMessagesAfter: !clipped && messagesState.current.noMessagesAfter,
				};
			} else {
				// ACTION 3: on bottom reached.

				const items = [...oldMessagesRef.current, ...messages];
				clippedItems = getClippedArray(items, maxChunkSize, 'ending');

				const clipped = items.length > clippedItems.length;
				newState = {
					noMessagesAfter,
					noMessagesBefore: !clipped && messagesState.current.noMessagesBefore,
				};
			}
		}

		messagesState.current = newState;
		oldMessagesRef.current = clippedItems;
		return clippedItems;
	};

	const { data } = useQuery(
		[{ roomIdentifier, anchors }],
		({ queryKey: [{ roomIdentifier, anchors }] }) => fetchMessages(roomIdentifier, anchors),
		// Initial data must be set only for initial query (see https://github.com/TanStack/query/issues/4297)
		{
			suspense: true,
			initialData: !anchors.after && !anchors.before ? [...initialMessagesState.messages] : undefined,
			cacheTime: 10 * 1000,
		},
	);

	const messages = data!;

	const handleIncomingMessage = (message: TMessage, messageRoomIdentifier: string) => {
		if (roomIdentifier === messageRoomIdentifier && messagesState.current.noMessagesAfter) {
			const messagesCacheEntry = queryClient.getQueryCache().find([{ roomIdentifier, anchors }]);

			if (messagesCacheEntry) {
				const allMessages = messagesCacheEntry.state.data as TMessage[];
				const incomingMessageIndex = findNewElementIndex(allMessages, message, compareItems);

				const keepDirection: KeepDirection =
					visibleFrame.current.begin < visibleFrame.current.end ? 'beginning' : 'ending';

				const newMessages = insertInArray(allMessages, message, incomingMessageIndex + 1);
				const clippedMessages = getClippedArray(newMessages, maxChunkSize, keepDirection);

				queryClient.setQueryData([{ roomIdentifier, anchors }], clippedMessages);

				const clipped = clippedMessages.length < newMessages.length;

				if (clipped) {
					if (keepDirection === 'beginning') {
						messagesState.current.noMessagesAfter = false;
					} else {
						messagesState.current.noMessagesBefore = false;
					}
				}
			}
		}
	};

	const focusItem = useCallback(
		async (item: TMessage | undefined) => {
			focusedItem.current = item;
			if (!item) {
				return;
			}

			startTransition(() => {
				setAnchors({
					before: item,
					after: item,
				});
			});
		},
		[additionalChunkSize, chatClient, roomIdentifier],
	);

	const handleSearch = useCallback(
		(searchRoomIdentifier: string, searchResult: MessageSearchResult<TMessage>) => {
			if (searchRoomIdentifier === roomIdentifier) {
				searchResults.current = searchResult;
				selectedSearchResult.current = 0;
				focusItem(searchResult.results[0]);
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

	const onTopReached = useEvent(() => {
		if (messagesState.current.noMessagesBefore) {
			return;
		}

		startTransition(() => {
			setAnchors({
				after: undefined,
				before: messages[0],
			});
		});
	});

	const onBottomReached = useEvent(() => {
		if (messagesState.current.noMessagesAfter) {
			return;
		}

		startTransition(() => {
			setAnchors({
				after: messages.at(-1),
				before: undefined,
			});
		});
	});

	const onVisibleFrameChange = (frame: Frame) => {
		visibleFrame.current = frame;
	};

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
		startTransition(() => {
			setAnchors({ before: undefined, after: undefined });
		});
		messagesState.current = initialMessagesState;
	}, [initialMessagesState]);

	useEffect(() => {
		searchResults.current = initialSearchResult;
		focusedItem.current = initialSearchResult?.results[0];
	}, [initialSearchResult]);

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
	}, [chatClient, handleIncomingMessage]);

	return {
		messages,
		onTopReached,
		onBottomReached,
		containerReference,
		onVisibleFrameChange,
		noMessagesBefore: messagesState.current.noMessagesBefore,
		noMessagesAfter: messagesState.current.noMessagesAfter,
		focusedItem: focusedItem.current,
	};
};
