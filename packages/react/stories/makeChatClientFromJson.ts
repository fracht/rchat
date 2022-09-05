import { ChatClient } from '@rchat/client';
import { Socket } from 'socket.io-client';
import { SocketIO, Server, SocketIOClient } from 'mock-socket';

const pause = (ms: number) => {
	return new Promise<void>((resolve) => {
		setTimeout(resolve, ms);
	});
};

export const makeChatClientFromJson = <TMessage>(
	roomIdentifier: string,
	allMessages: TMessage[],
	isLater: (a: TMessage, b: TMessage) => boolean,
	generateMessage: () => TMessage,
): [client: ChatClient<TMessage>, cleanup: () => void] => {
	const mockServer = new Server('ws://localhost:1234');

	const reversedAllMessages = [...allMessages].reverse();

	mockServer.on('connection', async (socket) => {
		const socketIO = socket as unknown as SocketIOClient;
		while (true) {
			await pause(1000 + Math.random() * 5000);

			const newMessage = generateMessage();
			socketIO.emit(
				'chatMessage',
				JSON.stringify({
					roomIdentifier,
					message: newMessage,
				}),
			);
			allMessages.push(newMessage);
			reversedAllMessages.unshift(newMessage);
		}
	});

	const socket = SocketIO('ws://localhost:1234');

	const realSocket: SocketIOClient = { ...socket } as SocketIOClient;
	realSocket.on = (type, callback) => {
		return socket.on(type, (msg) => callback(JSON.parse(msg as any)));
	};

	return [
		new ChatClient(realSocket as unknown as Socket, async (_, count, before, after) => {
			if (after !== undefined) {
				const beginIndex = allMessages.findIndex((value) => isLater(value, after));

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
				const beginIndexReversed = reversedAllMessages.findIndex((value) => isLater(before, value));
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
		}),
		() => {
			mockServer.stop();
		},
	];
};
