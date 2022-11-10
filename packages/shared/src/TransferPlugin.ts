import { ZodType } from 'zod';

export type TransferEventMap = Record<
	string,
	{
		payloadSchema: ZodType<unknown>;
		responseSchema?: ZodType<unknown>;
	}
>;

export type EventMapToHandlers<TEventMap extends TransferEventMap> = {
	[TKey in keyof TEventMap]: TEventMap[TKey] extends {
		payloadSchema: ZodType<infer TPayload>;
		responseSchema: ZodType<infer TResponse>;
	}
		? (payload: TPayload) => Promise<TResponse>
		: TEventMap[TKey] extends { payloadSchema: ZodType<infer TPayload> }
		? (payload: TPayload) => void
		: never;
};

export type TransferPlugin<
	TPluginName extends string,
	TServerEventMap extends TransferEventMap,
	TClientEventMap extends TransferEventMap,
> = {
	name: TPluginName;
	server: TServerEventMap;
	client: TClientEventMap;
};

export const createTransferPlugin = <
	TPluginName extends string,
	TServerEventMap extends TransferEventMap,
	TClientEventMap extends TransferEventMap,
>(
	plugin: TransferPlugin<TPluginName, TServerEventMap, TClientEventMap>,
) => {
	return plugin;
};
