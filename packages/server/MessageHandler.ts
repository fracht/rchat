import { events, shared } from './deps.ts';

type ChatEvents = {
    [K in shared.MessageEventType]: [shared.ChatEvent<K>];
};

export class MessageHandler extends events.EventEmitter<ChatEvents> {
    private handleOpenEvent = (event: Event) => {
        this.emit(shared.MessageEventType.OPEN, {
            target: event.target as WebSocket,
            data: {
                type: shared.MessageEventType.OPEN,
                payload: undefined,
            },
        });
    };

    private handleCloseEvent = (event: CloseEvent) => {
        this.emit(shared.MessageEventType.CLOSE, {
            target: event.target as WebSocket,
            data: {
                type: shared.MessageEventType.CLOSE,
                payload: {
                    code: event.code,
                    reason: event.reason,
                    wasClean: event.wasClean,
                },
            },
        });
    };

    private handleErrorEvent = (event: Event) => {
        this.emit(shared.MessageEventType.ERROR, {
            target: event.target as WebSocket,
            data: {
                type: shared.MessageEventType.ERROR,
                payload: undefined,
            },
        });
    };

    private handleMessageEvent = (event: MessageEvent<ArrayBuffer>) => {};

    public registerNewSocket = (socket: WebSocket) => {
        socket.addEventListener('open', this.handleOpenEvent);
        socket.addEventListener('close', this.handleCloseEvent);
        socket.addEventListener('error', this.handleErrorEvent);
        socket.addEventListener('message', this.handleMessageEvent);
    };
}
