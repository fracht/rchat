export type MessageFetchResult<TMessage> = {
	messages: TMessage[];
	noMessagesAfter: boolean;
	noMessagesBefore: boolean;
};

export type MessageFetcher<TMessage> = (
	roomIdentifier: string,
	count: number,
	before: TMessage | undefined,
	after: TMessage | undefined,
) => Promise<MessageFetchResult<TMessage>>;

export type MessageSearchResult<TMessage> = {
	results: TMessage[];
	totalCount: number;
};

export type MessageSearcher<TMessage> = (
	roomIdentifier: string,
	criteria: unknown,
) => Promise<MessageSearchResult<TMessage>>;

export type ChatAPI<TMessage> = {
	fetchMessages: MessageFetcher<TMessage>;
	searchMessages: MessageSearcher<TMessage>;
};
