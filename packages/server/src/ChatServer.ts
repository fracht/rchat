import {
	createTransfer,
	createTransferPlugin,
	Transfer,
	TransferEventMap,
	TransferPlugin,
	EventMapToHandlers,
} from '@rchat/shared';

type ServerEventMap<TPlugin extends TransferPlugin<TransferEventMap, TransferEventMap>> =
	TPlugin extends TransferPlugin<infer TServerEventMap, TransferEventMap> ? TServerEventMap : never;

type ConvertNames<T extends string | number | symbol> = T extends string ? `handle${Capitalize<T>}` : never;
type ReverseName<T extends string> = T extends `handle${infer OriginalName}` ? Uncapitalize<OriginalName> : T;

export type ServerEventHandler<TPlugin extends TransferPlugin<TransferEventMap, TransferEventMap>> = {
	[TKey in ConvertNames<keyof EventMapToHandlers<ServerEventMap<TPlugin>>>]: EventMapToHandlers<
		ServerEventMap<TPlugin>
	>[ReverseName<TKey>];
};

export type PluginsToHandlers<TPlugins extends readonly TransferPlugin<TransferEventMap, TransferEventMap>[]> = {
	[TKey in keyof TPlugins]: ServerEventHandler<TPlugins[TKey]>;
};

export type TransferToHandlers<
	TTransfer extends Transfer<readonly TransferPlugin<TransferEventMap, TransferEventMap>[]>,
> = TTransfer extends Transfer<infer TPlugins> ? PluginsToHandlers<TPlugins> : never;

export const createChatServer = <
	TTransfer extends Transfer<readonly TransferPlugin<TransferEventMap, TransferEventMap>[]>,
>(
	transfer: TTransfer,
	handlers: TransferToHandlers<TTransfer>,
) => {};
