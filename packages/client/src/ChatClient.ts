import { Socket, io } from 'socket.io-client';

export type MessageFetchResult<TMessage> = {
	messages: TMessage[];
	noMessagesAfter: boolean;
	noMessagesBefore: boolean;
};

export type MessageFetcher<TMessage> = (
	roomIdentifier: string,
	count: number,
	before: TMessage | undefined,
	after: TMessage | undefined,
) => Promise<MessageFetchResult<TMessage>>;

export type CustomEventMap = Record<string, unknown>;

export interface CustomEventListener<T> {
	(event: CustomEvent<T>): void;
}

export class CustomEventTarget<TEventMap extends CustomEventMap> {
	private readonly eventTarget: EventTarget;

	public constructor() {
		this.eventTarget = new EventTarget();
	}

	public dispatchEvent(event: CustomEvent<TEventMap[keyof TEventMap]>): boolean {
		return this.eventTarget.dispatchEvent(event);
	}

	public addEventListener<TEventName extends keyof TEventMap>(
		type: TEventName,
		callback: CustomEventListener<TEventMap[TEventName]> | null,
		options?: AddEventListenerOptions | boolean,
	): void {
		this.eventTarget.addEventListener(type as string, callback as EventListener, options);
	}

	public removeEventListener<TEventName extends keyof TEventMap>(
		type: TEventName,
		callback: CustomEventListener<TEventMap[TEventName]> | null,
		options?: EventListenerOptions | boolean,
	): void {
		this.eventTarget.removeEventListener(type as string, callback as EventListener, options);
	}
}

export type ChatClientEventMap<TMessage> = {
	chatMessage: { roomIdentifier: string; message: TMessage };
};

export class ChatClient<TMessage> extends CustomEventTarget<ChatClientEventMap<TMessage>> {
	private readonly socket: Socket;

	public constructor(url: string, fetchMessages: MessageFetcher<TMessage>);
	public constructor(socket: Socket, fetchMessages: MessageFetcher<TMessage>);
	public constructor(urlOrSocket: string | Socket, public readonly fetchMessages: MessageFetcher<TMessage>) {
		super();
		if (typeof urlOrSocket === 'string') {
			this.socket = io(urlOrSocket);
		} else {
			this.socket = urlOrSocket;
		}
		this.socket.on('chatMessage', (message: { message: TMessage; roomIdentifier: string }) => {
			this.dispatchEvent(new CustomEvent('chatMessage', { detail: message }));
		});
	}

	public sendMessage = (roomIdentifier: string, message: TMessage) => {
		this.socket.emit('chatMessage', {
			roomIdentifier,
			message,
		});
	};

	public close = () => {
		this.socket.close();
	};
}
