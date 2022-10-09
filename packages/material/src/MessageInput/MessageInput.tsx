/* eslint-disable @typescript-eslint/naming-convention */
import AttachFileIcon from '@mui/icons-material/AttachFile';
import SendIcon from '@mui/icons-material/Send';
import IconButton from '@mui/material/IconButton';
import InputBase from '@mui/material/InputBase';
import Tooltip from '@mui/material/Tooltip';
import { ChangeEvent, useState } from 'react';
import { styled } from '../styles/styled';

const MessageInputBase = styled(InputBase, {
	name: 'MessageInput',
	slot: 'InputBase',
	overridesResolver: (_, styles) => styles.root,
})(({ theme }) => ({
	flex: 1,
	borderRadius: 20,
	backgroundColor: theme.palette.grey[100],
	'& .MuiInputBase-input': {
		padding: theme.spacing(1, 2),
	},
}));

const MessageInputRoot = styled(
	'div',
	{},
)(({ theme }) => ({
	display: 'flex',
	gap: theme.spacing(1),
}));

export const MessageInput = () => {
	const [text, setText] = useState('');

	const handleTextChange = (event: ChangeEvent<HTMLInputElement>) => {
		setText(event.target.value);
	};

	return (
		<MessageInputRoot>
			<Tooltip title="Attach files">
				<IconButton>
					<AttachFileIcon />
				</IconButton>
			</Tooltip>
			<MessageInputBase value={text} onChange={handleTextChange} placeholder="Message" />
			<Tooltip title="Send">
				<IconButton>
					<SendIcon />
				</IconButton>
			</Tooltip>
		</MessageInputRoot>
	);
};
