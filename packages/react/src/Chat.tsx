import { PropsWithChildren } from 'react';

import { RChatContext, RChatContextType } from './internal/RChatContext';

export type ChatProps<TMessageType> = PropsWithChildren<RChatContextType<TMessageType>>;

export const Chat = <TMessageType,>({ children, ...context }: ChatProps<TMessageType>) => (
	<RChatContext.Provider value={{ ...(context as RChatContextType<unknown>) }}>{children}</RChatContext.Provider>
);
