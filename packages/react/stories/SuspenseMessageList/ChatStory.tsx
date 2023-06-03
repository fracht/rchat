import { CSSProperties, ComponentType, RefObject, Suspense, forwardRef, useState } from 'react';
import { ExampleMessage, useMockChatClient } from './useMockChatClient';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Chat } from '../../src/Chat';

import { ContainerComponentProps, ItemComponentProps } from '../../src/EndlessList';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { ChatMessages } from './ChatMessages';
import { ChatController } from './ChatController';

const styles: Record<string, CSSProperties> = {
	rightItem: {
		borderRadius: '10px 10px 0 10px',
		background: 'linear-gradient(30deg, rgba(54,173,198,1) 0%, rgba(4,52,159,1) 100%)',
		color: '#fff',
		padding: 10,
		marginRight: 5,
		marginLeft: 30,
	},
	rightContainer: {
		display: 'flex',
		justifyContent: 'flex-end',
	},
	leftItem: {
		borderRadius: '10px 10px 10px 0',
		background: '#dfdfdf',
		color: '#000',
		padding: 10,
		marginLeft: 5,
		marginRight: 30,
	},
	leftContainer: {
		display: 'flex',
		justifyContent: 'flex-start',
	},
};

const getBorders = (item: ExampleMessage, index: number, items: ExampleMessage[]) => {
	const isBefore = index !== 0 && items[index - 1].isLeft === item.isLeft;
	const isAfter = index !== items.length - 1 && items[index + 1].isLeft === item.isLeft;

	let borderRadius;

	if (item.isLeft) {
		borderRadius = `${isBefore ? 4 : 10}px 10px 10px ${isAfter ? 4 : 10}px`;
	} else {
		borderRadius = `10px ${isBefore ? 4 : 10}px ${isAfter ? 4 : 10}px 10px`;
	}

	return {
		borderRadius,
		marginTop: isBefore ? 2 : 5,
		marginBottom: isAfter ? 2 : 5,
	};
};

const ChatItemComponent = forwardRef(
	({ value, index, array, itemKey, focused }: ItemComponentProps<ExampleMessage>, ref: React.Ref<HTMLElement>) => (
		<div style={value.isLeft ? styles.leftContainer : styles.rightContainer}>
			<div
				ref={ref as React.Ref<HTMLDivElement>}
				data-key={itemKey}
				style={{
					...(value.isLeft ? styles.leftItem : styles.rightItem),
					...getBorders(value, index, array),
				}}
			>
				{value.message}
			</div>
		</div>
	),
);

const Container = forwardRef(({ children }: ContainerComponentProps, ref) => (
	<div
		style={{
			overflow: 'auto',
			height: 300,
		}}
		ref={ref as RefObject<HTMLDivElement>}
	>
		{children}
	</div>
));

const PlaceholderComponent = () => <div style={{ height: 400 }}>Placeholder!</div>;

export type ChatStoryProps = {
	initialMessages: ExampleMessage[];
};

export const ChatStory = ({ initialMessages }: ChatStoryProps) => {
	const [queryClient] = useState(
		() =>
			new QueryClient({
				defaultOptions: {
					queries: {
						suspense: true,
						staleTime: Infinity,
						refetchInterval: false,
						refetchIntervalInBackground: false,
						refetchOnMount: false,
						refetchOnReconnect: false,
						refetchOnWindowFocus: false,
						useErrorBoundary: true,
						retry: false,
						retryOnMount: false,
					},
				},
			}),
	);
	const [roomIdentifier, setRoomIdentifier] = useState('1');

	const client = useMockChatClient({
		roomIdentifier,
		initialMessages,
		compare: (a, b) => a.date.getTime() - b.date.getTime(),
	});

	return (
		<QueryClientProvider client={queryClient}>
			<Suspense fallback={<div>Loading initial messages...</div>}>
				<Chat<ExampleMessage>
					client={client}
					MessageComponent={ChatItemComponent}
					itemKey={(item) => String(item.id)}
					PlaceholderComponent={PlaceholderComponent}
					compareItems={(a, b) => {
						return a.date.getTime() - b.date.getTime();
					}}
					triggerDistance={3}
					ContainerComponent={Container as ComponentType<ContainerComponentProps>}
				>
					<ChatMessages key={roomIdentifier} client={client} roomIdentifier={roomIdentifier} />
					<ChatController
						client={client}
						roomIdentifier={roomIdentifier}
						setRoomIdentifier={setRoomIdentifier}
					/>
				</Chat>
			</Suspense>
			<ReactQueryDevtools />
		</QueryClientProvider>
	);
};
