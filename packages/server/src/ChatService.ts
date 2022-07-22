import { IncomingMessage } from 'node:http';
import { ConnectionInfo } from './ConnectionInfo';

export type ChatService = {
    fetchConnectionInfo: (request: IncomingMessage) => Promise<ConnectionInfo>;
    getChatParticipants: (chatIdentifier: string) => Promise<string[]>;
};
