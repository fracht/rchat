import { ChatClient } from '@rchat/client';
import { createSafeContext } from '@sirse-dev/safe-context';

export type RChatContextType = {
    client: ChatClient;
};

export const RChatContext = createSafeContext<RChatContextType>();
