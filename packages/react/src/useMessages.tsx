import { MessageFetchResult } from '@rchat/client';
import { ChatClient } from '@rchat/client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useEvent } from './internal/useEvent';

export type UseMessagesBag<T> = {
	messages: T[];
	onTopReached: () => void;
	onBottomReached: () => void;
};

export type UseMessagesConfig<T> = {
	initialChunkSize: number;
	maxChunkSize: number;
	additionalChunkSize: number;
	chatClient: ChatClient<T>;
	roomIdentifier: string;
};

export const useMessages = <TMessage,>({
	initialChunkSize,
	maxChunkSize,
	additionalChunkSize,
	chatClient,
	roomIdentifier,
}: UseMessagesConfig<TMessage>): UseMessagesBag<TMessage> => {
	const isFetching = useRef(false);

	const [messages, setMessages] = useState<TMessage[]>([]);

	const messagesState = useRef<MessageFetchResult<TMessage>>({
		messages: [],
		noMessagesAfter: true,
		noMessagesBefore: false,
	});

	const setMessagesState = useCallback((state: MessageFetchResult<TMessage>) => {
		messagesState.current = state;
		setMessages(state.messages);
	}, []);

	const handleIncomingMessage = useCallback(
		(event: CustomEvent<{ roomIdentifier: string; message: TMessage }>) => {
			console.log(event);
			if (event.detail.roomIdentifier === roomIdentifier && messagesState.current.noMessagesAfter) {
				setMessagesState({
					messages: [...messagesState.current.messages, event.detail.message],
					noMessagesAfter: true,
					noMessagesBefore: messagesState.current.noMessagesBefore,
				});
			}
		},
		[roomIdentifier, setMessagesState],
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

			setMessagesState(fetchedMessagesState);
		};

		load();
	}, [roomIdentifier, chatClient, initialChunkSize, setMessagesState]);

	const handleTopReached = useEvent(async () => {
		if (messagesState.current.noMessagesBefore || isFetching.current) {
			return;
		}

		isFetching.current = true;
		const { messages: fetchedMessages, noMessagesBefore } = await chatClient.fetchMessages(
			roomIdentifier,
			additionalChunkSize,
			messagesState.current.messages[0],
			undefined,
		);

		const newMessages = [...fetchedMessages, ...messagesState.current.messages];

		const newState = {
			messages: newMessages.slice(0, maxChunkSize),
			noMessagesBefore,
			noMessagesAfter: newMessages.length <= maxChunkSize && messagesState.current.noMessagesAfter,
		};

		setMessagesState(newState);
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
			messagesState.current.messages[messagesState.current.messages.length - 1],
		);

		const newMessages = [...messagesState.current.messages, ...fetchedMessages];
		const newState = {
			messages: newMessages.slice(-maxChunkSize),
			noMessagesAfter,
			noMessagesBefore: newMessages.length <= maxChunkSize && messagesState.current.noMessagesBefore,
		};

		setMessagesState(newState);
		isFetching.current = false;
	});

	return {
		messages,
		onTopReached: handleTopReached,
		onBottomReached: handleBottomReached,
	};
};
