var argv = require('minimist')(process.argv.slice(2));
var Promise = require('bluebird');
var fs = Promise.promisifyAll(require('fs-extra'));
const exifUtil = require('./exif-util');
const moment = require('moment');
const path = require('path');
const geoTagger = require('./geo-tagger');

var movesJSONPath = argv.geodata;
var timeOffset = parseInt(argv.offset || 0);

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
	.each(function(image) {
		// process image
		// console.log(image);
		// get exif data
		var exifObj = exifUtil.read(image);
		// console.log(exifUtil.read(image));
		// return;
		var timestamp = exifObj.Exif.DateTimeOriginal;
		if(!timestamp) {
			console.log(image, 'no timestamp');
			return;
		}
		timestamp = moment(timestamp, 'YYYY:MM:DD HH:mm:ss');
		// adjust by offset
		timestamp.add(timeOffset, 's');
		// console.log(timestamp.toString());
		// var location = getLocationAtTime(timestamp);
		return getLocationAtTime(timestamp).then(function(location) {
			console.log(image, timestamp.toString(), location);
			// write location to file
			geoTagger(image, location.lat, location.lon);
		}).catch(function(e) {
			console.log(image,timestamp.toString(), e);
		});
	});
}

function getLocationAtTime(time) {
	// get file name
	// expect file to be in format "storyline_YYYYMMDD.json"

	// find segment for time
	return new Promise(function(res, rej) {
		var filename = `storyline_${time.format('YYYYMMDD')}.json`;
		var jsonPath = path.join(movesJSONPath, filename)
		// console.log(jsonPath);

		try {
			var json = fs.readFileSync(jsonPath);
			json = JSON.parse(json);
			// console.log(json.length);
		} catch(e) {
			return rej('no file or invalid json');
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
		if(!activity || !activity.trackPoints || !activity.trackPoints.length)
			return segment.place.location;

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

return;









// test stuff!

// grab file and turn to geojson

const togeojson = require('togeojson');
const geolib = require('geolib');


var DOMParser = require('xmldom').DOMParser;

var kml = new DOMParser().parseFromString(fs.readFileSync('/Users/brian/Downloads/moves_export/kml_ge/daily/activities/activities_20161105.kml', 'utf8'));

// var kml = fs.readFileSync('/Users/brian/Downloads/moves_export/kml_ge/daily/activities/activities_20161105.kml');

var geojson = togeojson.kml(kml);

var feature = geojson.features[0];
var coordinates = feature.geometry.coordinates;
var times = feature.properties.coordTimes;
// console.log(feature);

const piexif = require('./piexif');

// read file
var jpg = fs.readFileSync('/Users/brian/Desktop/images/E0790E3D-E809-4E6D-BD82-26F796F7B0AF.JPG', 'base64');
// console.log(jpg.substring(0, 100));
var exifObj = piexif.load('data:image/jpeg;base64,' + jpg);
printExif(exifObj);

// write new exif gps
var newExif = exifObj;
newExif.GPS[piexif.GPSIFD.GPSLatitude] = [[1,1],[1,1],[1,1]];
newExif.GPS[piexif.GPSIFD.GPSLongitude] = [[1,1],[1,1],[1,1]];

jpg = writeExif(newExif, 'data:image/jpeg;base64,' + jpg);
console.log('--------------');
printExif(piexif.load(jpg));

// write to file
fs.writeFileSync('/Users/brian/Desktop/images/E0790E3D-E809-4E6D-BD82-26F796F7B0AF-modified.JPG', jpg.substring(23), {encoding: 'base64'});

function writeExif(exifObj, jpg) {
	return piexif.insert(piexif.dump(newExif), jpg);
};



