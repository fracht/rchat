import { MessageEventType } from '../shared/events.ts';
import { log, binaryParser } from './deps.ts';
import { MessageHandler } from './MessageHandler.ts';

enum WebSocketStatusCode {
    POLICY_VIOLATION = 1008,
}

export class ChatServer {
    private readonly logger: log.Logger;
    private socketRegistry = new Map<string, WebSocket>();
    private readonly messageHandler: MessageHandler;

    public constructor(logger: log.Logger = log.getLogger()) {
        this.logger = logger;
        this.messageHandler = new MessageHandler();
    }

    private logSocketCritical = (socket: WebSocket, error: string, errorCode: number) => {
        this.logger.error(`Critical socket exception occurred: ${error} [${errorCode}]`);
        socket.close(errorCode, error);
    };

    private decodeMessageBuffer = (buffer: ArrayBuffer) => {
        const array = new Uint8Array(buffer);

        if (array.length === 0) {
            throw new Error('Invalid socket message - buffer is empty.');
        }

        const messageType = array.at(0)!;
        const payload = array.subarray(1);

        return [messageType, payload] as const;
    };

    private performHandshake = (socket: WebSocket) => {
        socket.addEventListener('message', (event: MessageEvent<ArrayBuffer>) => {
            try {
                const [messageType, payload] = this.decodeMessageBuffer(event.data);
                console.log(binaryParser.Parser.start().int16('hello').parse(payload));
            } catch (error) {
                this.logger.error(`Socket event failure: `);
            }

            this.messageHandler.emit(MessageEventType.HANDSHAKE);
        });
    };

    private requestHandler = (request: Request): Response => {
        if (request.headers.get('upgrade') !== 'websocket') {
            return new Response(undefined, { status: 501 });
        }
        const { socket, response } = Deno.upgradeWebSocket(request);
        // This.socketRegistry.set(uuid, socket);

        return response;
    };

    public start = (options?: ServeInit) => {
        serve(this.requestHandler, options);
    };
}
