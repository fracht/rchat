import { MessageList, MessageListProps, Room as RoomProvider } from '@rchat/react';
import { ElementType } from 'react';
import { createMuiComponent, MuiComponentProps } from '../helpers/createMuiComponent';
import { MessageInput } from '../MessageInput';
import { styled } from '../styles/styled';
import { RoomBody } from './RoomBody';
import { RoomHeader } from './RoomHeader';

const RoomRoot = styled('div', {
	name: 'Room',
	slot: 'Root',
})({
	display: 'flex',
	flexDirection: 'column',
	height: '100%',
});

type InternalRoomProps = {
	name: string;
	identifier: string;
	thumb?: string | boolean;
	onMessageSent: (message: string) => void;
	onClose?: () => void;
	initialMessagesState: MessageListProps<unknown>['initialMessagesState'];
};

export const Room = createMuiComponent<InternalRoomProps, 'div'>(
	({ name, identifier, thumb = true, onClose, onMessageSent, component, initialMessagesState, ...other }) => (
		<RoomRoot as={component} {...other}>
			<RoomHeader onClose={onClose} name={name} thumb={thumb} />
			<RoomBody>
				<RoomProvider identifier={identifier}>
					<MessageList initialMessagesState={initialMessagesState} />
					<MessageInput onMessageSent={onMessageSent} />
				</RoomProvider>
			</RoomBody>
		</RoomRoot>
	),
);

export type RoomProps<TComponent extends ElementType = 'div', TAdditionalProps = {}> = MuiComponentProps<
	InternalRoomProps,
	TComponent,
	TAdditionalProps
>;
