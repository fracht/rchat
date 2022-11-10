import { TransferEventMap, TransferPlugin } from '@rchat/shared';

export const createServerPlugin = <
	TPluginName extends string,
	TServerEventMap extends TransferEventMap,
	TClientEventMap extends TransferEventMap,
>(
	transferPlugin: TransferPlugin<TPluginName, TServerEventMap, TClientEventMap>,
) => {};
