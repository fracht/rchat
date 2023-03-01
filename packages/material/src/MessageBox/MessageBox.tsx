import { CSSObject } from '@mui/material';
import { ElementType, forwardRef, ReactElement, Ref } from 'react';
import { AccountAvatar } from '../AccountAvatar';
import { createMuiComponent, MuiComponentProps } from '../helpers/createMuiComponent';
import { MuiAccountInfo } from '../helpers/MuiAccountInfo';
import { styled } from '../styles/styled';
import { MessageOrientation } from './MessageOrientation';
import { MessageTime } from './MessageTime';

export type MessagePosition = 'start' | 'middle' | 'end' | 'single';

type MessageBoxState = {
	orientation: MessageOrientation;
	position: MessagePosition;
};

const getGridProperties = (orientation: MessageOrientation, isAuthorPresent: boolean): CSSObject => {
	if (orientation === 'left' && isAuthorPresent) {
		return {
			gridTemplateAreas: '"avatar content" ". time"',
			gridTemplateColumns: '28px auto',
		};
	}

	return {
		gridTemplateAreas: '"content" "time"',
		gridTemplateColumns: 'auto',
	};
};

export const MessageBoxRoot = styled<MessageBoxState & { isAuthorPresent: boolean }, 'div'>('div', {
	name: 'MessageBox',
	slot: 'Root',
	overridesResolver: (_, styles) => styles.root,
})(({ theme, ownerState: { orientation, position, isAuthorPresent } }) => {
	return {
		marginBottom: ['end', 'single'].includes(position) ? theme.spacing(1.5) : theme.spacing(0.25),
		display: 'grid',
		columnGap: theme.spacing(1),
		...getGridProperties(orientation, isAuthorPresent),
	};
});

export const MessageBoxContent = styled<MessageBoxState, 'div'>('div', {
	name: 'MessageBox',
	slot: 'Content',
})(({ theme, ownerState: { orientation, position } }) => {
	const topSideRadius = ['start', 'middle'].includes(position) ? 0.5 : 2.25;
	const bottomSideRadius = ['end', 'middle'].includes(position) ? 0.5 : 2.25;

	return {
		gridArea: 'content',
		justifySelf: orientation === 'left' ? 'flex-start' : 'flex-end',
		borderRadius:
			orientation === 'left'
				? theme.spacing(bottomSideRadius, 2.25, 2.25, topSideRadius)
				: theme.spacing(2.25, bottomSideRadius, topSideRadius, 2.25),
	};
});

const MessageBoxAvatarWrapper = styled('div', {
	name: 'MessageBox',
	slot: 'Avatar',
})({
	alignSelf: 'flex-end',
	gridArea: 'avatar',
});

type InternalMessageBoxProps = {
	author?: MuiAccountInfo;
	time?: Date;
	children: ReactElement;
} & MessageBoxState;

export const MessageBox = createMuiComponent<InternalMessageBoxProps, 'div'>(
	forwardRef(
		({ children, component, orientation, position, time, author, ...props }, reference: Ref<HTMLDivElement>) => (
			<MessageBoxRoot ownerState={{ orientation, position, isAuthorPresent: !!author }}>
				{author && orientation === 'left' && ['single', 'end'].includes(position) && (
					<MessageBoxAvatarWrapper>
						<AccountAvatar {...author} />
					</MessageBoxAvatarWrapper>
				)}
				<MessageBoxContent {...props} ref={reference} as={component} ownerState={{ orientation, position }}>
					{children}
				</MessageBoxContent>
				{time && ['single', 'end'].includes(position) && <MessageTime orientation={orientation} time={time} />}
			</MessageBoxRoot>
		),
	),
);

export type MessageBoxProps<TComponent extends ElementType = 'div', TAdditionalProps = {}> = MuiComponentProps<
	InternalMessageBoxProps,
	TComponent,
	TAdditionalProps
>;
