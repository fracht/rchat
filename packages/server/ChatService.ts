export type ChatService = {
	getUserIdentifier: (request: Request) => Promise<string>;
};
