import Typography from '@mui/material/Typography';
import { ElementType, ReactElement } from 'react';
import { createMuiComponent, MuiComponentProps } from '../helpers/createMuiComponent';
import { styled } from '../styles/styled';
import type { OverridableStringUnion } from '@mui/types';

export interface MessageTextColorOverrides {}

type MessageTextState = {
	color?: OverridableStringUnion<
		'default' | 'primary' | 'secondary' | 'success' | 'error' | 'info' | 'warning',
		MessageTextColorOverrides
	>;
};

const MessageTextRoot = styled<MessageTextState, typeof Typography>(Typography, {
	name: 'MessageText',
	slot: 'Root',
	overridesResolver: (_, styles) => styles.root,
})(({ theme, ownerState: { color } }) => {
	const backgroundColor = color === 'default' ? theme.palette.grey[200] : theme.palette[color!].main;

	return {
		padding: theme.spacing(1, 1.5),
		backgroundColor,
		color: theme.palette.getContrastText(backgroundColor),
		maxWidth: '50%',
		wordBreak: 'break-word',
	};
});

type InternalMessageTextProps = {
	children: ReactElement;
} & MessageTextState;

export const MessageText = createMuiComponent<InternalMessageTextProps, 'div'>(
	({ children, component, color = 'default', ...props }) => (
		<MessageTextRoot ownerState={{ color }} as={component} {...props}>
			{children}
		</MessageTextRoot>
	),
);

export type MessageTextProps<TComponent extends ElementType = 'div', TAdditionalProps = {}> = MuiComponentProps<
	InternalMessageTextProps,
	TComponent,
	TAdditionalProps
>;
