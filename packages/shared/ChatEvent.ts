import { ChatEventType } from "./ChatEventType.ts";

export type ChatEvent<TEventType extends ChatEventType = ChatEventType, TTarget = WebSocket> = {
	target: TTarget;
	data: ChatEventData<TEventType>;
};

export type ChatEventData<TEventType extends ChatEventType = ChatEventType> = {
	type: TEventType;
	payload: ChatEventDataPayload[TEventType];
};

type ChatEventDataPayload = {
	[ChatEventType.OPEN]: undefined;
	[ChatEventType.CLOSE]: {
		code: number;
		reason: string;
		wasClean: boolean;
	};
	[ChatEventType.SOCKET_ERROR]: undefined;
	[ChatEventType.HEARTBEAT]: undefined;
	[ChatEventType.ERROR]: {
		code: number;
		reason: string;
	};
	[ChatEventType.MESSAGE]: {
		channel: string;
		message: unknown;
		sender: string;
	};
};
