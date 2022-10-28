import { ComponentProps, ElementType, ReactNode } from 'react';
import { createMuiComponent, MuiComponentProps } from '../helpers/createMuiComponent';
import { styled } from '../styles/styled';

const ChatOverlayRoot = styled('div', {
	name: 'ChatOverlay',
	slot: 'Root',
})(({ theme }) => ({
	position: 'fixed',
	inset: 0,
	padding: theme.spacing(2),
	display: 'flex',
	justifyContent: 'flex-end',
	alignItems: 'flex-end',
	pointerEvents: 'none',
}));

const ChatOverlayGrid = styled('div', {
	name: 'ChatOverlay',
	slot: 'Grid',
})(({ theme }) => ({
	display: 'grid',
	gridAutoFlow: 'column',
	gap: theme.spacing(2),
	alignItems: 'flex-end',
}));

type InternalChatOverlayProps = {
	gridProps?: ComponentProps<typeof ChatOverlayGrid>;
	children?: ReactNode;
};

export const ChatOverlay = createMuiComponent<InternalChatOverlayProps, 'div'>(
	({ gridProps, children, component, ...other }) => (
		<ChatOverlayRoot {...other} as={component}>
			<ChatOverlayGrid {...gridProps}>{children}</ChatOverlayGrid>
		</ChatOverlayRoot>
	),
);

export type ChatOverlayProps<TComponent extends ElementType = 'div', TAdditionalProps = {}> = MuiComponentProps<
	InternalChatOverlayProps,
	TComponent,
	TAdditionalProps
>;
