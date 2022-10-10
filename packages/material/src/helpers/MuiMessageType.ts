import { MuiAccountInfo } from './MuiAccountInfo';

export type MuiMessageType = {
	id: string;
	text?: string;
	author: MuiAccountInfo;
};
