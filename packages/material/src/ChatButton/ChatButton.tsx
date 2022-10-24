import ChatBubbleIcon from '@mui/icons-material/ChatBubble';
import Fab from '@mui/material/Fab';
import { styled } from '../styles/styled';

const ChatButtonRoot = styled(Fab, {
	name: 'ChatButton',
	slot: 'Root',
})(({ theme }) => ({
	background: theme.palette.background.paper,
	color: theme.palette.text.secondary,
}));

export const ChatButton = () => (
	<ChatButtonRoot>
		<ChatBubbleIcon color="inherit" />
	</ChatButtonRoot>
);
