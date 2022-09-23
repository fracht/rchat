import { useCallback, useRef } from 'react';

export const useToggleEvent = (onTurnedOn: () => void): ((value: boolean) => void) => {
	const value = useRef(false);

	const toggle = useCallback(
		(newValue: boolean) => {
			if (!value.current && newValue) {
				onTurnedOn();
			}

			value.current = newValue;
		},
		[onTurnedOn],
	);

	return toggle;
};
