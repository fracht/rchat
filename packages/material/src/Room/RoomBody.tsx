import { styled } from '../styles/styled';

export const RoomBody = styled('div', {
	name: 'Room',
	slot: 'Body',
})(({ theme }) => ({
	flex: 1,
	padding: theme.spacing(0, 1, 1, 1),
}));
