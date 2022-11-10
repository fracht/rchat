import ChatBubbleIcon from '@mui/icons-material/ChatBubble';
import Fab from '@mui/material/Fab';
import { ElementType } from 'react';
import { createMuiComponent, MuiComponentProps } from '../helpers/createMuiComponent';
import { styled } from '../styles/styled';

const ChatButtonClickZone = styled('div', {
	name: 'ChatButton',
	slot: 'ClickZone',
})(({ theme }) => ({
	padding: theme.spacing(2),
	margin: theme.spacing(0, -2, -2, 0),
	pointerEvents: 'all',
}));

const ChatButtonRoot = styled(Fab, {
	name: 'ChatButton',
	slot: 'Root',
})(({ theme }) => ({
	background: theme.palette.background.paper,
	color: theme.palette.text.secondary,
}));

export const ChatButton = createMuiComponent<{}, typeof Fab>(({ component, ...other }) => (
	<ChatButtonClickZone>
		<ChatButtonRoot as={component} {...other}>
			<ChatBubbleIcon color="inherit" />
		</ChatButtonRoot>
	</ChatButtonClickZone>
));

export type ChatButtonProps<TComponent extends ElementType = typeof Fab, TAdditionalProps = {}> = MuiComponentProps<
	{},
	TComponent,
	TAdditionalProps
>;
