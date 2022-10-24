import Paper from '@mui/material/Paper';
import { MessageList } from '@rchat/react';
import { MessageInput } from '../MessageInput';
import { styled } from '../styles/styled';
import { RoomPopupBodyRoot } from './RoomPopupBody';
import { RoomPopupHeader } from './RoomPopupHeader';

export const RoomPopupRoot = styled(Paper, {
	name: 'RoomPopup',
	slot: 'Root',
})({
	width: 280,
	height: 340,
	display: 'flex',
	flexDirection: 'column',
});

export const RoomPopup = () => (
	<RoomPopupRoot elevation={6}>
		<RoomPopupHeader name="Hello world" />
		<RoomPopupBodyRoot>
			<MessageList />
			<MessageInput />
		</RoomPopupBodyRoot>
	</RoomPopupRoot>
);
