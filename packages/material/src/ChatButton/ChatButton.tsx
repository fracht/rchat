import ChatBubbleIcon from '@mui/icons-material/ChatBubble';
import Fab from '@mui/material/Fab';
import { styled } from '../styles/styled';

const ChatButtonClickZone = styled('div', {
	name: 'ChatButton',
	slot: 'ClickZone',
})(({ theme }) => ({
	padding: theme.spacing(2),
	margin: theme.spacing(0, -2, -2, 0),
}));

const ChatButtonRoot = styled(Fab, {
	name: 'ChatButton',
	slot: 'Root',
})(({ theme }) => ({
	background: theme.palette.background.paper,
	color: theme.palette.text.secondary,
	pointerEvents: 'all',
}));

export const ChatButton = () => (
	<ChatButtonClickZone>
		<ChatButtonRoot>
			<ChatBubbleIcon color="inherit" />
		</ChatButtonRoot>
	</ChatButtonClickZone>
);
