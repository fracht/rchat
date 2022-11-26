import SendIcon from '@mui/icons-material/Send';
import IconButton from '@mui/material/IconButton';
import InputBase from '@mui/material/InputBase';
import Tooltip from '@mui/material/Tooltip';
import { ChangeEvent, FormEvent, useState } from 'react';
import { createMuiComponent } from '../helpers/createMuiComponent';
import { styled } from '../styles/styled';

const MessageInputBase = styled(InputBase, {
	name: 'MessageInput',
	slot: 'InputBase',
	overridesResolver: (_, styles) => styles.root,
})(({ theme }) => ({
	flex: 1,
	borderRadius: 20,
	backgroundColor: theme.palette.grey[100],
	// eslint-disable-next-line @typescript-eslint/naming-convention
	'& .MuiInputBase-input': {
		padding: theme.spacing(1, 2),
	},
}));

const MessageInputRoot = styled(
	'form',
	{},
)(({ theme }) => ({
	display: 'flex',
	gap: theme.spacing(1),
	background: theme.palette.background.default,
	padding: theme.spacing(1),
}));

type InternalMessageInputProps = {
	onMessageSent: (text: string) => void;
};

export const MessageInput = createMuiComponent<InternalMessageInputProps, typeof InputBase>(
	({ component, onMessageSent, ...other }) => {
		const [text, setText] = useState('');

		const handleTextChange = (event: ChangeEvent<HTMLInputElement>) => {
			setText(event.target.value);
		};

		const handleSubmit = (event: FormEvent | MouseEvent) => {
			event.preventDefault();
			onMessageSent(text);
			setText('');
		};

		return (
			<MessageInputRoot onSubmit={handleSubmit}>
				<MessageInputBase
					{...other}
					as={component}
					value={text}
					onChange={handleTextChange}
					placeholder="Message"
				/>
				<Tooltip title="Send">
					<IconButton onClick={handleSubmit}>
						<SendIcon />
					</IconButton>
				</Tooltip>
			</MessageInputRoot>
		);
	},
);
