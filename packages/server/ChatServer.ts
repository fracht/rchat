import { ChatService } from "./ChatService.ts";
import { ChatWebSocket } from "./ChatWebsocket.ts";
import { http, log, shared } from "./deps.ts";

enum WebSocketStatusCode {
	NORMAL_CLOSURE = 1000,
	GOING_AWAY = 1001,
	UNSUPPORTED_DATA = 1003,
	POLICY_VIOLATION = 1008,
	INTERNAL_ERROR = 1011,
}

export class ChatServer {
	private readonly logger: log.Logger;
	private socketRegistry = new Map<string, ChatWebSocket>();
	private userToSocketMapping = new Map<string, string[]>();
	private readonly service: ChatService;
	private readonly MAX_SOCKET_PER_USER = 10;

	public constructor(
		service: ChatService,
		logger: log.Logger = log.getLogger(),
	) {
		this.service = service;
		this.logger = logger;
	}

	private registerSocket = (
		event: shared.ChatEvent<shared.MessageEventType.OPEN, ChatWebSocket>,
	) => {
		const socket = event.target;

		if (
			this.userToSocketMapping.has(socket.userIdentifier) &&
			this.userToSocketMapping.get(socket.userIdentifier)!.length >=
				this.MAX_SOCKET_PER_USER
		) {
			this.logger.error("Too many WebSockets for one user open.");

			socket.close(WebSocketStatusCode.POLICY_VIOLATION, "Too many WebSockets for one user open.");

			return;
		}

		this.socketRegistry.set(socket.identifier, socket);
		if (this.userToSocketMapping.has(socket.userIdentifier)) {
			this.userToSocketMapping.get(socket.userIdentifier)!.push(
				socket.identifier,
			);
		} else {
			this.userToSocketMapping.set(socket.userIdentifier, [socket.identifier]);
		}
	};

	private removeSocket = (
		event: shared.ChatEvent<
			shared.MessageEventType.CLOSE | shared.MessageEventType.ERROR,
			ChatWebSocket
		>,
	) => {
		const { type, payload } = event.data;

		if (type === shared.MessageEventType.ERROR) {
			this.logger.error("Websocket closed due to unexpected error.");
		} else if (
			payload && payload.code !== WebSocketStatusCode.NORMAL_CLOSURE && payload.code !== WebSocketStatusCode.GOING_AWAY
		) {
			this.logger.error(
				`Websocket closed with error: ${payload.reason} [${payload.code}]`,
			);
		}

		const socket = event.target;
		this.socketRegistry.delete(socket.identifier);
		const socketsAssociatedWithUser = this.userToSocketMapping.get(
			socket.userIdentifier,
		);
		if (!socketsAssociatedWithUser) {
			this.logger.warning(
				"Removed socket, that was not associated with any user.",
			);
			return;
		}

		const index = socketsAssociatedWithUser.indexOf(socket.identifier);
		if (index === -1) {
			this.logger.warning(
				"Removed socket, that was not associated with any user.",
			);
			return;
		}

		socketsAssociatedWithUser.splice(index, 1);
		if (socketsAssociatedWithUser.length === 0) {
			this.userToSocketMapping.delete(socket.userIdentifier);
		}
	};

	private socketHeartbeat = (
		event: shared.ChatEvent<shared.MessageEventType.OPEN, ChatWebSocket>,
	) => {
		const socket = event.target;
		let isSocketAlive = true;

		event.target.on(shared.MessageEventType.HEARTBEAT, () => {
			isSocketAlive = true;
		});

		const interval = setInterval(() => {
			if (
				!isSocketAlive || socket.readyState === WebSocket.CLOSED ||
				socket.readyState === WebSocket.CLOSING
			) {
				socket.close(
					WebSocketStatusCode.POLICY_VIOLATION,
					"Socket isn't alive.",
				);
				clearInterval(interval);
			}

			if (socket.readyState === WebSocket.OPEN) {
				isSocketAlive = false;
				socket.send(new Uint8Array([shared.MessageEventType.HEARTBEAT]));
			}
		}, 30000);

		event.target.on(
			shared.MessageEventType.CLOSE,
			() => clearInterval(interval),
		);
	};

	private requestHandler = async (request: Request): Promise<Response> => {
		if (request.headers.get("upgrade") !== "websocket") {
			return new Response(undefined, { status: http.Status.NotImplemented });
		}
		const { socket, response } = Deno.upgradeWebSocket(request);

		const socketIdentifier = crypto.randomUUID();
		if (this.socketRegistry.has(socketIdentifier)) {
			this.logger.error(
				"Server generated socket identifier that already exists in socket registry",
			);

			return new Response(undefined, {
				status: http.Status.InternalServerError,
			});
		}

		let userIdentifier: string | undefined = undefined;

		try {
			userIdentifier = await this.service.getUserIdentifier(request);
		} catch (error: unknown) {
			this.logger.error(
				"Unexpected exception occurred while trying to get user identifier: ",
				error,
			);

			return new Response(undefined, {
				status: http.Status.InternalServerError,
			});
		}

		if (
			this.userToSocketMapping.has(userIdentifier) &&
			this.userToSocketMapping.get(userIdentifier)!.length >=
				this.MAX_SOCKET_PER_USER
		) {
			this.logger.error("Too many WebSockets for one user open.");

			return new Response(undefined, {
				status: http.Status.InternalServerError,
			});
		}

		const chatSocket = new ChatWebSocket(
			socket,
			socketIdentifier,
			userIdentifier,
		);

		chatSocket.once(shared.MessageEventType.OPEN, this.registerSocket);
		chatSocket.once(shared.MessageEventType.CLOSE, this.removeSocket);
		chatSocket.once(shared.MessageEventType.ERROR, this.removeSocket);
		chatSocket.once(shared.MessageEventType.OPEN, this.socketHeartbeat);

		return response;
	};

	public start = (options?: http.ServeInit) => {
		http.serve(this.requestHandler, options);
	};
}
