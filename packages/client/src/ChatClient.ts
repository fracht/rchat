import { ChatClientSocket, ChatSocketListenMap } from '@rchat/shared';
import { io } from 'socket.io-client';
import { ChatAPI, MessageFetcher, MessageSearchResult } from './ChatAPI';
import { CustomEventTarget } from './CustomEventTarget';

export class ChatClient<TMessage> extends CustomEventTarget<
	ChatSocketListenMap<TMessage> & {
		receiveSearchResults: (roomIdentifier: string, result: MessageSearchResult<TMessage>) => void;
		nextSearchResult: (roomIdentifier: string) => void;
		previousSearchResult: (roomIdentifier: string) => void;
	}
> {
	private readonly socket: ChatClientSocket<TMessage>;

	public constructor(url: string, api: ChatAPI<TMessage>);
	public constructor(socket: ChatClientSocket<TMessage>, api: ChatAPI<TMessage>);
	public constructor(urlOrSocket: string | ChatClientSocket<TMessage>, private readonly api: ChatAPI<TMessage>) {
		super();
		if (typeof urlOrSocket === 'string') {
			this.socket = io(urlOrSocket);
		} else {
			this.socket = urlOrSocket;
		}
		this.fetchMessages = api.fetchMessages;
		this.socket.on('receiveMessage', (message: TMessage, roomIdentifier: string) => {
			this.dispatchEvent(new CustomEvent('receiveMessage', { detail: [message, roomIdentifier] }));
		});
		this.socket.on('receiveError', (roomIdentifier) => {
			this.dispatchEvent(new CustomEvent('receiveError', { detail: [roomIdentifier] }));
		});
	}

	public fetchMessages: MessageFetcher<TMessage>;

	public searchMessages = async (roomIdentifier: string, criteria: unknown) => {
		const result = await this.api.searchMessages(roomIdentifier, criteria);

		this.dispatchEvent(new CustomEvent('receiveSearchResults', { detail: [roomIdentifier, result] }));

		return {
			result,
			next: this.nextSearchResult.bind(this, roomIdentifier),
			previous: this.previousSearchResult.bind(this, roomIdentifier),
		};
	};

	public nextSearchResult = (roomIdentifier: string) => {
		this.dispatchEvent(new CustomEvent('nextSearchResult', { detail: [roomIdentifier] }));
	};

	public previousSearchResult = (roomIdentifier: string) => {
		this.dispatchEvent(new CustomEvent('previousSearchResult', { detail: [roomIdentifier] }));
	};

	public sendMessage = (message: TMessage, roomIdentifier: string) => {
		this.socket.emit('sendMessage', message, roomIdentifier);
	};

	public close = () => {
		this.socket.close();
	};
}
