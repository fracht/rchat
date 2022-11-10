import { TransferEventMap, TransferPlugin } from './TransferPlugin';

export type Transfer<TPlugins extends readonly TransferPlugin<string, TransferEventMap, TransferEventMap>[]> = {
	plugins: TPlugins;
};

export const createTransfer = <TPlugins extends readonly TransferPlugin<string, TransferEventMap, TransferEventMap>[]>(
	...plugins: TPlugins
) => {
	return {
		plugins,
	};
};
