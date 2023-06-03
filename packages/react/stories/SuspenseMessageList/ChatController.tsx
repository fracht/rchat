import { ChatClient } from '@rchat/client';
import { useQueryClient } from '@tanstack/react-query';
import { startTransition } from 'react';
import { ExampleMessage } from './useMockChatClient';

export const generateMessageArray = (length: number) => {
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

export type ChatControllerProps = {
	client: ChatClient<ExampleMessage>;
	roomIdentifier: string;
	setRoomIdentifier: (id: string) => void;
};

export const ChatController = ({ client, roomIdentifier, setRoomIdentifier }: ChatControllerProps) => {
	const queryClient = useQueryClient();

	const invalidateMessages = (roomIdentifier: string) => {
		queryClient.invalidateQueries({
			queryKey: [{ scope: 'initial', roomIdentifier }],
			refetchType: 'inactive',
		});
		queryClient.removeQueries({
			queryKey: [{ roomIdentifier, anchors: { before: undefined, after: undefined } }],
			exact: true,
		});
	};

	return (
		<>
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
		</>
	);
};
