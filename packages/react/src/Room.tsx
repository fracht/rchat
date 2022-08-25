import { PropsWithChildren } from 'react';
import { RoomContext } from './internal/RoomContext';

export type RoomProps = PropsWithChildren<{
	identifier: string;
}>;

export const Room = ({ identifier, children }: RoomProps) => {
	return <RoomContext.Provider value={{ roomIdentifier: identifier }}>{children}</RoomContext.Provider>;
};
