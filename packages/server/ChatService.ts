export type ChatService = {
	getUserIdentifier: (request: Request) => Promise<string>;
	getChatParticipants: (chatIdentifier: string) => Promise<string[]>;
};
