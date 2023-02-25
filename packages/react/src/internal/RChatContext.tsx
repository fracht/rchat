import { ChatClient } from '@rchat/client';
import { createSafeContext } from '@sirse-dev/safe-context';
import type { ContainerComponentProps, ItemComponentType, ItemKey } from '../EndlessList';
import type { ComponentType } from 'react';

export type RChatContextType<TMessageType> = {
	client: ChatClient<TMessageType>;
	MessageComponent: ItemComponentType<TMessageType>;
	PlaceholderComponent: ComponentType<{ itemKey: string }>;
	ContainerComponent: ComponentType<ContainerComponentProps>;
	triggerDistance: number;
	itemKey: ItemKey<TMessageType>;
	compareItems: (first: TMessageType, second: TMessageType) => number;
};

export const RChatContext = createSafeContext<RChatContextType<unknown>>();
