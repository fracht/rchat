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

	mockServer.on('connection', async (socket) => {
		const socketIO = socket as unknown as SocketIOClient;
		while (true) {
			await pause(1000 + Math.random() * 5000);

			socketIO.emit(
				'chatMessage',
				JSON.stringify({
					roomIdentifier,
					message: generateMessage(),
				}),
			);
		}
	});

	const reversedAllMessages = [...allMessages].reverse();

	return [
		new ChatClient(SocketIO('ws://localhost:1234') as unknown as Socket, async (_, count, before, after) => {
			if (after !== undefined) {
				const beginIndex = allMessages.findIndex((value) => isLater(value, after));

				if (beginIndex === -1) {
					console.log(1);
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
