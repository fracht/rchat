import { MessageList, Room as RoomProvider } from '@rchat/react';
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
});

type InternalRoomProps = {
	name: string;
	identifier: string;
	thumbUrl?: string;
};

export const Room = createMuiComponent<InternalRoomProps, 'div'>(
	({ name, identifier, thumbUrl, component, ...other }) => (
		<RoomRoot as={component} {...other}>
			<RoomHeader name={name} thumbUrl={thumbUrl} />
			<RoomProvider identifier={identifier}>
				<RoomBody />
				<MessageList />
			</RoomProvider>
			<MessageInput />
		</RoomRoot>
	),
);

export type RoomProps<TComponent extends ElementType = 'div', TAdditionalProps = {}> = MuiComponentProps<
	InternalRoomProps,
	TComponent,
	TAdditionalProps
>;
