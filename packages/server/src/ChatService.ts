import { IncomingMessage } from 'node:http';
import { ConnectionInfo } from '@rchat/shared';

export type ChatService<TMessageType> = {
	fetchConnectionInfo: (request: IncomingMessage) => Promise<ConnectionInfo>;
	getChatParticipants: (chatIdentifier: string) => Promise<string[]>;
	saveMessage: (message: TMessageType) => Promise<TMessageType>;
};
