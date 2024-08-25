import PersonRounded from '@mui/icons-material/PersonRounded';
import Avatar, { AvatarProps } from '@mui/material/Avatar';
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

const getInitials = (username: string): string | undefined => {
	const words = username
		.split(/\s+/g)
		.map((value) => value.replaceAll(/[^\p{L}]/gu, ''))
		.filter(Boolean);

	if (words.length === 0) {
		return undefined;
	}

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
}: AccountAvatarProps<TComponent, TAdditionalProps>) => {
	if (profileUrl) {
		return <AccountAvatarRoot ownerState={{ username, profileUrl }} src={profileUrl} alt={username} {...props} />;
	}

	const initials = getInitials(username);

	return (
		<AccountAvatarRoot ownerState={{ username, profileUrl }} {...props}>
			{initials ?? <PersonRounded />}
		</AccountAvatarRoot>
	);
};
