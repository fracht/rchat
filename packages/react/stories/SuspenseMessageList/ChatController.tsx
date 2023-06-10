import { ChatClient, MessageSearchResult } from '@rchat/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { CSSProperties, FormEvent, startTransition, useRef, useState } from 'react';
import { ExampleMessage } from './useMockChatClient';
import { clamp } from '../../src/internal/clamp';

const styles: Record<string, CSSProperties> = {
	container: {
		display: 'flex',
		justifyContent: 'space-between',
		marginTop: 8,
	},
	section: {
		display: 'flex',
		flexDirection: 'column',
	},
};

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

const generateNewMessage = () => {
	return {
		message: possibilities[Math.floor(Math.random() * possibilities.length)],
		id: 0,
		date: new Date(),
		isLeft: Math.random() > 0.5,
	};
};

export const generateInitialMessages = (length: number) => {
	const beginTimestamp = Date.now() - length * 10;

	return new Array(length).fill(0).map((_, index) => ({
		message: `${index + 1} ${possibilities[Math.floor(Math.random() * possibilities.length)]}`,
		id: index + 1,
		date: new Date(beginTimestamp + 10 * index),
		isLeft: Math.random() > 0.5,
	}));
};

export type SearchResult = {
	result: MessageSearchResult<ExampleMessage>;
	next: () => void;
	previous: () => void;
};

const noop = () => {};

const emptySearchResult: SearchResult = {
	result: {
		results: [],
		totalCount: 0,
	},
	next: noop,
	previous: noop,
};

export type ChatControllerProps = {
	client: ChatClient<ExampleMessage>;
	roomIdentifier: string;
	setRoomIdentifier: (id: string) => void;
	initialSearchResult?: SearchResult;
};

export const ChatController = ({
	client,
	roomIdentifier,
	setRoomIdentifier,
	initialSearchResult,
}: ChatControllerProps) => {
	const [searchValue, setSearchValue] = useState('');
	const [searchQuery, setSearchQuery] = useState('');
	const queryClient = useQueryClient();

	const { data } = useQuery({
		queryKey: [{ scope: 'SearchMessage', searchQuery }],
		queryFn: async ({ queryKey: [{ searchQuery }] }) => {
			if (searchQuery === '') {
				return emptySearchResult;
			}

			const result = await client.searchMessages(roomIdentifier, searchQuery);
			return result;
		},
		initialData: searchQuery === '' && initialSearchResult ? initialSearchResult : undefined,
	});

	const searchResult = data!;

	const [currentSearchIndex, setCurrentSearchIndex] = useState(1);

	const isNextDisabled = currentSearchIndex >= searchResult.result.totalCount;
	const isPreviousDisabled = currentSearchIndex <= 1;

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

	const search = async (e: FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		startTransition(() => {
			setSearchQuery(searchValue);
		});
	};

	const handleNext = () => {
		setCurrentSearchIndex((prev) => clamp(prev + 1, 1, searchResult.result.results.length));
		searchResult.next();
	};

	const handlePrevious = () => {
		setCurrentSearchIndex((prev) => clamp(prev - 1, 1, searchResult.result.results.length));
		searchResult.previous();
	};

	return (
		<div style={styles.container}>
			<div style={styles.section}>
				<b>Send message</b>
				<button
					onClick={() => {
						client.sendMessage(generateNewMessage(), roomIdentifier);
					}}
				>
					send random message
				</button>
			</div>

			<div style={styles.section}>
				<b>Change room.</b>
				<span>Current room: {roomIdentifier}</span>
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
			</div>

			<div style={styles.section}>
				<b>Search message.</b>
				<form onSubmit={search}>
					<input
						type="text"
						value={searchValue}
						onChange={(e) => {
							setSearchValue(e.target.value);
						}}
					/>
				</form>
				<button disabled={isNextDisabled} onClick={handleNext}>
					next
				</button>
				<button disabled={isPreviousDisabled} onClick={handlePrevious}>
					prev
				</button>
			</div>
		</div>
	);
};
