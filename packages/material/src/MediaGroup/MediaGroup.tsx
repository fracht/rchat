import { Children, cloneElement, ElementType, ReactElement, ReactNode, useState, isValidElement } from 'react';
import { createMuiComponent, MuiComponentProps } from '../helpers/createMuiComponent';
import { MediaGroupViewer } from '../MediaGroupViewer/MediaGroupViewer';
import { styled } from '../styles/styled';

const MediaGroupRoot = styled('div', {
	name: 'MediaGroup',
	slot: 'Root',
	overridesResolver: (_, styles) => styles.root,
})({
	display: 'grid',
	gridTemplateColumns: 'repeat(auto-fit, minmax(125px, 50%))',
	gridAutoRows: '125px',
	maxWidth: '250px',
	width: 'min-content',
	overflow: 'hidden',
});

type InternalMediaGroupProps = {
	children: ReactNode;
};

export const MediaGroup = createMuiComponent<InternalMediaGroupProps, 'div'>(({ children, component, ...props }) => {
	const originalChildren = Children.toArray(children);

	if (!originalChildren.every(isValidElement as (value: unknown) => value is ReactElement)) {
		throw new Error('MediaGroup accepts only <MediaGroupItem /> child elements');
	}

	let normalizedChildren = originalChildren;
	const childrenCount = Children.count(children);

	if (childrenCount > 2 && childrenCount !== 4) {
		const slicedCount = childrenCount > 4 ? 4 : 2;
		const hiddenItemCount = childrenCount - slicedCount;

		normalizedChildren = [
			...normalizedChildren.slice(0, slicedCount - 1),
			cloneElement(normalizedChildren[slicedCount - 1], { hiddenItemCount }),
		];
	}

	const [previewIndex, setPreviewIndex] = useState(-1);

	normalizedChildren = normalizedChildren.map((child, index) =>
		cloneElement(child, { onClick: () => setPreviewIndex(index) }),
	);

	const maximizedChildren = originalChildren.map((child) => cloneElement(child, { isMaximized: true }));

	return (
		<MediaGroupRoot as={component} {...props}>
			{normalizedChildren}
			<MediaGroupViewer
				maximizedItems={maximizedChildren}
				onClose={() => setPreviewIndex(-1)}
				activeItem={previewIndex}
				onActiveItemChange={setPreviewIndex}
				open={previewIndex !== -1}
			/>
		</MediaGroupRoot>
	);
});

export type MediaGroupProps<TComponent extends ElementType = 'div', TAdditionalProps = {}> = MuiComponentProps<
	InternalMediaGroupProps,
	TComponent,
	TAdditionalProps
>;
