const { danger, fail } = require('danger');
const path = require('path');

const changesetsDir = path.resolve('./.changeset');
const isChangeset = (file) => {
	const relative = path.relative(changesetsDir, file);
	return relative && !relative.startsWith('..') && !path.isAbsolute(relative);
};

const createdPaths = danger.git.created_files;
const changesets = createdPaths.filter(isChangeset);

if (changesets.length === 0) {
	fail('No changesets has been added in you pull request!');
}
