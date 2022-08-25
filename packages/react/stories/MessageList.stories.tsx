import { ChatClient } from '@rchat/client';
import { ComponentStory, ComponentMeta } from '@storybook/react';
import { ComponentType, CSSProperties, forwardRef, useEffect, useState } from 'react';
import { Chat } from '../src/Chat';

import { ContainerComponentProps, EndlessList, EndlessListProps, ItemComponentProps } from '../src/EndlessList';
import { MessageList } from '../src/MessageList';
import { Room } from '../src/Room';
import { makeChatClientFromJson } from './makeChatClientFromJson';

type ExampleMessage = {
	message: string;
	isLeft: boolean;
	id: number;
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
	({ item, index, items }: ItemComponentProps<ExampleMessage>, ref: React.Ref<HTMLElement>) => (
		<div style={item.isLeft ? styles.leftContainer : styles.rightContainer}>
			<div
				ref={ref as React.Ref<HTMLDivElement>}
				style={{
					...(item.isLeft ? styles.leftItem : styles.rightItem),
					...getBorders(item, index, items),
				}}
			>
				{item.id} {item.message}
			</div>
		</div>
	),
);

export default {
	title: 'MessageList',
	argTypes: {
		onBottomReached: {
			action: 'onBottomReached',
		},
		onTopReached: {
			action: 'onTopReached',
		},
	},
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

	return new Array(length).fill(0).map(() => ({
		message: possibilities[Math.floor(Math.random() * possibilities.length)],
		id: uuid(),
		isLeft: Math.random() > 0.5,
	}));
};

const Container = forwardRef(
	({ innerContainerRef, onScroll, children }: ContainerComponentProps, ref: React.Ref<HTMLDivElement>) => (
		<div
			style={{
				overflow: 'auto',
				height: 300,
			}}
			onScroll={onScroll}
			ref={ref}
		>
			<div ref={innerContainerRef as React.Ref<HTMLDivElement>}>{children}</div>
		</div>
	),
);

const PlaceholderComponent = () => <div style={{ height: 400 }}>Placeholder!</div>;

const TestComponent = (props: EndlessListProps<ExampleMessage>) => {
	const [client, setClient] = useState<ChatClient<ExampleMessage>>();

	useEffect(() => {
		const [testClient, cleanup] = makeChatClientFromJson(
			'123',
			generateMessageArray(200),
			(a, b) => {
				return a.id > b.id;
			},
			() => generateMessageArray(1)[0],
		);

		setClient(testClient);

		return cleanup;
	}, []);

	if (client === undefined) {
		return <div>Loading...</div>;
	}

	return (
		<Chat<ExampleMessage>
			client={client}
			MessageComponent={ChatItemComponent}
			itemKey="id"
			PlaceholderComponent={PlaceholderComponent}
			compareItems={(a, b) => {
				return a?.id - b?.id;
			}}
			triggerDistance={100}
			ContainerComponent={Container as ComponentType<ContainerComponentProps>}
		>
			<Room identifier="123">
				<MessageList />
			</Room>
		</Chat>
	);
};

const Template: ComponentStory<ComponentType<EndlessListProps<ExampleMessage>>> = (args) => <TestComponent {...args} />;

export const Default = Template.bind({});
// Default.args = {
//     itemKey: 'id',
//     triggerDistance: 100,
//     compareItems: () => (Math.random() > 0.5 ? 1 : -1),
//     PlaceholderComponent: () => <div style={{ height: 400 }}>Placeholder!</div>,
// } as Partial<EndlessListProps<ExampleMessage>>;
