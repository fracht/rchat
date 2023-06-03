import { ChatClient } from '@rchat/client';
import { useQuery } from '@tanstack/react-query';
import { Suspense } from 'react';
import { Room } from '../../src';
import { SuspenseMessageList } from '../../src/SuspenseMessageList';
import { ExampleMessage } from './useMockChatClient';

export type ChatMessagesProps = {
	client: ChatClient<ExampleMessage>;
	roomIdentifier: string;
};

export const ChatMessages = ({ client, roomIdentifier }: ChatMessagesProps) => {
	const { data } = useQuery([{ scope: 'initial', roomIdentifier }], async () => {
		const messages = await client.fetchMessages(roomIdentifier, 20, undefined, undefined);
		return messages;
	});

	return (
		<Room identifier={roomIdentifier}>
			<Suspense fallback={null}>
				<SuspenseMessageList initialMessagesState={data!} />
			</Suspense>
		</Room>
	);
};
