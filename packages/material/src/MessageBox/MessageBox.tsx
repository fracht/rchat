import { ElementType, ReactElement } from 'react';
import { createMuiComponent, MuiComponentProps } from '../helpers/createMuiComponent';
import { styled } from '../styles/styled';

export type MessageOrientation = 'left' | 'right';

export type MessagePosition = 'start' | 'middle' | 'end';

type MessageBoxState = {
	orientation: MessageOrientation;
	position: MessagePosition;
};

const MessageBoxRoot = styled<MessageBoxState, 'div'>('div', {
	name: 'MessageBox',
	slot: 'Root',
	overridesResolver: (_, styles) => styles.root,
})(({ theme, ownerState: { orientation, position } }) => {
	const topSideRadius = ['start', 'middle'].includes(position) ? 0.5 : 2.25;
	const bottomSideRadius = ['end', 'middle'].includes(position) ? 0.5 : 2.25;

	return {
		marginBottom: position === 'end' ? theme.spacing(1.5) : theme.spacing(0.25),
		alignSelf: orientation === 'left' ? 'flex-start' : 'flex-end',
		borderRadius:
			orientation === 'left'
				? theme.spacing(bottomSideRadius, 2.25, 2.25, topSideRadius)
				: theme.spacing(2.25, bottomSideRadius, topSideRadius, 2.25),
	};
});

type InternalMessageBoxProps = {
	children: ReactElement;
} & MessageBoxState;

export const MessageBox = createMuiComponent<InternalMessageBoxProps, 'div'>(
	({ children, component, orientation, position, ...props }) => (
		<MessageBoxRoot ownerState={{ orientation, position }} as={component} {...props}>
			{children}
		</MessageBoxRoot>
	),
);

export type MessageBoxProps<TComponent extends ElementType = 'div', TAdditionalProps = {}> = MuiComponentProps<
	InternalMessageBoxProps,
	TComponent,
	TAdditionalProps
>;
