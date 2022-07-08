import { events, log, shared } from "./deps.ts";

type ChatEvents = {
	[K in shared.ChatEventType]: [event: shared.ChatEvent<K, ChatWebSocket>];
};

export class ChatWebSocket extends events.EventEmitter<ChatEvents> {
	public constructor(
		private readonly socket: WebSocket,
		public readonly identifier: string,
		public readonly userIdentifier: string,
		private readonly logger: log.Logger,
	) {
		super();
		socket.addEventListener("open", this.handleOpenEvent);
		socket.addEventListener("close", this.handleCloseEvent);
		socket.addEventListener("error", this.handleErrorEvent);
		socket.addEventListener("message", this.handleMessageEvent);
	}

	public get readyState() {
		return this.socket.readyState;
	}

	public close(code: number, reason: string): void {
		this.socket.close(code, reason);
	}

	public send<TEventType extends shared.ChatEventType>(data: shared.ChatEventData<TEventType>): void {
		this.socket.send(JSON.stringify(data));
	}

	private handleOpenEvent = () => {
		this.emit(shared.ChatEventType.OPEN, {
			target: this,
			data: {
				type: shared.ChatEventType.OPEN,
				payload: undefined,
			},
		});
	};

	private handleCloseEvent = (event: CloseEvent) => {
		this.emit(shared.ChatEventType.CLOSE, {
			target: this,
			data: {
				type: shared.ChatEventType.CLOSE,
				payload: {
					code: event.code,
					reason: event.reason,
					wasClean: event.wasClean,
				},
			},
		});
	};

	private handleErrorEvent = () => {
		this.emit(shared.ChatEventType.SOCKET_ERROR, {
			target: this,
			data: {
				type: shared.ChatEventType.SOCKET_ERROR,
				payload: undefined,
			},
		});
	};

	private handleMessageEvent = (event: MessageEvent<string>) => {
		let parsedData: shared.ChatEvent["data"] | undefined;

		try {
			parsedData = JSON.parse(event.data);
		} catch (error) {
			this.send({
				type: shared.ChatEventType.ERROR,
				payload: {
					reason: "Invalid data format",
					code: shared.WebSocketStatusCode.UNSUPPORTED_DATA,
				},
			});

			this.logger.error(`Failed to parse data: ${error}`);

			return;
		}

		this.emit(parsedData!.type, {
			target: this,
			data: parsedData,
		} as shared.ChatEvent<
			shared.ChatEventType.HEARTBEAT,
			ChatWebSocket
		>);
	};
}
