import { MessageEventType } from '../shared/MessageEventType.ts';
import { ChatService } from './ChatService.ts';
import { log, binaryParser, http } from './deps.ts';
import { MessageHandler } from './MessageHandler.ts';

enum WebSocketStatusCode {
    UNSUPPORTED_DATA = 1003,
    POLICY_VIOLATION = 1008,
    INTERNAL_ERROR = 1011,
}

const WebSocketGenericError: Record<WebSocketStatusCode, string> = {
    [WebSocketStatusCode.POLICY_VIOLATION]: 'Policy violation.',
    [WebSocketStatusCode.INTERNAL_ERROR]: 'Internal server error.',
    [WebSocketStatusCode.UNSUPPORTED_DATA]: 'Unsupported data.',
};

export class ChatServer {
    private readonly logger: log.Logger;
    private socketRegistry = new Map<string, WebSocket>();
    private userToSocketMapping = new Map<string, string[]>();
    private readonly messageHandler: MessageHandler;
    private readonly messageParser: binaryParser.Parser;
    private readonly service: ChatService;
    private readonly MAX_SOCKET_PER_USER = 10;

    public constructor(service: ChatService, logger: log.Logger = log.getLogger()) {
        this.service = service;
        this.logger = logger;
        this.messageHandler = new MessageHandler();
        this.messageParser = new binaryParser.Parser().int16('version').int8('type').choice('payload', {
            tag: 'type',
            choices: {},
        });
        this.messageParser.compile();
    }

    private requestHandler = async (request: Request): Promise<Response> => {
        if (request.headers.get('upgrade') !== 'websocket') {
            return new Response(undefined, { status: 501 });
        }
        const { socket, response } = Deno.upgradeWebSocket(request);

        const socketIdentifier = crypto.randomUUID();
        if (this.socketRegistry.has(socketIdentifier)) {
            this.logger.critical('Server generated socket identifier that already exists in socket registry');
            return new Response(undefined, { status: 505 });
        }

        let userIdentifier: string | undefined = undefined;

        try {
            userIdentifier = await this.service.getUserIdentifier(request);
        } catch (error: unknown) {
            this.logger.error('Unexpected exception occurred while trying to get user identifier: ', error);

            return new Response(undefined, { status: 505 });
        }

        socket.addEventListener;

        this.messageHandler.registerNewSocket(socket);

        // this.socketRegistry.set(socketIdentifier, socket);
        // if (this.userToSocketMapping.has(userIdentifier)) {
        //     this.userToSocketMapping.get(userIdentifier)!.push(socketIdentifier);
        // } else {
        //     this.userToSocketMapping.set(userIdentifier, [socketIdentifier]);
        // }

        return response;
    };

    public start = (options?: http.ServeInit) => {
        http.serve(this.requestHandler, options);
    };
}
