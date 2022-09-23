import { MessageFetchResult } from '@rchat/client';
import { ChatClient } from '@rchat/client';
import { useCallback, useEffect, useRef } from 'react';
import { Frame } from './EndlessList/useVisibleFrame';
import { KeepDirection, useBoundedArray } from './internal/useBoundedArray';
import { useEvent } from './internal/useEvent';

export type UseMessagesBag<T> = {
	messages: T[];
	onTopReached: () => void;
	onBottomReached: () => void;
	noMessagesBefore: boolean;
	noMessagesAfter: boolean;
	onVisibleFrameChange: (frame: Frame) => void;
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
		(event: CustomEvent<{ roomIdentifier: string; message: TMessage }>) => {
			if (event.detail.roomIdentifier === roomIdentifier && messagesState.current.noMessagesAfter) {
				const incomingMessageIndex = findNewElementIndex(getAllMessages(), event.detail.message, compareItems);

				const keepDirection: KeepDirection =
					visibleFrame.current.begin < visibleFrame.current.end ? 'beginning' : 'ending';

				const clipped = insertMessage(event.detail.message, incomingMessageIndex + 1, keepDirection);

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

	useEffect(() => {
		chatClient.addEventListener('chatMessage', handleIncomingMessage);

		return () => chatClient.removeEventListener('chatMessage', handleIncomingMessage);
	}, [chatClient, handleIncomingMessage]);

	useEffect(() => {
		const load = async () => {
			const fetchedMessagesState = await chatClient.fetchMessages(
				roomIdentifier,
				initialChunkSize,
				undefined,
				undefined,
			);

			setMessages(fetchedMessagesState.messages, 'ending');
			messagesState.current = fetchedMessagesState;
		};

		load();
	}, [roomIdentifier, chatClient, initialChunkSize, setMessages]);

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
	};
};
