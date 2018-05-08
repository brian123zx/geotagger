const path = require('path');
const fs = require('fs');
const mkdirp = require('mkdirp');

const { fetchStoryline } = require('./fetchStoryline');

const getStoryline = (movesJSONPath, timestamp) => {
	return new Promise(function(res, rej) {
		var filename = `storyline_${timestamp.format('YYYYMMDD')}.json`;
		var jsonPath = path.join(movesJSONPath, filename);

		console.log(`reading file ${jsonPath}`);

		try {
			var json = fs.readFileSync(jsonPath);
		} catch(e) {
			if(!~e.message.indexOf('ENOENT')) return rej(e);

			console.error(`cannot read file ${jsonPath}`);

			const fetchPromise = fetchStoryline(timestamp);

			fetchPromise.then((storyline) => {
				// store to dir
				console.log(`writing file ${jsonPath}`);
				writeFile(jsonPath, JSON.stringify(storyline, null, 2));
			});

			return res(fetchPromise);
		}
		try {
			json = JSON.parse(json);
		} catch(e) {
			return rej(new Error(`Cannot parse json: ${jsonPath}`));
		}
		res(json);
	});
}

const writeFile = (writePath, data) => {
	const dir = path.dirname(writePath);
	// make directory if not exists
	if(!fs.existsSync(dir))
		mkdirp(dir);
	fs.writeFileSync(writePath, data);
};

module.exports = {
	getStoryline,
};