import Avatar, { AvatarProps } from '@mui/material/Avatar';
import { getContrastRatio } from '@mui/system/colorManipulator';
import { ElementType } from 'react';
import { styled } from '../styles/styled';

const AccountAvatarRoot = styled(Avatar, {
	name: 'AccountAvatar',
	slot: 'Root',
})(({ theme }) => ({
	width: 28,
	height: 28,
	fontSize: theme.typography.body2.fontSize,
}));

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
	const color = getAvatarColor(username);

	return {
		sx: {
			backgroundColor: color,
			color: getContrastRatio('#000', color) > getContrastRatio('#fff', color) ? '#000' : '#fff',
		},
		children: initials,
	};
};

export type AccountAvatarProps<TComponent extends ElementType = 'div', TAdditionalProps = {}> = AvatarProps<
	TComponent,
	TAdditionalProps
> & {
	username: string;
	profileUrl?: string;
};

export const AccountAvatar = <TComponent extends ElementType = 'div', TAdditionalProps = {}>({
	username,
	profileUrl,
	...props
}: AccountAvatarProps<TComponent, TAdditionalProps>) => (
	<AccountAvatarRoot {...getAvatar(username, profileUrl)} {...props} />
);
