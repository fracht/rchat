import { ComponentStory, ComponentMeta } from '@storybook/react';
import { ComponentType } from 'react';

import { SuspenseMessageListProps } from '../../src/SuspenseMessageList';
import { ExampleMessage } from './useMockChatClient';
import { ChatStory } from './ChatStory';
import { generateInitialMessages } from './ChatController';

export default {
	title: 'SuspenseMessageList',
} as ComponentMeta<ComponentType<SuspenseMessageListProps<ExampleMessage>>>;

export const Default: ComponentStory<typeof ChatStory> = () => (
	<ChatStory initialMessages={generateInitialMessages(200)} />
);

export const Empty: ComponentStory<typeof ChatStory> = () => <ChatStory initialMessages={[]} />;
