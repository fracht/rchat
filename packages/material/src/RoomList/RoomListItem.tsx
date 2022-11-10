import ListItem from '@mui/material/ListItem';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import ListItemText from '@mui/material/ListItemText';
import { ElementType } from 'react';
import { AccountAvatar } from '../AccountAvatar';
import { createMuiComponent, MuiComponentProps } from '../helpers/createMuiComponent';

type InternalRootListItemProps = {
	name: string;
	thumbUrl?: string;
	unseenMessageText: string;
};

export const RoomListItem = createMuiComponent<InternalRootListItemProps, typeof ListItem>(
	({ name, thumbUrl, unseenMessageText, ...other }) => (
		<ListItem {...other}>
			<ListItemAvatar>
				<AccountAvatar username={name} profileUrl={thumbUrl} />
			</ListItemAvatar>
			<ListItemText primary={name} secondary={unseenMessageText} />
		</ListItem>
	),
);

export type RoomListItemProps<
	TComponent extends ElementType = typeof ListItem,
	TAdditionalProps = {},
> = MuiComponentProps<InternalRootListItemProps, TComponent, TAdditionalProps>;
