import CloseIcon from '@mui/icons-material/Close';
import { Typography, IconButton } from '@mui/material';
import { ElementType } from 'react';
import { AccountAvatar } from '../AccountAvatar';
import { createMuiComponent, MuiComponentProps } from '../helpers/createMuiComponent';
import { styled } from '../styles/styled';

export const RoomHeaderRoot = styled('header', {
	name: 'Room',
	slot: 'Header',
})(({ theme }) => ({
	display: 'flex',
	justifyContent: 'center',
	alignItems: 'center',
	gap: theme.spacing(1),
	padding: theme.spacing(1),
	borderBottom: `1px solid ${theme.palette.grey[300]}`,
}));

type InternalRoomHeaderProps = {
	name: string;
	thumb?: string | boolean;
	onClose?: () => void;
};

export const RoomHeader = createMuiComponent<InternalRoomHeaderProps, 'header'>(
	({ component, name, thumb, onClose, ...other }) => (
		<RoomHeaderRoot as={component} {...other}>
			{thumb && <AccountAvatar username={name} profileUrl={typeof thumb === 'string' ? thumb : undefined} />}
			<Typography noWrap flex={1}>
				{name}
			</Typography>
			<IconButton onClick={onClose} size="small">
				<CloseIcon />
			</IconButton>
		</RoomHeaderRoot>
	),
);

export type RoomHeaderProps<TComponent extends ElementType = 'header', TAdditionalProps = {}> = MuiComponentProps<
	InternalRoomHeaderProps,
	TComponent,
	TAdditionalProps
>;
