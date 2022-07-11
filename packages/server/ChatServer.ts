import { ChatService } from "./ChatService.ts";
import { ChatWebSocket } from "./ChatWebSocket.ts";
import { http, log, shared } from "./deps.ts";

export class ChatServer {
	private readonly logger: log.Logger;
	private socketRegistry = new Map<string, ChatWebSocket>();
	private channelRegistry = new Map<string, shared.Channel>();
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
		event: shared.ChatEvent<shared.ChatEventType.OPEN, ChatWebSocket>,
	) => {
		const socket = event.target;

		if (
			this.userToSocketMapping.has(socket.userIdentifier) &&
			this.userToSocketMapping.get(socket.userIdentifier)!.length >=
				this.MAX_SOCKET_PER_USER
		) {
			this.logger.error("Too many WebSockets for one user open.");

			socket.close(shared.WebSocketStatusCode.POLICY_VIOLATION, "Too many WebSockets for one user open.");

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
			shared.ChatEventType.CLOSE | shared.ChatEventType.SOCKET_ERROR,
			ChatWebSocket
		>,
	) => {
		const { type, payload } = event.data;

		if (type === shared.ChatEventType.SOCKET_ERROR) {
			this.logger.error("Websocket closed due to unexpected error.");
		} else if (
			payload && payload.code !== shared.WebSocketStatusCode.NORMAL_CLOSURE &&
			payload.code !== shared.WebSocketStatusCode.GOING_AWAY
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
		event: shared.ChatEvent<shared.ChatEventType.OPEN, ChatWebSocket>,
	) => {
		const socket = event.target;
		let isSocketAlive = true;

		event.target.on(shared.ChatEventType.HEARTBEAT, () => {
			isSocketAlive = true;
		});

		const interval = setInterval(() => {
			if (
				!isSocketAlive || socket.readyState === WebSocket.CLOSED ||
				socket.readyState === WebSocket.CLOSING
			) {
				socket.close(
					shared.WebSocketStatusCode.POLICY_VIOLATION,
					"Socket isn't alive.",
				);
				clearInterval(interval);
			}

			if (socket.readyState === WebSocket.OPEN) {
				isSocketAlive = false;
				socket.send({
					type: shared.ChatEventType.HEARTBEAT,
					payload: undefined,
				});
			}
		}, 30000);

		event.target.on(
			shared.ChatEventType.CLOSE,
			() => clearInterval(interval),
		);
	};

	private socketError = (
		socket: ChatWebSocket,
		error: string,
		errorCode = shared.WebSocketStatusCode.POLICY_VIOLATION,
	) => {
		socket.send({
			type: shared.ChatEventType.ERROR,
			payload: {
				code: errorCode,
				reason: error,
			},
		});
	};

	private onMessageReceived = async (event: shared.ChatEvent<shared.ChatEventType.MESSAGE, ChatWebSocket>) => {
		const currentUserId = event.target.userIdentifier;
		const currentChannelId = event.data.payload.channel;
		let channel: shared.Channel;
		let isNewChannel = false;

		if (this.channelRegistry.has(currentChannelId)) {
			channel = this.channelRegistry.get(currentChannelId)!;
		} else {
			const participantIdentifiers = await this.service.getChatParticipants(currentChannelId);

			channel = { participantIdentifiers };
			isNewChannel = true;
		}

		if (!channel.participantIdentifiers.includes(currentUserId)) {
			this.socketError(event.target, "User not belongs to channel.");
			return;
		}

		if (isNewChannel) {
			this.channelRegistry.set(currentChannelId, channel);
		}

		for (const userIdentifier of channel.participantIdentifiers) {
			const sockets = this.userToSocketMapping.get(userIdentifier);
			if (sockets) {
				for (const socketIdentifier of sockets) {
					const socket = this.socketRegistry.get(socketIdentifier);
					if (socket) {
						socket.send({
							type: shared.ChatEventType.MESSAGE,
							payload: {
								channel: currentChannelId,
								message: event.data.payload.message,
								sender: event.target.userIdentifier,
							},
						});
					}
				}
			}
		}
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
			this.logger,
		);

		chatSocket.once(shared.ChatEventType.OPEN, this.registerSocket);
		chatSocket.once(shared.ChatEventType.CLOSE, this.removeSocket);
		chatSocket.once(shared.ChatEventType.SOCKET_ERROR, this.removeSocket);
		chatSocket.once(shared.ChatEventType.OPEN, this.socketHeartbeat);
		chatSocket.on(shared.ChatEventType.MESSAGE, this.onMessageReceived);

		return response;
	};

	public start = (options?: http.ServeInit) => {
		http.serve(this.requestHandler, options);
	};
}
