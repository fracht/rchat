export type ChatSocketListenMap<TMessage> = {
	sendMessage: (message: TMessage, roomIdentifier: string) => void;
	joinRoom: (roomIdentifier: string) => void;
};

export type ChatSocketEmitMap<TMessage> = {
	receiveMessage: (message: TMessage, roomIdentifier: string) => void;
};
