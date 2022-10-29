import ListItem from '@mui/material/ListItem';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import ListItemText from '@mui/material/ListItemText';
import { AccountAvatar } from '../AccountAvatar';

export const RoomListItem = () => (
	<ListItem>
		<ListItemAvatar>
			<AccountAvatar username="Hello World" />
		</ListItemAvatar>
		<ListItemText primary="Hello World" secondary="Lorem ipsum dolor sit amet" />
	</ListItem>
);
