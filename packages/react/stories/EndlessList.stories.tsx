import { ComponentStory, ComponentMeta } from '@storybook/react';
import { ComponentType, CSSProperties, forwardRef, Fragment, useState } from 'react';

import { ContainerComponentProps, EndlessList, EndlessListProps, ItemComponentProps } from '../src/EndlessList';

type ExampleMessage = {
	message: string;
	isLeft: boolean;
	id: number;
};

const UnStyledItemComponent = forwardRef(
	({ item }: ItemComponentProps<ExampleMessage>, ref: React.Ref<HTMLElement>) => (
		<div ref={ref as React.Ref<HTMLDivElement>}>
			{item.message} {item.id}
		</div>
	),
);

const HighContrastItemComponent = forwardRef(
	({ item }: ItemComponentProps<ExampleMessage>, ref: React.Ref<HTMLElement>) => (
		<div ref={ref as React.Ref<HTMLDivElement>} style={{ padding: 5, backgroundColor: 'red', marginBottom: 5 }}>
			{item.message} {item.id}
		</div>
	),
);

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
				{item.message}
			</div>
		</div>
	),
);

export default {
	title: 'EndlessList',
	argTypes: {
		ItemComponent: {
			options: ['unstyled', 'highContrast', 'chat'],
			mapping: {
				unstyled: UnStyledItemComponent,
				highContrast: HighContrastItemComponent,
				chat: ChatItemComponent,
			},
			defaultValue: 'chat',
			control: {
				type: 'select',
				labels: {
					unstyled: 'UnStyled',
					highContrast: 'High contrast',
					chat: 'Chat',
				},
			},
		},
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

const TestComponent = (props: EndlessListProps<ExampleMessage>) => {
	const [messages, setMessages] = useState(() => generateMessageArray(50));
	const [focusedItem, setFocusedItem] = useState<ExampleMessage | undefined>();

	return (
		<Fragment>
			<EndlessList
				{...props}
				focusedItem={focusedItem}
				items={messages}
				onTopReached={() => {
					setMessages((old) => {
						const newMsgs = generateMessageArray(20);

						return [...newMsgs, ...old].slice(0, 100);
					});

					props.onTopReached?.();
				}}
				onBottomReached={() => {
					setMessages((old) => {
						const newMsgs = generateMessageArray(20);

						return [...old, ...newMsgs].slice(-100);
					});

					props.onBottomReached?.();
				}}
			/>
			<button
				onClick={() => {
					setFocusedItem(undefined);
					setMessages(generateMessageArray(100));
				}}
			>
				Jump!
			</button>
			<button
				onClick={() => {
					setFocusedItem(messages[Math.floor(Math.random() * messages.length)]);
				}}
			>
				Focus random item
			</button>
			<button
				onClick={() => {
					setFocusedItem(messages[messages.length - 1]);
				}}
			>
				Focus last item
			</button>
		</Fragment>
	);
};

const Template: ComponentStory<ComponentType<EndlessListProps<ExampleMessage>>> = (args) => <TestComponent {...args} />;

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

export const Default = Template.bind({});
Default.args = {
	itemKey: 'id',
	triggerDistance: 100,
	compareItems: () => (Math.random() > 0.5 ? 1 : -1),
	PlaceholderComponent: () => <div style={{ height: 400 }}>Placeholder!</div>,
	ContainerComponent: Container,
} as Partial<EndlessListProps<ExampleMessage>>;
