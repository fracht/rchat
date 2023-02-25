import { ComponentType, RefAttributes } from 'react';

export type PlaceholderComponentProps = {
	itemKey: string;
};

export type PlaceholderComponentType = ComponentType<PlaceholderComponentProps & RefAttributes<HTMLElement>>;
