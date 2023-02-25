/**
 * @type {import('ts-jest').JestConfigWithTsJest}
 */
module.exports = {
	transformIgnorePatterns: ["[/\\\\]node_modules[/\\\\].+\\.(js|cjs|jsx)$'"],
	preset: 'ts-jest/presets/js-with-babel',
	moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'cjs', 'mjs', 'json', 'node'],
	collectCoverageFrom: ['src/**/*.{ts,tsx,js,jsx,cjs,mjs}'],
	testMatch: ['<rootDir>/**/*.(spec|test).{ts,tsx,js,jsx,cjs,mjs}'],
	testEnvironmentOptions: {
		url: 'http://localhost',
	},
	testEnvironment: 'jsdom',
	watchPlugins: ['jest-watch-typeahead/filename', 'jest-watch-typeahead/testname'],
};
