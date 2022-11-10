import { IncomingMessage } from 'node:http';
import { ConnectionInfo } from '@rchat/shared';

export type ChatService<TMessageType> = {
	fetchConnectionInfo: (request: IncomingMessage) => Promise<ConnectionInfo>;
	getChatParticipants: (connectionInfo: ConnectionInfo, chatIdentifier: string) => Promise<string[]>;
	saveMessage: (
		connectionInfo: ConnectionInfo,
		message: TMessageType,
		roomIdentifier: string,
	) => Promise<TMessageType>;
};
