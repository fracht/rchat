import { MessageList, MessageListProps, Room as RoomProvider } from '@rchat/react';
import { ElementType } from 'react';
import { RoomBody } from './RoomBody';
import { RoomHeader } from './RoomHeader';
import { createMuiComponent, MuiComponentProps } from '../helpers/createMuiComponent';
import { MessageInput } from '../MessageInput';
import { styled } from '../styles/styled';

const RoomRoot = styled('div', {
	name: 'Room',
	slot: 'Root',
})({
	display: 'flex',
	flexDirection: 'column',
	height: '100%',
});

type InternalRoomProps<TMessage> = {
	name: string;
	identifier: string;
	thumb?: string | boolean;
	onMessageSent: (message: string) => void;
	onClose?: () => void;
} & MessageListProps<TMessage>;

export const Room = createMuiComponent(
	<TMessage,>({
		name,
		identifier,
		thumb = true,
		onClose,
		onMessageSent,
		component,
		initialMessagesState,
		initialSearchResult,
		jumpAnimation,
		...other
	}: InternalRoomProps<TMessage> & { component: ElementType }) => (
		<RoomRoot as={component} {...other}>
			<RoomHeader onClose={onClose} name={name} thumb={thumb} />
			<RoomBody>
				<RoomProvider identifier={identifier}>
					<MessageList
						initialMessagesState={initialMessagesState}
						initialSearchResult={initialSearchResult}
						jumpAnimation={jumpAnimation}
					/>
					<MessageInput onMessageSent={onMessageSent} />
				</RoomProvider>
			</RoomBody>
		</RoomRoot>
	),
);

export type RoomProps<TMessage, TComponent extends ElementType = 'div', TAdditionalProps = {}> = MuiComponentProps<
	InternalRoomProps<TMessage>,
	TComponent,
	TAdditionalProps
>;
