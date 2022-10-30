import { Paper } from '@mui/material';
import { styled } from '../styles/styled';

export const ChatPopup = styled(Paper, {
	name: 'RoomPopup',
	slot: 'Root',
})({
	width: 280,
	height: 340,
	pointerEvents: 'all',
});
