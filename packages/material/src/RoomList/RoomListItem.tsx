import ListItemAvatar from '@mui/material/ListItemAvatar';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import { ElementType } from 'react';
import { AccountAvatar } from '../AccountAvatar';
import { createMuiComponent, MuiComponentProps } from '../helpers/createMuiComponent';

type InternalRootListItemProps = {
	name: string;
	thumbUrl?: string;
	unseenMessageText: string;
};

export const RoomListItem = createMuiComponent<InternalRootListItemProps, typeof ListItemButton>(
	({ name, thumbUrl, unseenMessageText, ...other }) => (
		<ListItemButton {...other}>
			<ListItemAvatar>
				<AccountAvatar username={name} profileUrl={thumbUrl} />
			</ListItemAvatar>
			<ListItemText primary={name} secondary={unseenMessageText} />
		</ListItemButton>
	),
);

export type RoomListItemProps<
	TComponent extends ElementType = typeof ListItemButton,
	TAdditionalProps = {},
> = MuiComponentProps<InternalRootListItemProps, TComponent, TAdditionalProps>;
