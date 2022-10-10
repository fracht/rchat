import { ElementType, ReactElement } from 'react';
import { createMuiComponent, MuiComponentProps } from '../helpers/createMuiComponent';
import { MuiAccountInfo } from '../helpers/MuiAccountInfo';
import { styled } from '../styles/styled';
import { AccountAvatar } from '../AccountAvatar';

export type MessageOrientation = 'left' | 'right';

export type MessagePosition = 'start' | 'middle' | 'end' | 'single';

type MessageBoxState = {
	orientation: MessageOrientation;
	position: MessagePosition;
};

const MessageBoxRoot = styled<MessageBoxState, 'div'>('div', {
	name: 'MessageBox',
	slot: 'Root',
	overridesResolver: (_, styles) => styles.root,
})(({ theme, ownerState: { orientation, position } }) => {
	return {
		marginBottom: ['end', 'single'].includes(position) ? theme.spacing(1.5) : theme.spacing(0.25),
		display: 'flex',
		justifyContent: 'flex-start',
		flexDirection: orientation === 'left' ? 'row' : 'row-reverse',
		gap: theme.spacing(1),
	};
});

const MessageBoxContent = styled<MessageBoxState, 'div'>('div', {
	name: 'MessageBox',
	slot: 'Content',
})(({ theme, ownerState: { orientation, position } }) => {
	const topSideRadius = ['start', 'middle'].includes(position) ? 0.5 : 2.25;
	const bottomSideRadius = ['end', 'middle'].includes(position) ? 0.5 : 2.25;

	return {
		borderRadius:
			orientation === 'left'
				? theme.spacing(bottomSideRadius, 2.25, 2.25, topSideRadius)
				: theme.spacing(2.25, bottomSideRadius, topSideRadius, 2.25),
	};
});

const MessageBoxAvatarWrapper = styled<MessageBoxState, 'div'>('div', {
	name: 'MessageBox',
	slot: 'Avatar',
})(({ ownerState: { orientation } }) => ({
	width: 28,
	alignSelf: 'flex-end',
	display: orientation === 'right' ? 'none' : undefined,
}));

type InternalMessageBoxProps = {
	author?: MuiAccountInfo;
	children: ReactElement;
} & MessageBoxState;

export const MessageBox = createMuiComponent<InternalMessageBoxProps, 'div'>(
	({ children, component, orientation, position, author, ...props }) => (
		<MessageBoxRoot ownerState={{ orientation, position }}>
			<MessageBoxAvatarWrapper ownerState={{ orientation, position }}>
				{author && <AccountAvatar {...author} />}
			</MessageBoxAvatarWrapper>
			<MessageBoxContent as={component} ownerState={{ orientation, position }} {...props}>
				{children}
			</MessageBoxContent>
		</MessageBoxRoot>
	),
);

export type MessageBoxProps<TComponent extends ElementType = 'div', TAdditionalProps = {}> = MuiComponentProps<
	InternalMessageBoxProps,
	TComponent,
	TAdditionalProps
>;
