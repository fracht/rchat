import { styled } from '../styles/styled';

export const RoomBody = styled('div', {
	name: 'Room',
	slot: 'Body',
})({
	flex: 1,
	display: 'flex',
	flexDirection: 'column',
	overflowY: 'hidden',
});
