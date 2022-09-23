import { Socket, io } from 'socket.io-client';
import { CustomEventTarget } from './CustomEventTarget';
import { ChatEventMap } from '@rchat/shared';

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

export class ChatClient<TMessage> extends CustomEventTarget<ChatEventMap<TMessage>> {
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
