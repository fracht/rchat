import { ChatWebSocket } from "./ChatWebSocket.ts";

export type ConnectionInfo = {
	userIdentifier: string;
	additional?: unknown;
};

export type ChatService = {
	fetchConnectionInfo: (request: Request) => Promise<ConnectionInfo>;
	fetchChatParticipants: (chatIdentifier: string, socket: ChatWebSocket) => Promise<string[]>;
};
