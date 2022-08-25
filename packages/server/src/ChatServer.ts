import { ChatService } from './ChatService';
import { Server, Socket } from 'socket.io';
import type { ExtendedError } from 'socket.io/dist/namespace';

export class ChatServer {
	public constructor(private readonly service: ChatService, private readonly server: Server) {
		server.use(this.authentication);
	}

	private authentication = async (socket: Socket, next: (err?: ExtendedError) => void) => {
		try {
			const connectionInfo = await this.service.fetchConnectionInfo(socket.request);

			socket.data = connectionInfo;

			next();
		} catch (error) {
			console.error('Unexpected error occurred while trying to get user identifier', error);
			next(new Error('Forbidden'));
		}
	};
}
