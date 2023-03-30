export type ChatSocketEmitMap<TMessage> = {
	sendMessage: (message: TMessage, roomIdentifier: string) => void;
	joinRoom: (roomIdentifier: string) => void;
	observeUser: (userIdentifier: string) => void;
	unobserveUser: (userIdentifier: string) => void;
};

export type ChatSocketListenMap<TMessage> = {
	receiveMessage: (message: TMessage, roomIdentifier: string) => void;
	receiveError: (roomIdentifier?: string) => void;
	userConnected: (userIdentifier: string) => void;
	userDisconnected: (userIdentifier: string) => void;
};
