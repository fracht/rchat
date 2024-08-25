import config from '@sirse-dev/eslint-config';

export default [
	{
		ignores: [
			'**/node_modules',
			'**/dist',
			'**/*.config.js',
			'**/*.test.js',
			'**/*.test.ts',
			'**/stories',
			'**/test',
			'**/prepared-package',
		],
	},
	...config,
	{
		rules: {
			'@typescript-eslint/no-empty-object-type': 'off',
		},
	},
];
