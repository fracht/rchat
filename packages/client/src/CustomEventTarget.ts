export type CustomEventMap = Record<string, unknown>;

export interface CustomEventListener<T> {
	(event: CustomEvent<T>): void;
}

export class CustomEventTarget<TEventMap extends CustomEventMap> {
	private readonly eventTarget: EventTarget;

	public constructor() {
		this.eventTarget = new EventTarget();
	}

	public dispatchEvent(event: CustomEvent<TEventMap[keyof TEventMap]>): boolean {
		return this.eventTarget.dispatchEvent(event);
	}

	public addEventListener<TEventName extends keyof TEventMap>(
		type: TEventName,
		callback: CustomEventListener<TEventMap[TEventName]> | null,
		options?: AddEventListenerOptions | boolean,
	): void {
		this.eventTarget.addEventListener(type as string, callback as EventListener, options);
	}

	public removeEventListener<TEventName extends keyof TEventMap>(
		type: TEventName,
		callback: CustomEventListener<TEventMap[TEventName]> | null,
		options?: EventListenerOptions | boolean,
	): void {
		this.eventTarget.removeEventListener(type as string, callback as EventListener, options);
	}
}
