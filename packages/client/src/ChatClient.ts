import { ChatClientSocket, ChatSocketListenMap } from '@rchat/shared';
import { io } from 'socket.io-client';
import { CustomEventTarget } from './CustomEventTarget';

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

export class ChatClient<TMessage> extends CustomEventTarget<ChatSocketListenMap<TMessage>> {
	private readonly socket: ChatClientSocket<TMessage>;

	public constructor(url: string, fetchMessages: MessageFetcher<TMessage>);
	public constructor(socket: ChatClientSocket<TMessage>, fetchMessages: MessageFetcher<TMessage>);
	public constructor(
		urlOrSocket: string | ChatClientSocket<TMessage>,
		public readonly fetchMessages: MessageFetcher<TMessage>,
	) {
		super();
		if (typeof urlOrSocket === 'string') {
			this.socket = io(urlOrSocket);
		} else {
			this.socket = urlOrSocket;
		}
		this.socket.on('receiveMessage', (message: TMessage, roomIdentifier: string) => {
			this.dispatchEvent(new CustomEvent('receiveMessage', { detail: [message, roomIdentifier] }));
		});
	}

	public sendMessage = (message: TMessage, roomIdentifier: string) => {
		this.socket.emit('sendMessage', message, roomIdentifier);
	};

	public close = () => {
		this.socket.close();
	};
}
