import { ChatServerType, ChatSocketType, ConnectionInfo } from '@rchat/shared';

import LRUCache from 'lru-cache';
import TTLCache from '@isaacs/ttlcache';

const TTL_LONG = 60 * 60 * 1000; // persist active channels for one hour in memory.
const TTL_SHORT = 2 * 60 * 1000; // persist preheated channels for 2 minutes.

const getUserConnectivityObserveRoom = (userId: string) => `rchat-userconn-${userId}`;

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

	public isUserConnected = (userIdentifier: string) => {
		const sockets = this.userSockets.get(userIdentifier);

		return sockets && sockets.size > 0;
	};

	public tryGetRoomParticipants = async (socket: ChatSocketType<TMessageType>, roomIdentifier: string) => {
		try {
			return await this.getRoomParticipants(socket, roomIdentifier);
		} catch (error) {
			console.error('Failed to fetch participants.', error);
		}

		return new Set<string>();
	};

	private getRoomParticipants = async (
		socket: ChatSocketType<TMessageType>,
		roomIdentifier: string,
	): Promise<Set<string>> => {
		if (!this.roomParticipants.has(roomIdentifier)) {
			const fetchedParticipants = await this.fetchParticipants(socket.data as ConnectionInfo, roomIdentifier);
			const participants: Set<string> = new Set(fetchedParticipants);
			this.roomParticipants.set(roomIdentifier, participants);

			return participants;
		}

		return this.roomParticipants.get(roomIdentifier)!;
	};

	private static readonly getSocketIORoomIdentifier = (roomIdentifier: string) => `chat-room-${roomIdentifier}`;

	private handleSocketConnect = async (socket: ChatSocketType<TMessageType>) => {
		const identifier = socket.data.userIdentifier!;
		if (!this.userSockets.has(identifier)) {
			this.userSockets.set(identifier, new Set());
			this.server.to(getUserConnectivityObserveRoom(identifier)).emit('userConnected', identifier);
		}

		const sockets = this.userSockets.get(identifier)!;
		sockets.add(socket);
		socket.on('disconnect', () => this.handleSocketDisconnect(socket));

		// Join to all active rooms
		for (const [room] of this.activeRooms) {
			const participants = await this.tryGetRoomParticipants(socket, room);
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
			this.server.to(getUserConnectivityObserveRoom(identifier)).emit('userDisconnected', identifier);
		}
	};

	public broadcast = async (socket: ChatSocketType<TMessageType>, roomIdentifier: string) => {
		const participants = await this.tryGetRoomParticipants(socket, roomIdentifier);
		const userIdentifier = socket.data.userIdentifier!;

		if (!participants.has(userIdentifier)) {
			throw new Error('Forbidden');
		}

		const socketIORoom = RoomManager.getSocketIORoomIdentifier(roomIdentifier);
		if (!this.activeRooms.get(socketIORoom)) {
			await this.preheatRoom(socket, roomIdentifier);
		}

		this.activeRooms.setTTL(roomIdentifier, TTL_LONG);
		return this.server.to(socketIORoom);
	};

	public preheatRoom = async (socket: ChatSocketType<TMessageType>, roomIdentifier: string) => {
		let participants: Set<string> | undefined;
		try {
			participants = await this.getRoomParticipants(socket, roomIdentifier);
		} catch (error) {
			console.error('Preheating room failed: cannot get room participants');
		}

		if (!participants) {
			return;
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

	public observeUser = (socket: ChatSocketType<TMessageType>, userIdentifier: string) => {
		socket.join(getUserConnectivityObserveRoom(userIdentifier));
		if (this.isUserConnected(userIdentifier)) {
			socket.emit('userConnected', userIdentifier);
		} else {
			socket.emit('userDisconnected', userIdentifier);
		}
	};

	public unobserveUser = (socket: ChatSocketType<TMessageType>, userIdentifier: string) => {
		socket.leave(getUserConnectivityObserveRoom(userIdentifier));
	};

	public invalidateRoomParticipants = async (roomIdentifier: string) => {
		this.roomParticipants.delete(roomIdentifier);
		this.activeRooms.delete(RoomManager.getSocketIORoomIdentifier(roomIdentifier));
	};
}
