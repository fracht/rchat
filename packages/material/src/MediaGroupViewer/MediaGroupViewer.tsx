import ChevronLeft from '@mui/icons-material/ChevronLeft';
import ChevronRight from '@mui/icons-material/ChevronRight';
import Dialog, { DialogProps } from '@mui/material/Dialog';
import IconButton from '@mui/material/IconButton';

import { Dispatch, ReactElement, ReactNode, SetStateAction, useCallback } from 'react';
import { styled } from '../styles/styled';

const MediaGroupViewerRoot = styled(Dialog, {
	name: 'MediaGroupViewer',
	slot: 'Root',
})({});

const MediaGroupViewerPaper = styled('div', {
	name: 'MediaGroupViewer',
	slot: 'Paper',
})(({ theme }) => ({
	backgroundColor: '#000',
	display: 'flex',
	flexDirection: 'row',
	justifyContent: 'space-between',
	width: `calc(100% - ${theme.spacing(4)})`,
	height: '100%',
	maxHeight: '100vh',
	color: '#fff',
	padding: theme.spacing(0, 2),
	gap: theme.spacing(2),
}));

export type MediaGroupViewerProps = DialogProps & {
	maximizedItems: ReactNode[];
	activeItem: number;
	onActiveItemChange: Dispatch<SetStateAction<number>>;
};

export const MediaGroupViewer = ({
	maximizedItems,
	activeItem,
	onActiveItemChange,
	...other
}: MediaGroupViewerProps) => {
	const previous = useCallback(() => {
		onActiveItemChange((old) => --old);
	}, [onActiveItemChange]);

	const next = useCallback(() => {
		onActiveItemChange((old) => ++old);
	}, [onActiveItemChange]);

	return (
		<MediaGroupViewerRoot fullScreen {...other}>
			<MediaGroupViewerPaper>
				<IconButton
					sx={{ alignSelf: 'center' }}
					disabled={activeItem === 0}
					onClick={previous}
					size="large"
					color="inherit"
				>
					<ChevronLeft fontSize="large" />
				</IconButton>
				{maximizedItems[activeItem]}
				<IconButton
					sx={{ alignSelf: 'center' }}
					disabled={activeItem === maximizedItems.length - 1}
					onClick={next}
					size="large"
					color="inherit"
				>
					<ChevronRight fontSize="large" />
				</IconButton>
			</MediaGroupViewerPaper>
		</MediaGroupViewerRoot>
	);
};
