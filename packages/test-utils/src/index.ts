import { io } from 'socket.io-client';
import { createMemChatServer } from './createMemChatServer';

createMemChatServer();

const socket = io('ws://localhost:1234');

socket.on('connect', () => {
	console.log('connected');
});

export {};
