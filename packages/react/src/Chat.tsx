import { ChatClient } from '@rchat/client';
import { PropsWithChildren } from 'react';

import { RChatContext } from './internal/RChatContext';

export type ChatProps = PropsWithChildren<{
    client: ChatClient;
}>;

export const Chat = ({ client, children }: ChatProps) => {
    return <RChatContext.Provider value={{ client }}>{children}</RChatContext.Provider>;
};
