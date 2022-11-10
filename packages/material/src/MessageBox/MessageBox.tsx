import { CSSObject, Typography } from '@mui/material';
import { ElementType, ReactElement } from 'react';
import { AccountAvatar } from '../AccountAvatar';
import { createMuiComponent, MuiComponentProps } from '../helpers/createMuiComponent';
import { MuiAccountInfo } from '../helpers/MuiAccountInfo';
import { styled } from '../styles/styled';

export type MessageOrientation = 'left' | 'right';

export type MessagePosition = 'start' | 'middle' | 'end' | 'single';

type MessageBoxState = {
	orientation: MessageOrientation;
	position: MessagePosition;
};

const getGridProperties = (orientation: MessageOrientation): CSSObject => {
	if (orientation === 'left') {
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

const MessageBoxRoot = styled<MessageBoxState, 'div'>('div', {
	name: 'MessageBox',
	slot: 'Root',
	overridesResolver: (_, styles) => styles.root,
})(({ theme, ownerState: { orientation, position } }) => {
	return {
		marginBottom: ['end', 'single'].includes(position) ? theme.spacing(1.5) : theme.spacing(0.25),
		display: 'grid',
		columnGap: theme.spacing(1),
		...getGridProperties(orientation),
	};
});

const MessageBoxContent = styled<MessageBoxState, 'div'>('div', {
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

const MessageBoxTime = styled<MessageBoxState, typeof Typography>(Typography, {
	name: 'MessageBox',
	slot: 'Time',
})(({ theme, ownerState: { orientation } }) => ({
	gridArea: 'time',
	justifySelf: orientation === 'left' ? 'flex-start' : 'flex-end',
	...theme.typography.body2,
	color: theme.palette.grey[600],
	padding: theme.spacing(0, 1),
}));

type InternalMessageBoxProps = {
	author?: MuiAccountInfo;
	time?: Date;
	children: ReactElement;
} & MessageBoxState;

const formatTime = (time: Date) => {
	const diff = (time.getTime() - Date.now()) / 1000;

	const relativeFormat = new Intl.RelativeTimeFormat(undefined, { localeMatcher: 'best fit' });

	if (-diff < 60) {
		return relativeFormat.format(Math.round(diff), 'second');
	}

	if (-diff < 3600) {
		return relativeFormat.format(Math.round(diff / 60), 'minute');
	}

	if (-diff < 43_200) {
		return relativeFormat.format(Math.round(diff / 3600), 'hours');
	}

	const dateTimeFormat = new Intl.DateTimeFormat(undefined, {
		year: 'numeric',
		month: '2-digit',
		day: '2-digit',
		hour: 'numeric',
		hour12: false,
		minute: '2-digit',
		localeMatcher: 'best fit',
	});

	return dateTimeFormat.format(time);
};

export const MessageBox = createMuiComponent<InternalMessageBoxProps, 'div'>(
	({ children, component, orientation, position, time, author, ...props }) => (
		<MessageBoxRoot ownerState={{ orientation, position }}>
			{author && (
				<MessageBoxAvatarWrapper>
					<AccountAvatar {...author} />
				</MessageBoxAvatarWrapper>
			)}
			<MessageBoxContent as={component} ownerState={{ orientation, position }} {...props}>
				{children}
			</MessageBoxContent>
			{time && position === 'end' && (
				<MessageBoxTime ownerState={{ orientation, position }}>{formatTime(time)}</MessageBoxTime>
			)}
		</MessageBoxRoot>
	),
);

export type MessageBoxProps<TComponent extends ElementType = 'div', TAdditionalProps = {}> = MuiComponentProps<
	InternalMessageBoxProps,
	TComponent,
	TAdditionalProps
>;
