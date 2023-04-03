const { danger, fail } = require('danger');
const path = require('path');

const changesetsDir = path.resolve('./.changeset');
const isChangeset = (file) => {
	return path.dirname(path.resolve(file)) === changesetsDir && path.extname(file) === '.md';
};

const createdPaths = danger.git.created_files;
const changesets = createdPaths.filter(isChangeset);

if (changesets.length === 0) {
	fail('No changesets has been added in you pull request!');
}
