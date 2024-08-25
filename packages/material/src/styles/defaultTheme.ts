import createTheme from '@mui/material/styles/createTheme';

declare module '@mui/material' {
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	interface Components<Theme = unknown> {
		TextMessage: {};
	}
}

export const defaultTheme = createTheme({
	components: {
		TextMessage: {},
	},
});
