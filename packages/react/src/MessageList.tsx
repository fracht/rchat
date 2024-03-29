import { MessageFetchResult, MessageSearchResult } from '@rchat/client';
import { useSafeContext } from '@sirse-dev/safe-context';
import { EndlessList } from './EndlessList';
import { RChatContext } from './internal/RChatContext';
import { RoomContext } from './internal/RoomContext';
import { AnimationParameters } from './internal/smoothScrollToCenter';
import { useMessages } from './useMessages';

export type MessageListProps<TMessage> = {
	initialMessagesState: MessageFetchResult<TMessage>;
	initialSearchResult?: MessageSearchResult<TMessage>;
	jumpAnimation?: AnimationParameters;
};

export const MessageList = <TMessage,>({
	jumpAnimation,
	initialMessagesState,
	initialSearchResult,
}: MessageListProps<TMessage>) => {
	const {
		client,
		MessageComponent,
		PlaceholderComponent,
		ContainerComponent,
		triggerDistance,
		compareItems,
		itemKey,
	} = useSafeContext(RChatContext);
	const { roomIdentifier } = useSafeContext(RoomContext);

	const {
		messages,
		onBottomReached,
		onTopReached,
		noMessagesAfter,
		onVisibleFrameChange,
		containerReference,
		focusedItem,
	} = useMessages({
		chatClient: client,
		additionalChunkSize: 20,
		maxChunkSize: 100,
		roomIdentifier,
		compareItems,
		initialMessagesState,
		initialSearchResult,
	});

	return (
		<EndlessList
			initialItems={initialMessagesState.messages}
			items={messages}
			onTopReached={onTopReached}
			onBottomReached={onBottomReached}
			triggerDistance={triggerDistance}
			ContainerComponent={ContainerComponent}
			ItemComponent={MessageComponent}
			PlaceholderComponent={PlaceholderComponent}
			compareItems={compareItems}
			itemKey={itemKey}
			onVisibleFrameChange={onVisibleFrameChange}
			canStickToBottom={noMessagesAfter}
			containerReference={containerReference}
			focusedItem={focusedItem}
			jumpAnimation={jumpAnimation}
		/>
	);
};
