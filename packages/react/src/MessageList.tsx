import { SafeContext, useSafeContext } from '@sirse-dev/safe-context';
import { EndlessList } from './EndlessList';
import { RChatContext, RChatContextType } from './internal/RChatContext';
import { RoomContext } from './internal/RoomContext';
import { useMessages } from './useMessages';

export const MessageList = <T,>() => {
	const {
		client,
		MessageComponent,
		PlaceholderComponent,
		ContainerComponent,
		triggerDistance,
		compareItems,
		itemKey,
	} = useSafeContext(RChatContext as SafeContext<RChatContextType<T>>);
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
		initialChunkSize: 20,
		additionalChunkSize: 20,
		maxChunkSize: 100,
		roomIdentifier,
		compareItems,
	});

	return (
		<EndlessList
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
		/>
	);
};
