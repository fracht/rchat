import { ChatServerType, ChatSocketType, ConnectionInfo } from '@rchat/shared';

import LRUCache from 'lru-cache';
import TTLCache from '@isaacs/ttlcache';

const TTL_LONG = 60 * 60 * 1000; // persist active channels for one hour in memory.
const TTL_SHORT = 2 * 60 * 1000; // persist preheated channels for 2 minutes.

export class RoomManager<TMessageType> {
	private readonly roomParticipants;
	private readonly server;
	private readonly userSockets;
	private readonly activeRooms;
	private readonly fetchParticipants;

	public constructor(
		server: ChatServerType<TMessageType>,
		fetchParticipants: (connectionInfo: ConnectionInfo, roomIdentifier: string) => Promise<string[]>,
	) {
		this.server = server;
		this.fetchParticipants = fetchParticipants;
		this.userSockets = new Map<string, Set<ChatSocketType<TMessageType>>>();
		this.activeRooms = new TTLCache<string, true>({
			noDisposeOnSet: true,
			dispose: (_, key) => {
				const socketIORoom = RoomManager.getSocketIORoomIdentifier(key);
				this.server.in(socketIORoom).socketsLeave(socketIORoom);
			},
		});
		this.roomParticipants = new LRUCache<string, Set<string>>({
			max: 1000,
			allowStale: false,
		});

		this.server.on('connect', this.handleSocketConnect);
	}

	private getRoomParticipants = async (socket: ChatSocketType<TMessageType>, roomIdentifier: string) => {
		if (!this.roomParticipants.has(roomIdentifier)) {
			let fetchedParticipants: Set<string>;
			try {
				const participants = await this.fetchParticipants(socket.data as ConnectionInfo, roomIdentifier);
				fetchedParticipants = new Set(participants);
			} catch (error) {
				fetchedParticipants = new Set();
				console.error('Failed to fetch participants.', error);
			}
			this.roomParticipants.set(roomIdentifier, fetchedParticipants);
		}

		return this.roomParticipants.get(roomIdentifier);
	};

	private static readonly getSocketIORoomIdentifier = (roomIdentifier: string) => `chat-room-${roomIdentifier}`;

	private handleSocketConnect = async (socket: ChatSocketType<TMessageType>) => {
		const identifier = socket.data.userIdentifier!;
		if (!this.userSockets.has(identifier)) {
			this.userSockets.set(identifier, new Set());
		}

		const sockets = this.userSockets.get(identifier)!;
		sockets.add(socket);
		socket.on('disconnect', () => this.handleSocketDisconnect(socket));

		// Join to all active rooms
		for (const [room] of this.activeRooms) {
			const participants = await this.getRoomParticipants(socket, room);
			if (participants?.has(identifier)) {
				await socket.join(room);
			}
		}
	};

	private handleSocketDisconnect = (socket: ChatSocketType<TMessageType>) => {
		const identifier = socket.data.userIdentifier!;
		const sockets = this.userSockets.get(identifier)!;
		sockets.delete(socket);
		if (sockets.size === 0) {
			this.userSockets.delete(identifier);
		}
	};

	public broadcast = async (socket: ChatSocketType<TMessageType>, roomIdentifier: string) => {
		const socketIORoom = RoomManager.getSocketIORoomIdentifier(roomIdentifier);
		if (!this.activeRooms.get(socketIORoom)) {
			await this.preheatRoom(socket, roomIdentifier);
		}

		this.activeRooms.setTTL(roomIdentifier, TTL_LONG);
		return socket.to(socketIORoom);
	};

	public preheatRoom = async (socket: ChatSocketType<TMessageType>, roomIdentifier: string) => {
		const participants = await this.getRoomParticipants(socket, roomIdentifier);

		if (!participants) {
			throw new Error('No such room!'); // TODO: better exceptions
		}

		const socketIORoom = RoomManager.getSocketIORoomIdentifier(roomIdentifier);

		for (const participant of participants) {
			if (this.userSockets.has(participant)) {
				for (const socket of this.userSockets.get(participant)!) {
					socket.join(socketIORoom);
				}
			}
		}

		this.activeRooms.set(roomIdentifier, true, { ttl: TTL_SHORT });
	};
}
