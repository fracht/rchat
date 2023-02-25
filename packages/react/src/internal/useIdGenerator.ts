import { useCallback, useRef } from 'react';

export const useIdGenerator = (): (() => string) => {
	const counter = useRef(0);

	return useCallback(() => `:rchat:-${++counter.current}`, []);
};
