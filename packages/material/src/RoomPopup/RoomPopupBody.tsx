import { styled } from '../styles/styled';

export const RoomPopupBodyRoot = styled('div', {
	name: 'RoomPopup',
	slot: 'Body',
})(({ theme }) => ({
	flex: 1,
	padding: theme.spacing(0, 1, 1, 1),
}));
