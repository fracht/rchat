import { ComponentProps, ReactElement } from 'react';
import { createMuiComponent } from '../helpers/createMuiComponent';
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
	gridProps: ComponentProps<typeof ChatOverlayGrid>;
	children: ReactElement;
};

export const ChatOverlay = createMuiComponent<InternalChatOverlayProps, 'div'>(
	({ gridProps, children, component, ...other }) => (
		<ChatOverlayRoot {...other} as={component}>
			<ChatOverlayGrid {...gridProps}>{children}</ChatOverlayGrid>
		</ChatOverlayRoot>
	),
);
