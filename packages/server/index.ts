import { ChatServer } from './ChatServer.ts';

const server = new ChatServer({
    getUserIdentifier: () => Promise.resolve('asdf'),
});
server.start({ port: 7071 });
