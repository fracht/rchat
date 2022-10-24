import CloseIcon from '@mui/icons-material/Close';
import { Typography, IconButton } from '@mui/material';
import { ElementType } from 'react';
import { AccountAvatar } from '../AccountAvatar';
import { createMuiComponent, MuiComponentProps } from '../helpers/createMuiComponent';
import { styled } from '../styles/styled';

export const RoomPopupHeaderRoot = styled('header', {
	name: 'RoomPopup',
	slot: 'Header',
})(({ theme }) => ({
	display: 'flex',
	justifyContent: 'center',
	alignItems: 'center',
	gap: theme.spacing(1),
	padding: theme.spacing(1),
	borderBottom: `1px solid ${theme.palette.grey[300]}`,
}));

type InternalRoomPopupHeaderProps = {
	name: string;
	thumbUrl?: string;
};

export const RoomPopupHeader = createMuiComponent<InternalRoomPopupHeaderProps, 'header'>(() => {
	return (
		<RoomPopupHeaderRoot>
			<AccountAvatar username="Hello World" />
			<Typography flex={1}>Hello World</Typography>
			<IconButton size="small">
				<CloseIcon />
			</IconButton>
		</RoomPopupHeaderRoot>
	);
});

export type RoomPopupHeaderProps<TComponent extends ElementType = 'header', TAdditionalProps = {}> = MuiComponentProps<
	InternalRoomPopupHeaderProps,
	TComponent,
	TAdditionalProps
>;
