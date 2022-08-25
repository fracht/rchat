import { createSafeContext } from '@sirse-dev/safe-context';

export type RoomContextType = {
	roomIdentifier: string;
};

export const RoomContext = createSafeContext<RoomContextType>();
