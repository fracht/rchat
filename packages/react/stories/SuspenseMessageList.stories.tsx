import { ChatClient } from '@rchat/client';
import { ComponentStory, ComponentMeta } from '@storybook/react';
import {
	ComponentType,
	CSSProperties,
	forwardRef,
	useEffect,
	useState,
	Suspense,
	RefObject,
	useMemo,
	useRef,
} from 'react';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Chat } from '../src/Chat';

import { ContainerComponentProps, EndlessListProps, ItemComponentProps, ItemKey } from '../src/EndlessList';
import { SuspenseMessageList } from '../src/SuspenseMessageList';
import { Room } from '../src/Room';
import { makeChatClientFromJson } from './makeChatClientFromJson';
import { QueryClient, QueryClientProvider, useQuery, useQueryClient } from '@tanstack/react-query';

type ExampleMessage = {
	message: string;
	isLeft: boolean;
	id: number;
	date: Date;
};

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

let current = 0;
const uuid = () => ++current;

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
		id: uuid(),
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

const roomIdentifier = '123';
const TestComponent = ({ client }: { client: ChatClient<ExampleMessage> }) => {
	const { data } = useQuery([{ scope: 'initial' }], async () => {
		return client.fetchMessages(roomIdentifier, 20, undefined, undefined);
	});

	const initialMessages = useMemo(() => data!, [data]);

	return (
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
			<Room identifier={roomIdentifier}>
				<Suspense>
					<SuspenseMessageList initialMessagesState={initialMessages} />
				</Suspense>
			</Room>
		</Chat>
	);
};

const App = (props: EndlessListProps<ExampleMessage>) => {
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
	const [client, setClient] = useState<ChatClient<ExampleMessage>>();

	useEffect(() => {
		const [testClient, cleanup] = makeChatClientFromJson(
			roomIdentifier,
			generateMessageArray(200),
			(a, b) => a.date.getTime() - b.date.getTime(),
			() => generateMessageArray(1)[0],
		);

		setClient(testClient);

		return cleanup;
	}, []);

	if (client === undefined) {
		return <div>Loading...</div>;
	}

	return (
		<QueryClientProvider client={queryClient}>
			<Suspense fallback={<div>Loading initial messages...</div>}>
				<TestComponent client={client} />
			</Suspense>
			<ReactQueryDevtools />
		</QueryClientProvider>
	);
};

const Template: ComponentStory<ComponentType<EndlessListProps<ExampleMessage>>> = (args) => <App {...args} />;

export const Default = Template.bind({});
