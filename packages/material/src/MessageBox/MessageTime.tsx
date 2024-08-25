import { Typography } from '@mui/material';
import { ElementType, forwardRef, Ref, useEffect, useState } from 'react';
import { MessageOrientation } from './MessageOrientation';
import { createMuiComponent, MuiComponentProps } from '../helpers/createMuiComponent';
import { styled } from '../styles/styled';

type MessageTimeWrapperState = {
	orientation: MessageOrientation;
};

const MessageTimeWrapper = styled<MessageTimeWrapperState, typeof Typography>(Typography, {
	name: 'MessageBox',
	slot: 'Time',
})(({ theme, ownerState: { orientation } }) => ({
	gridArea: 'time',
	justifySelf: orientation === 'left' ? 'flex-start' : 'flex-end',
	...theme.typography.body2,
	color: theme.palette.grey[600],
	padding: theme.spacing(0, 1),
}));

const ONE_MINUTE = 60_000;
const ONE_HOUR = 3_600_000;

const formatTime = (time: Date): [text: string, updateAfter: number | undefined] => {
	const diff = (time.getTime() - Date.now()) / 1000;

	const relativeFormat = new Intl.RelativeTimeFormat(undefined, { localeMatcher: 'best fit' });

	if (-diff < 60) {
		return ['just now', ONE_MINUTE];
	}

	if (-diff < 3600) {
		return [relativeFormat.format(Math.round(diff / 60), 'minute'), ONE_MINUTE];
	}

	if (-diff < 43_200) {
		return [relativeFormat.format(Math.round(diff / 3600), 'hours'), ONE_HOUR];
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

	return [dateTimeFormat.format(time), undefined];
};

type InternalMessageTimeProps = {
	time: Date;
} & MessageTimeWrapperState;

export const MessageTime = createMuiComponent<InternalMessageTimeProps, typeof Typography>(
	forwardRef(({ orientation, time, component, ...other }, reference: Ref<HTMLElement>) => {
		const [formattedTime, setFormattedTime] = useState(() => formatTime(time)[0]);

		useEffect(() => {
			let timeoutId: number | undefined = undefined;

			const updateTime = () => {
				const [formattedTime, updateTimeout] = formatTime(time);

				setFormattedTime(formattedTime);
				if (updateTimeout === undefined) {
					timeoutId = undefined;
				} else {
					timeoutId = setTimeout(updateTime, updateTimeout);
				}
			};
			updateTime();

			return () => {
				clearTimeout(timeoutId);
			};
		}, [time]);

		return (
			<MessageTimeWrapper {...other} as={component} ownerState={{ orientation }} ref={reference}>
				{formattedTime}
			</MessageTimeWrapper>
		);
	}),
);

export type MessageTimeProps<
	TComponent extends ElementType = typeof Typography,
	TAdditionalProps = {},
> = MuiComponentProps<InternalMessageTimeProps, TComponent, TAdditionalProps>;
