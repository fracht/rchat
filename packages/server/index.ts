import { ChatServer } from "./ChatServer.ts";

const server = new ChatServer({
	getUserIdentifier: () => Promise.resolve(Math.random() > 0.5 ? "1" : "2"),
	getChatParticipants: (chatId) => Promise.resolve(chatId === "1" ? ["1"] : []),
});
server.start({ port: 7071 });
