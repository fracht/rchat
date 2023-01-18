import Avatar, { AvatarProps } from '@mui/material/Avatar';
import Tooltip from '@mui/material/Tooltip';
import { getContrastRatio } from '@mui/system/colorManipulator';
import { ElementType } from 'react';
import { styled } from '../styles/styled';

const AccountAvatarRoot = styled<InternalAccountAvatarProps, typeof Avatar>(Avatar, {
	name: 'AccountAvatar',
	slot: 'Root',
})(({ theme, ownerState: { username, profileUrl } }) => {
	let color: string | undefined = undefined;
	let backgroundColor: string | undefined = undefined;

	if (profileUrl === undefined) {
		backgroundColor = getAvatarColor(username);
		color = getContrastRatio('#000', backgroundColor) > getContrastRatio('#fff', backgroundColor) ? '#000' : '#fff';
	}

	return { width: 28, height: 28, color, backgroundColor, fontSize: theme.typography.body2.fontSize };
});

const getInitials = (username: string) => {
	const words = username.split(' ');

	return words[0][0] + (words[1]?.[0] || '');
};

const avatarColors = [
	'#2D3748',
	'#4A5568',
	'#9B2C2C',
	'#975A16',
	'#276749',
	'#2C7A7B',
	'#2B6CB0',
	'#1A365D',
	'#086F83',
	'#6B46C1',
	'#B83280',
	'#702459',
];

const getAvatarColor = (username: string) => {
	let hash = 0;

	for (let index = 0; index < username.length; index += 1) {
		hash = username.codePointAt(index)! + ((hash << 5) - hash);
	}

	return avatarColors[Math.abs(hash) % avatarColors.length];
};

const getAvatar = (username: string, profileUrl?: string): AvatarProps => {
	if (profileUrl !== undefined) {
		return { src: profileUrl, alt: username };
	}

	const initials = getInitials(username);

	return {
		children: initials,
	};
};

type InternalAccountAvatarProps = {
	username: string;
	profileUrl?: string;
};

export type AccountAvatarProps<TComponent extends ElementType = 'div', TAdditionalProps = {}> = AvatarProps<
	TComponent,
	TAdditionalProps
> &
	InternalAccountAvatarProps;

export const AccountAvatar = <TComponent extends ElementType = 'div', TAdditionalProps = {}>({
	username,
	profileUrl,
	...props
}: AccountAvatarProps<TComponent, TAdditionalProps>) => (
	<Tooltip title={username}>
		<AccountAvatarRoot ownerState={{ username, profileUrl }} {...getAvatar(username, profileUrl)} {...props} />
	</Tooltip>
);
