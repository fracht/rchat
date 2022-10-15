import CloseIcon from '@mui/icons-material/Close';
import IconButton from '@mui/material/IconButton';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import { AccountAvatar } from '../AccountAvatar';
import { styled } from '../styles/styled';

export const RoomPopupRoot = styled(Paper, {
	name: 'RoomPopup',
	slot: 'Root',
})({
	width: 260,
});

export const RoomPopupHeader = styled('header', {
	name: 'RoomPopup',
	slot: 'Header',
})(({ theme }) => ({
	display: 'flex',
	justifyContent: 'center',
	alignItems: 'center',
	gap: theme.spacing(1),
	padding: theme.spacing(1),
}));

export const RoomPopup = () => (
	<RoomPopupRoot elevation={2}>
		<RoomPopupHeader>
			<AccountAvatar username="Hello World" />
			<Typography flex={1}>Hello World</Typography>
			<IconButton size="small">
				<CloseIcon />
			</IconButton>
		</RoomPopupHeader>
	</RoomPopupRoot>
);
