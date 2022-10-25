export type ChatSocketEmitMap<TMessage> = {
	sendMessage: (message: TMessage, roomIdentifier: string) => void;
	joinRoom: (roomIdentifier: string) => void;
};

export type ChatSocketListenMap<TMessage> = {
	receiveMessage: (message: TMessage, roomIdentifier: string) => void;
};
