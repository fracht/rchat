import { binaryParser, events, shared } from "./deps.ts";

type ChatEvents = {
	[K in shared.MessageEventType]: [event: shared.ChatEvent<K, ChatWebSocket>];
};

const messageParser = new binaryParser.Parser().uint8("type").choice(
	"payload",
	{
		tag: "type",
		choices: {
			[shared.MessageEventType.HEARTBEAT]: new binaryParser.Parser(),
		},
	},
);

export class ChatWebSocket extends events.EventEmitter<ChatEvents> {
	public constructor(
		private readonly socket: WebSocket,
		public readonly identifier: string,
		public readonly userIdentifier: string,
	) {
		super();
		socket.binaryType = "arraybuffer";
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

	public send(data: ArrayBufferLike): void {
		this.socket.send(data);
	}

	private handleOpenEvent = () => {
		this.emit(shared.MessageEventType.OPEN, {
			target: this,
			data: {
				type: shared.MessageEventType.OPEN,
				payload: undefined,
			},
		});
	};

	private handleCloseEvent = (event: CloseEvent) => {
		this.emit(shared.MessageEventType.CLOSE, {
			target: this,
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

	private handleErrorEvent = () => {
		this.emit(shared.MessageEventType.ERROR, {
			target: this,
			data: {
				type: shared.MessageEventType.ERROR,
				payload: undefined,
			},
		});
	};

	private handleMessageEvent = (event: MessageEvent<ArrayBuffer>) => {
		const parsedData: shared.ChatEvent["data"] = messageParser.parse(
			new Uint8Array(event.data),
		);

		switch (parsedData.type) {
			case shared.MessageEventType.HEARTBEAT:
				this.emit(shared.MessageEventType.HEARTBEAT, {
					target: this,
					data: parsedData,
				} as shared.ChatEvent<
					shared.MessageEventType.HEARTBEAT,
					ChatWebSocket
				>);
				break;
		}
	};
}
