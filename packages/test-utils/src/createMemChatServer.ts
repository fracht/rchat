import { ChatServer } from '@rchat/server';
import { Server } from 'socket.io';

export function createMemChatServer() {
	const socketIoServer = new Server(1234);
	const chatServer = new ChatServer(
		{
			fetchConnectionInfo: async (request) => {
				const userIdentifier = request.headers['x-test'] as string;

				return {
					userIdentifier,
				};
			},
			getChatParticipants: async () => {
				return [];
			},
			saveMessage: async (message) => message,
		},
		socketIoServer,
	);

	return chatServer;
}
