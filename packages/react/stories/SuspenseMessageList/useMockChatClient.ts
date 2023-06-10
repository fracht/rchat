import { ChatClient } from '@rchat/client';
import { useEffect, useRef, useState } from 'react';
import { ChatSocketType } from '@rchat/shared';
import { Socket } from 'socket.io-client';
import { SocketIO, Server } from 'mock-socket';

const fakeUrl = 'ws://localhost:1234';

const pause = (ms: number) => {
	return new Promise<void>((resolve) => {
		setTimeout(resolve, ms);
	});
};

export type ExampleMessage = {
	message: string;
	isLeft: boolean;
	id: number;
	date: Date;
};

export type MockChatClientConfig = {
	roomIdentifier: string;
	initialMessages: ExampleMessage[];
	compare: (a: ExampleMessage, b: ExampleMessage) => number;
};

export const useMockChatClient = ({ roomIdentifier, initialMessages, compare }: MockChatClientConfig) => {
	const data = useRef<Record<string, ExampleMessage[]>>({
		[roomIdentifier]: [...initialMessages],
	});

	const lastIdRef = useRef<Record<string, number>>({
		[roomIdentifier]: initialMessages.length,
	});

	const [mockServer] = useState(() => {
		const server = new Server(fakeUrl);

		server.on('connection', async (socket) => {
			const socketIO = socket as unknown as ChatSocketType<ExampleMessage>;

			socketIO.on('sendMessage', async (message, roomIdentifier) => {
				if (!lastIdRef.current[roomIdentifier]) {
					lastIdRef.current[roomIdentifier] = initialMessages.length;
				}

				message.id = ++lastIdRef.current[roomIdentifier];
				message.message = `${message.id} ${message.message}`;

				pause(Number(Math.random() > 0.5) * 2000).then(() => {
					data.current[roomIdentifier].push(message);
					data.current[roomIdentifier].sort(compare);
					socketIO.emit('receiveMessage', message, roomIdentifier);
				});
			});
		});

		return server;
	});

	const [socket] = useState(() => SocketIO(fakeUrl));

	useEffect(() => {
		return () => {
			mockServer.stop();
		};
	}, []);

	const [chatClient] = useState(
		() =>
			new ChatClient<ExampleMessage>(socket as unknown as Socket, {
				fetchMessages: async (currentRoomIdentifier, count, before, after) => {
					if (!data.current[currentRoomIdentifier]) {
						data.current[currentRoomIdentifier] = [...initialMessages];
					}

					const allMessages = data.current[currentRoomIdentifier];
					const reversedAllMessages = [...data.current[currentRoomIdentifier]].reverse();

					if (after !== undefined) {
						const beginIndex = allMessages.findIndex((value) => compare(value, after) > 0);

						if (beginIndex === -1) {
							return {
								messages: [],
								noMessagesAfter: true,
								noMessagesBefore: false,
							};
						}

						return {
							messages: allMessages.slice(beginIndex, beginIndex + count),
							noMessagesAfter: beginIndex + count >= allMessages.length,
							noMessagesBefore: false,
						};
					}

					if (before !== undefined) {
						const beginIndexReversed = reversedAllMessages.findIndex((value) => compare(before, value) > 0);
						const beginIndex = allMessages.length - beginIndexReversed;

						if (beginIndexReversed === -1) {
							return {
								messages: [],
								noMessagesBefore: true,
								noMessagesAfter: false,
							};
						}

						return {
							messages: allMessages.slice(Math.max(0, beginIndex - count), beginIndex),
							noMessagesBefore: beginIndex - count <= 0,
							noMessagesAfter: false,
						};
					}

					return {
						messages: allMessages.slice(-count),
						noMessagesAfter: true,
						noMessagesBefore: count >= allMessages.length,
					};
				},
				searchMessages: async (currentRoomIdentifier: string, criteria: unknown) => {
					if (typeof criteria !== 'string') {
						throw Error('Search criteria must be a string!');
					}

					const allMessages = data.current[currentRoomIdentifier];
					const filteredMessages = allMessages.filter(({ message }) => message.includes(criteria)).reverse();

					return {
						results: filteredMessages,
						totalCount: filteredMessages.length,
					};
				},
			}),
	);

	return chatClient;
};
