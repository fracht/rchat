import { MessageEventType } from '../shared/MessageEventType.ts';
import { ChatService } from './ChatService.ts';
import { ChatWebSocket } from './ChatWebsocket.ts';
import { log, http } from './deps.ts';
import { MessageHandler } from './MessageHandler.ts';

enum WebSocketStatusCode {
    UNSUPPORTED_DATA = 1003,
    POLICY_VIOLATION = 1008,
    INTERNAL_ERROR = 1011,
    NORMAL_CLOSURE = 1000,
}

export class ChatServer {
    private readonly logger: log.Logger;
    private socketRegistry = new Map<string, ChatWebSocket>();
    private userToSocketMapping = new Map<string, string[]>();
    private readonly messageHandler: MessageHandler;
    private readonly service: ChatService;
    private readonly MAX_SOCKET_PER_USER = 10;

    public constructor(service: ChatService, logger: log.Logger = log.getLogger()) {
        this.service = service;
        this.logger = logger;
        this.messageHandler = new MessageHandler();

        this.messageHandler.on(MessageEventType.OPEN, (event) => {
            this.addSocket(event.target);
            this.socketHeartbeat(event.target);
        });
        this.messageHandler.on(MessageEventType.CLOSE, (event) => {
            if (event.data.payload.code !== WebSocketStatusCode.NORMAL_CLOSURE) {
                this.logger.error(
                    `Websocket closed with unexpected error: ${event.data.payload.reason} [${event.data.payload.code}].`,
                );
            }

            this.removeSocket(event.target);
        });
        this.messageHandler.on(MessageEventType.ERROR, (event) => {
            this.logger.error('Unexpected websocket error occurred.');
            this.removeSocket(event.target);
        });
    }

    private addSocket = (socket: ChatWebSocket) => {
        this.socketRegistry.set(socket.socketIdentifier, socket);
        if (this.userToSocketMapping.has(socket.userIdentifier)) {
            this.userToSocketMapping.get(socket.userIdentifier)!.push(socket.socketIdentifier);
        } else {
            this.userToSocketMapping.set(socket.userIdentifier, [socket.socketIdentifier]);
        }
    };

    private removeSocket = (socket: ChatWebSocket) => {
        this.socketRegistry.delete(socket.socketIdentifier);
        const socketsAssociatedWithUser = this.userToSocketMapping.get(socket.userIdentifier);
        if (!socketsAssociatedWithUser) {
            this.logger.warning('Removed socket, that was not associated with any user.');
            return;
        }

        const index = socketsAssociatedWithUser.indexOf(socket.socketIdentifier);
        if (index === -1) {
            this.logger.warning('Removed socket, that was not associated with any user.');
            return;
        }

        socketsAssociatedWithUser.splice(index, 1);
        if (socketsAssociatedWithUser.length === 0) {
            this.userToSocketMapping.delete(socket.userIdentifier);
        }
    };

    private socketHeartbeat = (socket: ChatWebSocket) => {
        let isSocketAlive = true;
    };

    private requestHandler = async (request: Request): Promise<Response> => {
        if (request.headers.get('upgrade') !== 'websocket') {
            return new Response(undefined, { status: 501 });
        }
        const { socket, response } = Deno.upgradeWebSocket(request);

        const socketIdentifier = crypto.randomUUID();
        if (this.socketRegistry.has(socketIdentifier)) {
            this.logger.error('Server generated socket identifier that already exists in socket registry');
            return new Response(undefined, { status: 505 });
        }

        let userIdentifier: string | undefined = undefined;

        try {
            userIdentifier = await this.service.getUserIdentifier(request);
        } catch (error: unknown) {
            this.logger.error('Unexpected exception occurred while trying to get user identifier: ', error);

            return new Response(undefined, { status: 505 });
        }

        const typedSocket: ChatWebSocket = socket as ChatWebSocket;
        typedSocket.userIdentifier = userIdentifier;
        typedSocket.socketIdentifier = socketIdentifier;

        this.messageHandler.registerNewSocket(typedSocket);

        return response;
    };

    public start = (options?: http.ServeInit) => {
        http.serve(this.requestHandler, options);
    };
}
