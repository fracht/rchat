import { ChatClientSocket, ChatSocketListenMap } from '@rchat/shared';
import { io } from 'socket.io-client';
import { ChatAPI, MessageFetcher, MessageSearchResult } from './ChatAPI';
import { CustomEventMap, CustomEventTarget } from './CustomEventTarget';

type Self<T> = T;

export type ChatClientEventMap<TMessage> = Self<
	ChatSocketListenMap<TMessage> & {
		receiveSearchResults: (
			roomIdentifier: string,
			result: MessageSearchResult<TMessage>,
			focusIndex: number,
		) => void;
		nextSearchResult: (roomIdentifier: string) => void;
		previousSearchResult: (roomIdentifier: string) => void;
	}
>;

export class ChatClient<TMessage> extends CustomEventTarget<ChatClientEventMap<TMessage>> {
	private readonly socket: ChatClientSocket<TMessage>;

	public constructor(url: string, api: ChatAPI<TMessage>);
	public constructor(socket: ChatClientSocket<TMessage>, api: ChatAPI<TMessage>);
	public constructor(
		urlOrSocket: string | ChatClientSocket<TMessage>,
		private readonly api: ChatAPI<TMessage>,
	) {
		super();
		if (typeof urlOrSocket === 'string') {
			this.socket = io(urlOrSocket);
		} else {
			this.socket = urlOrSocket;
		}
		this.fetchMessages = api.fetchMessages;
		this.socket.on('receiveMessage', (message: TMessage, roomIdentifier: string) => {
			this.dispatchEvent('receiveMessage', message, roomIdentifier);
		});
		this.socket.on('receiveError', (roomIdentifier) => {
			this.dispatchEvent('receiveError', roomIdentifier);
		});
	}

	public fetchMessages: MessageFetcher<TMessage>;

	public searchMessages = async (roomIdentifier: string, criteria: unknown, focusIndex: number) => {
		const result = await this.api.searchMessages(roomIdentifier, criteria);

		this.dispatchEvent('receiveSearchResults', roomIdentifier, result, focusIndex);

		return {
			result,
			next: this.nextSearchResult.bind(this, roomIdentifier),
			previous: this.previousSearchResult.bind(this, roomIdentifier),
		};
	};

	public nextSearchResult = (roomIdentifier: string) => {
		this.dispatchEvent('nextSearchResult', roomIdentifier);
	};

	public previousSearchResult = (roomIdentifier: string) => {
		this.dispatchEvent('previousSearchResult', roomIdentifier);
	};

	public sendMessage = (message: TMessage, roomIdentifier: string) => {
		this.socket.emit('sendMessage', message, roomIdentifier);
	};

	public close = () => {
		this.socket.close();
	};
}
