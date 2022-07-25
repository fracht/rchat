import { Socket, io } from 'socket.io-client';

export class ChatClient {
    private readonly socket: Socket;

    public constructor(url: string);
    public constructor(socket: Socket);
    public constructor(urlOrSocket: string | Socket) {
        if (typeof urlOrSocket === 'string') {
            this.socket = io(urlOrSocket);
        } else {
            this.socket = urlOrSocket;
        }
    }

    public sendMessage = (roomIdentifier: string, message: unknown) => {
        this.socket.emit('chatMessage', {
            roomIdentifier,
            message,
        });
    };

    public close = () => {
        this.socket.close();
    };
}
