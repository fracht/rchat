// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyFunction = (...parameters: any[]) => void;

export type CustomEventMap = Record<string, AnyFunction>;

export interface CustomEventListener<T extends AnyFunction> {
	(...parameters: Parameters<T>): void;
}

export class CustomEventTarget<TEventMap extends CustomEventMap> {
	private readonly listenerMap: Map<keyof TEventMap, Array<CustomEventListener<AnyFunction>>>;

	public constructor() {
		this.listenerMap = new Map();
	}

	public dispatchEvent<TEventName extends keyof TEventMap>(
		type: TEventName,
		...parameters: Parameters<TEventMap[TEventName]>
	): void {
		const listeners = this.listenerMap.get(type);

		if (!listeners) {
			return;
		}

		for (const listener of listeners) {
			listener(...parameters);
		}
	}

	public addEventListener<TEventName extends keyof TEventMap>(
		type: TEventName,
		callback: CustomEventListener<TEventMap[TEventName]>,
	): void {
		const listeners = this.listenerMap.get(type) ?? [];

		listeners.push(callback);

		this.listenerMap.set(type, listeners);
	}

	public removeEventListener<TEventName extends keyof TEventMap>(
		type: TEventName,
		callback: CustomEventListener<TEventMap[TEventName]>,
	): void {
		const listeners = this.listenerMap.get(type);
		if (!listeners) {
			return;
		}

		listeners.splice(listeners.indexOf(callback), 1);
	}
}
