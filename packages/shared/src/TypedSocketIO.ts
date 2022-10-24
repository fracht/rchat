import type { ChatSocketEmitMap, ChatSocketListenMap } from './ChatEventMap';
import type { ConnectionInfo } from './ConnectionInfo';
import type { Socket, Server } from 'socket.io';

export type ChatSocketType<TMessageType> = Socket<
	ChatSocketListenMap<TMessageType>,
	ChatSocketEmitMap<TMessageType>,
	{},
	ConnectionInfo
>;

export type ChatServerType<TMessageType> = Server<
	ChatSocketListenMap<TMessageType>,
	ChatSocketEmitMap<TMessageType>,
	{},
	ConnectionInfo
>;
