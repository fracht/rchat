export type ChatEventMap<TMessage> = {
	chatMessage: {
		roomIdentifier: string;
		message: TMessage;
	};
	joinRoom: {
		roomIdentifier: string;
	};
	leaveRoom: {
		roomIdentifier: string;
	};
};
