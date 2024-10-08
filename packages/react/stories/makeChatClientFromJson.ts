import { ChatClient } from '@rchat/client';
import { ChatSocketType } from '@rchat/shared';
import { Socket } from 'socket.io-client';
import { SocketIO, Server } from 'mock-socket';

const pause = (ms: number) => {
	return new Promise<void>((resolve) => {
		setTimeout(resolve, ms);
	});
};

export const makeChatClientFromJson = <TMessage>(
	roomIdentifier: string,
	allMessages: TMessage[],
	compare: (a: TMessage, b: TMessage) => number,
	generateMessage: () => TMessage,
): [client: ChatClient<TMessage>, cleanup: () => void] => {
	const mockServer = new Server('ws://localhost:1234');

	allMessages.sort(compare);
	let reversedAllMessages = [...allMessages].reverse();

	mockServer.on('connection', async (socket) => {
		const socketIO = socket as unknown as ChatSocketType<TMessage>;
		while (true) {
			await pause(1000 + Math.random() * 5000);

			const newMessage = generateMessage();
			// Imitate different network speed of sending messages in chat
			pause(Number(Math.random() > 0.5) * 10000).then(() => {
				socketIO.emit('receiveMessage', newMessage, roomIdentifier);
				allMessages.push(newMessage);
				allMessages.sort(compare);
				reversedAllMessages = [...allMessages].reverse();
			});
		}
	});

	const socket = SocketIO('ws://localhost:1234');

	return [
		new ChatClient<TMessage>(socket as unknown as Socket, {
			fetchMessages: async (_, count, before, after) => {
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
					const beginIndex = allMessages.length - beginIndexReversed - 1;

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
			searchMessages: () => Promise.resolve({ results: [], totalCount: 0 }),
		}),
		() => {
			mockServer.stop();
		},
	];
};
