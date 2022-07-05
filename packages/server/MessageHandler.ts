import { ChatWebSocket } from './ChatWebsocket.ts';
import { events, shared, binaryParser } from './deps.ts';

type ChatEvents = {
    [K in shared.MessageEventType]: [event: shared.ChatEvent<K, ChatWebSocket>];
};

const messageParser = new binaryParser.Parser().uint8('type').choice('payload', {
    tag: 'type',
    choices: {
        [shared.MessageEventType.HEARTBEAT]: 'stop',
    },
});

export class MessageHandler extends events.EventEmitter<ChatEvents> {
    private handleOpenEvent = (event: Event) => {
        this.emit(shared.MessageEventType.OPEN, {
            target: event.target as ChatWebSocket,
            data: {
                type: shared.MessageEventType.OPEN,
                payload: undefined,
            },
        });
    };

    private handleCloseEvent = (event: CloseEvent) => {
        this.emit(shared.MessageEventType.CLOSE, {
            target: event.target as ChatWebSocket,
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
            target: event.target as ChatWebSocket,
            data: {
                type: shared.MessageEventType.ERROR,
                payload: undefined,
            },
        });
    };

    private handleMessageEvent = (event: MessageEvent<ArrayBuffer>) => {
        const parsedData: shared.ChatEvent['data'] = messageParser.parse(event.data);
        this.emit(parsedData.type, {
            target: event.target as ChatWebSocket,
            data: parsedData,
            // deno-lint-ignore no-explicit-any
        } as any);
    };

    public registerNewSocket = (socket: ChatWebSocket) => {
        socket.addEventListener('open', this.handleOpenEvent);
        socket.addEventListener('close', this.handleCloseEvent);
        socket.addEventListener('error', this.handleErrorEvent);
        socket.addEventListener('message', this.handleMessageEvent);
    };
}