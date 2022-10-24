import { ChatServerType, ChatSocketType } from '@rchat/shared';

import LRUCache from 'lru-cache';
import TTLCache from '@isaacs/ttlcache';

const TTL_LONG = 60 * 60 * 1000; // persist active channels for one hour in memory.
const TTL_SHORT = 2 * 60 * 1000; // persist preheated channels for 2 minutes.

export class RoomManager<TMessageType> {
	private readonly roomParticipants;
	private readonly server;
	private readonly userSockets;
	private readonly activeRooms;

	public constructor(
		server: ChatServerType<TMessageType>,
		fetchParticipants: (roomIdentifier: string) => Promise<string[]>,
	) {
		this.server = server;
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
			fetchMethod: async (roomIdentifier) => {
				try {
					const participants = await fetchParticipants(roomIdentifier);
					return new Set(participants);
				} catch (error) {
					// TODO: add logging here
					return undefined;
				}
			},
		});

		this.server.on('connect', this.handleSocketConnect);
	}

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
			const participants = await this.roomParticipants.fetch(room);
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
			await this.preheatRoom(roomIdentifier);
		}

		this.activeRooms.setTTL(roomIdentifier, TTL_LONG);
		return socket.to(socketIORoom);
	};

	public preheatRoom = async (roomIdentifier: string) => {
		const participants = await this.roomParticipants.fetch(roomIdentifier);

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
