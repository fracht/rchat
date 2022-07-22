import { ChatService } from './ChatService';
import { Server } from 'socket.io';

export class ChatServer {
    public constructor(private readonly service: ChatService, private readonly server: Server) {
        server.use(async (socket, next) => {
            try {
                const connectionInfo = await service.fetchConnectionInfo(socket.request);

                socket.data = connectionInfo;

                next();
            } catch (error) {
                console.error('Unexpected error occurred while trying to get user identifier', error);
                next(new Error('Forbidden'));
            }
        });
    }
}
