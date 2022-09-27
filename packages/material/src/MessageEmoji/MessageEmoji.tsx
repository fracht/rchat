import { styled } from '../styles/styled';

export const MessageEmoji = styled('div', {
	name: 'MessageEmoji',
	slot: 'Root',
	overridesResolver: (_, styles) => styles.root,
})(({ theme }) => ({
	fontSize: theme.typography.h4.fontSize,
}));
