import config from '../../config';
const path = require('path');
const fs = require('fs');
const mkdirp = require('mkdirp');
const request = require('request-promise-native');
const movesAuth = require('../../movesAuth.json');
const { movesJSONPath } = config;

/**
 * Uses Arc geodata to return coordinates at a given timestamp
 * @param  {Moment} timestamp Moment timestamp
 * @return {object}           object with keys lat, lon, timeDiff
 */
export const getLocationAtTime = time => {
	// get file name
	// expect file to be in format "storyline_YYYYMMDD.json"

	// find segment for time
	return getStoryline(movesJSONPath, time).then((json) => {
		var storyline = json[0];
		var segments = storyline.segments;
		return segments;
	}).then(function(segments) {
		// find segment with time
		for(var s of segments) {
			if(time.isBetween(s.startTime, s.endTime))
				return s;
		}
	}).then(function(segment) {
		if(!segment) throw 'no valid segment';

		if(!segment.place && !segment.activities)
			throw 'no location data in segment';

		// explore activities for the segment
		if(!segment.activities) {
			// return segments place data
			return segment.place.location;
		}

		var activity;
		for(var a of segment.activities) {
			if(time.isBetween(a.startTime, a.endTime)) {
				activity = a;
				break;
			}
		}
		// possible to be inside a place, but not inside an activity
		if(!activity || !activity.trackPoints || !activity.trackPoints.length) {
			if(!segment.place) throw 'no place data';
			return segment.place.location;
		}

		// find closest track point to time
		var point;
		var pointDiff;
		for(var p of activity.trackPoints) {
			var d = Math.abs(time.diff(p.time));
			if(pointDiff === undefined || d < pointDiff) {
				pointDiff = d;
				point = p;
			}
		}
		return {
			lat: point.lat,
			lon: point.lon,
			// timeDiff: pointDiff,
		};
	});
}

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


const fetchStoryline = (timestamp) => {
	const date = timestamp.format('YYYYMMDD');
	const url = `https://api.moves-app.com/api/1.1/user/storyline/daily/${date}?trackPoints=true&access_token=${movesAuth.access_token}`;
	console.log(`fetching storyline for ${date} from moves-app`);
	return request.get(url)
	.then((data) => {
		// console.log('DATA!!!', data, typeof data);
		console.log(`fetched storyline`);
		return JSON.parse(data);
	});
};
