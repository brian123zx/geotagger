var argv = require('minimist')(process.argv.slice(2));
var Promise = require('bluebird');
var fs = Promise.promisifyAll(require('fs-extra'));
const exifUtil = require('./exif-util');
const moment = require('moment');
const path = require('path');
const geoTagger = require('./geo-tagger');
const geolib = require('geolib');

var movesJSONPath = argv.geodata;
var timeOffset = parseInt(argv.offset || 0);
var mode = argv.mode || 'write';
var overwrite = argv.overwrite || false;

console.log('geodata:', movesJSONPath);
console.log('offset:', timeOffset);
argv._.forEach(processImageInput);

function processImageInput(path) {
	fs.statAsync(path).then(function(stats) {
		var images;
		if(stats.isDirectory()) {
			images = fs.walkSync(path);
		} else {
			images = [path];
		}
		return images;
	})
	.map(processImage)
	.filter(function(l) {
		return !!l;
	})
	.then(function(offsets) {
		var avg = offsets.reduce(function(a, b) {
			return a + b;
		}, 0)/offsets.length;
		console.log('Average location offset:', avg);
		// console.log(JSON.stringify(locations, undefined, 2));
	});
}

function processImage(image) {
	// process image
	// get exif data
	try {
		var exifObj = exifUtil.read(image);
	} catch(e) { return }
	var timestamp = exifObj.Exif.DateTimeOriginal;
	if(!timestamp) {
		console.log(image, 'no timestamp');
		return;
	}
	timestamp = moment(timestamp, 'YYYY:MM:DD HH:mm:ss');
	// adjust by offset
	timestamp.add(timeOffset, 's');

	var originalLocation;
	originalLocation = exifUtil.getLocation(exifObj);
	// return originalLocation;

	return getLocationAtTime(timestamp).then(function(location) {
		var locationDiff;
		console.log(image, timestamp.toString(), `${location.lat},${location.lon}`, locationDiff = originalLocation ? geolib.getDistance(originalLocation, location, 1, 2) : '');

		if(mode === 'write' && (overwrite || !originalLocation)) {
			// write location to file
			console.log('writing');
			geoTagger(image, location.lat, location.lon);
		}
		return locationDiff;
	}).catch(function(e) {
		console.log(image,timestamp.toString(), e);
	});
}

function getLocationAtTime(time) {
	// get file name
	// expect file to be in format "storyline_YYYYMMDD.json"

	// find segment for time
	return new Promise(function(res, rej) {
		var filename = `storyline_${time.format('YYYYMMDD')}.json`;
		var jsonPath = path.join(movesJSONPath, filename)

		try {
			var json = fs.readFileSync(jsonPath);
		} catch(e) {
			return rej(`Cannot read file: ${jsonPath}`);
		}
		try {
			json = JSON.parse(json);
		} catch(e) {
			return rej(`Cannot parse json: ${jsonPath}`);
		}

		var storyline = json[0];
		var segments = storyline.segments;
		res(segments);
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
			lon: point.lon
		};
	});
}
