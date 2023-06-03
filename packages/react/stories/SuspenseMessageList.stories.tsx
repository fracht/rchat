import { ChatClient } from '@rchat/client';
import { ComponentStory, ComponentMeta } from '@storybook/react';
import {
	ComponentType,
	CSSProperties,
	forwardRef,
	useState,
	Suspense,
	RefObject,
	useMemo,
	startTransition,
} from 'react';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Chat } from '../src/Chat';

import { ContainerComponentProps, EndlessListProps, ItemComponentProps } from '../src/EndlessList';
import { SuspenseMessageList } from '../src/SuspenseMessageList';
import { Room } from '../src/Room';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import { ExampleMessage, useMockChatClient } from './useMockChatClient';

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
	({ value, index, array, itemKey }: ItemComponentProps<ExampleMessage>, ref: React.Ref<HTMLElement>) => (
		<div style={value.isLeft ? styles.leftContainer : styles.rightContainer}>
			<div
				ref={ref as React.Ref<HTMLDivElement>}
				data-key={itemKey}
				style={{
					...(value.isLeft ? styles.leftItem : styles.rightItem),
					...getBorders(value, index, array),
				}}
			>
				{value.id} {value.message}
			</div>
		</div>
	),
);

export default {
	title: 'SuspenseMessageList',
} as ComponentMeta<ComponentType<EndlessListProps<ExampleMessage>>>;

const generateMessageArray = (length: number) => {
	const possibilities = [
		'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
		'Praesent varius auctor dolor sit amet pellentesque.',
		'Nunc ante metus, cursus sed laoreet sit amet, ornare sed risus.',
		'Phasellus egestas nibh vestibulum laoreet scelerisque. Suspendisse ut quam non lectus lobortis mollis a id lacus. ' +
			'Quisque eu dictum lacus. In convallis nibh et orci fermentum pharetra. ' +
			'Pellentesque ultricies velit et orci iaculis, quis euismod purus hendrerit.',
		'Phasellus iaculis eleifend dolor, a finibus neque aliquam vitae.',
		'Pellentesque habitant.',
	];

	const beginTimestamp = Date.now() - length * 10;

	return new Array(length).fill(0).map((_, index) => ({
		message: possibilities[Math.floor(Math.random() * possibilities.length)],
		id: index + 1,
		date: new Date(beginTimestamp + 10 * index),
		isLeft: Math.random() > 0.5,
	}));
};

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

type ChatMessagesProps = {
	client: ChatClient<ExampleMessage>;
	roomIdentifier: string;
};

const ChatMessages = ({ client, roomIdentifier }: ChatMessagesProps) => {
	const { data } = useQuery([{ scope: 'initial', roomIdentifier }], async () => {
		return client.fetchMessages(roomIdentifier, 20, undefined, undefined);
	});

	const initialMessages = useMemo(() => data!, [data]);

	return (
		<Room identifier={roomIdentifier}>
			<Suspense fallback={null}>
				<SuspenseMessageList initialMessagesState={initialMessages} />
			</Suspense>
		</Room>
	);
};

type ChatStoryProps = {
	initialMessages: ExampleMessage[];
};

const ChatStory = ({ initialMessages }: ChatStoryProps) => {
	const [queryClient] = useState(
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

	const invalidateMessages = (roomIdentifier: string) => {
		queryClient.invalidateQueries([{ scope: 'initial', roomIdentifier }], {
			refetchType: 'inactive',
		});
		queryClient.invalidateQueries(
			[
				{
					anchors: {
						before: undefined,
						after: undefined,
					},
					roomIdentifier,
				},
			],
			{
				refetchType: 'inactive',
			},
		);
	};

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
					<button
						onClick={() => {
							client.sendMessage(generateMessageArray(1)[0], roomIdentifier);
						}}
					>
						send random message
					</button>
					<br />

					<b>Current room: {roomIdentifier}</b>
					<br />
					<button
						onClick={() => {
							const newRoomIdentifier = String(Number.parseInt(roomIdentifier) + 1);
							invalidateMessages(newRoomIdentifier);
							startTransition(() => {
								setRoomIdentifier(newRoomIdentifier);
							});
						}}
					>
						go to next room
					</button>
					<button
						disabled={roomIdentifier === '1'}
						onClick={() => {
							const newRoomIdentifier = String(Math.max(1, Number.parseInt(roomIdentifier) - 1));
							invalidateMessages(newRoomIdentifier);
							startTransition(() => {
								setRoomIdentifier(newRoomIdentifier);
							});
						}}
					>
						go to prev room
					</button>
				</Chat>
			</Suspense>
			<ReactQueryDevtools />
		</QueryClientProvider>
	);
};

export const Default: ComponentStory<typeof ChatStory> = () => (
	<ChatStory initialMessages={generateMessageArray(200)} />
);

export const Empty: ComponentStory<typeof ChatStory> = () => <ChatStory initialMessages={[]} />;
