import { MessageEventType } from './MessageEventType.ts';

export type ChatEvent<TEventType extends MessageEventType = MessageEventType> = {
    target: WebSocket;
    data: {
        type: TEventType;
        payload: ChatEventData[TEventType];
    };
};

type ChatEventData = {
    [MessageEventType.OPEN]: undefined;
    [MessageEventType.CLOSE]: {
        code: number;
        reason: string;
        wasClean: boolean;
    };
    [MessageEventType.ERROR]: undefined;
};
