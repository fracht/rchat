import { ComponentType, RefAttributes } from 'react';
import { EndlessListRealItem } from './useEndlessList';

export type ItemComponentProps<TMessageType> = Omit<EndlessListRealItem<TMessageType>, 'type'>;

export type ItemComponentType<TMessageType> = ComponentType<
	ItemComponentProps<TMessageType> & RefAttributes<HTMLElement>
>;
