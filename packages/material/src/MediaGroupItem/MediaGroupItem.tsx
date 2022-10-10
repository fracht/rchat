import Typography from '@mui/material/Typography';
import { ElementType } from 'react';
import { createMuiComponent, MuiComponentProps } from '../helpers/createMuiComponent';
import { styled } from '../styles/styled';

const MediaGroupItemRoot = styled<InternalMediaGroupItemState, 'div'>('div', {
	name: 'MediaGroupItem',
	slot: 'Root',
})(({ ownerState }) => ({
	cursor: 'pointer',
	position: 'relative',
	width: '100%',
	height: '100%',
	overflow: 'hidden',
	...(ownerState.isMaximized && {
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
	}),
}));

const MediaGroupItemContent = styled<InternalMediaGroupItemState, 'div'>('div', {
	name: 'MediaGroupItem',
	slot: 'Content',
})(({ ownerState }) => ({
	...(!ownerState.isMaximized && {
		width: '100%',
		height: '100%',
		objectFit: 'cover',
	}),
	...(ownerState.isMaximized && {
		maxHeight: '100%',
		maxWidth: '100%',
	}),
}));

const MediaGroupItemOverlay = styled('div', {
	name: 'MediaGroupItem',
	slot: 'Overlay',
})({
	position: 'absolute',
	inset: 0,
	background: 'rgba(0 0 0 / 30%)',
	display: 'flex',
	justifyContent: 'center',
	alignItems: 'center',
	color: '#fff',
	pointerEvents: 'none',
});

type InternalMediaGroupItemState = {
	isMaximized?: boolean;
};

type InternalMediaGroupItemProps = {
	hiddenItemCount?: number;
} & InternalMediaGroupItemState;

export const MediaGroupItem = createMuiComponent<InternalMediaGroupItemProps, 'div'>(
	({ hiddenItemCount, component, isMaximized, ...props }) => {
		return (
			<MediaGroupItemRoot ownerState={{ isMaximized }}>
				<MediaGroupItemContent ownerState={{ isMaximized }} as={component} {...props} />
				{hiddenItemCount && (
					<MediaGroupItemOverlay>
						<Typography variant="h4" component="span">
							+{hiddenItemCount}
						</Typography>
					</MediaGroupItemOverlay>
				)}
			</MediaGroupItemRoot>
		);
	},
);

export type MediaGroupItemProps<TComponent extends ElementType = 'div', TAdditionalProps = {}> = MuiComponentProps<
	InternalMediaGroupItemProps,
	TComponent,
	TAdditionalProps
>;
