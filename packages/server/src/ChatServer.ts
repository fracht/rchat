import { ChatService } from './ChatService';
import { Server } from 'socket.io';

export class ChatServer {
    public constructor(private readonly service: ChatService, private readonly server: Server) {
        server.on('data', (socket) => {
            console.log(socket);
        });
    }
}
