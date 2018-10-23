var Promise = require('bluebird');
var fs = Promise.promisifyAll(require('fs-extra'));
const exifUtil = require('./exif-util');
const moment = require('moment');
const path = require('path');
const geoTagger = require('./geo-tagger');
const geolib = require('geolib');
const { parseLatLon } = require('./utils');
const { exiftool, init, close } = require('./exiftool');
const { getStoryline } = require('./getStoryline');
const { getLocationAtTime } = require('./lib/geodataParser/arc');
const config = require('./config').default;
console.log(config);

var {
	movesJSONPath,
	timeOffset,
	timezoneOffset,
	mode,
	overwrite,
	args,
} = config;

console.log('geodata:', movesJSONPath);
console.log('offset:', timeOffset);

init()

	.then(() => {
		const promises = config.args.map((path) => processImageInput(path));
		const p = Promise.all(promises);
		return p;
	})

	.catch(console.error)
	.then(() => console.log('closing now!'))
	.then(() => close())
	.then(() => console.log('ALL DONE!!!'));

function processImageInput(path) {
	return new Promise((res, rej) => {
		// get array of image paths
		fs.statAsync(path).then(function(stats) {
			var images;
			if(stats.isDirectory()) {
				images = fs.walkSync(path);
			} else {
				images = [path];
			}
			return images;
		})
		// .map((img) => {
		// 	console.log(img);
		// 	const exiftool = require('node-exiftool');
		// 	const exiftoolbin = require('dist-exiftool');
		// 	const ep = new exiftool.ExiftoolProcess(exiftoolbin);
		// 	return ep
		// 		.open()
		// 		.then((pid) => console.log('Started exiftool process %s', pid))
		// 		.then(() => ep.readMetadata(img))
		// 		.then((data) => {
		// 			console.log(data);
		// 			return ep.writeMetadata(img, {
		// 				GPSLatitude: `33 deg 50' 56.66" S`,
		// 				GPSLongitude: `151 deg 12' 38.10" E`,
		// 				GPSLatitudeRef: `South`,
		// 				GPSLongitudeRef: `East`,
		// 			}, ['overwrite_original']);
		// 		})
		// 		.catch(console.error)
		// 		.then(() => ep.close())
		// 		.catch(console.error)
		// 		.then(() => img);
		// })
		.mapSeries(processImage)
		.filter(function(l) {
			return !!l;
		})
		.then(function(offsets) {
			var avg = offsets.reduce(function(a, b) {
				return a + b;
			}, 0)/offsets.length;
			console.log('Average location offset:', avg);
			// console.log(JSON.stringify(locations, undefined, 2));
		})
		.then(res)
		.catch((e) => {
			console.error(e)
			rej(e);
		});
	});
}

function processImage(image) {
	// process image
	// get exif data
	// try {
	// 	var exifObj = exifUtil.read(image);
	// 	var exifObj = exiftool.readMetadata(image)
	// } catch(e) { return }

	// return originalLocation;
	let timestamp;
	let originalLocation;
	let exifData;
	let locationDiff;
	let writeObj = {};
	return Promise.resolve()
		.then(() => {
			console.log(image);
			const m = exiftool.readMetadata(image);
			// console.log(m);
			return m;
		})
		// .catch((e) => console.error('oh no', e))
		.then(({data:[data]}) => {
			// console.log(data);
			exifData = data;
			if(mode === 'read')
				console.log(JSON.stringify(exifData));
			timestamp = data.DateTimeOriginal;
			const timezone = data.OffsetTimeOriginal;
			if(!timestamp) {
				console.error(image, 'no timestamp');
				throw new Error('no timestamp');
			}
			console.log(`Read timestamp: ${timestamp}`);
			timestamp = moment(`${timestamp} ${timezone}`, 'YYYY:MM:DD HH:mm:ss Z');
			// adjust by offset
			console.log(`Read timezone: ${timezone}`);
			console.log(`Read timestamp (local): ${timestamp.format('YYYY:MM:DD HH:mm:ss Z')}`);

			timestamp.add(timeOffset, 's');

			console.log(`Check timestamp (local): ${timestamp.format('YYYY:MM:DD HH:mm:ss Z')}`);
			// throw new Error('exiting early');
			if(data.GPSLatitude)
				originalLocation = {
					lat: data.GPSLatitude.replace(' deg', '°'),
					lon: data.GPSLongitude.replace(' deg', '°'),
				};
			return timestamp
		})
		.then((timestamp) => getLocationAtTime(timestamp))
		.then(function(location) {
			console.log(originalLocation, location);
			console.log(image, timestamp.toString(), `${location.lat},${location.lon}`, locationDiff = originalLocation ? geolib.getDistance(originalLocation, location, 1, 2) : '');

			writeObj = parseLatLon(location.lat, location.lon);
		})
		.catch((e) =>{
			console.log('Failed to get location information', e);
		})
		.then(() => {
			if(timezoneOffset) {
				try {
					let offsetTime = exifData.OffsetTime;
					// console.log(offsetTime);
					offsetTime = parseInt(offsetTime);
					// console.log(offsetTime);
					offsetTime += timezoneOffset;
					// console.log(offsetTime);
					offsetTime = `${offsetTime >= 0 ? '+' : ''}${offsetTime}`;
					timestamp.utcOffset(offsetTime);
					console.log(timestamp.format('YYYY:MM:DD HH:mm:ss Z'));
					writeObj.OffsetTimeOriginal = `${offsetTime}:00`;
					writeObj.OffsetTimeDigitized = `${offsetTime}:00`;
				} catch(e) {}
			}
			if(timezoneOffset || timeOffset) {
				writeObj.DateTimeOriginal = timestamp.format('YYYY:MM:DD HH:mm:ss');
			}
			console.log(JSON.stringify(writeObj, undefined, 2));
			// return Promise.resolve();



			// return locationDiff;
		})
		.then(() => {
			if(!Object.keys(writeObj).length) return;

			// write location to file
			if(mode === 'write' && (overwrite || !originalLocation)) {
				console.log('writing');
				return Promise.resolve()
					.then(() => exiftool.writeMetadata(image, writeObj, ['overwrite_original']));
				// geoTagger(image, location.lat, location.lon);
			} else {
				console.warn('skipping');
			}
		})
		.then(() => locationDiff)
		.catch(function(e) {
			console.error(e);
			// throw e;
			// console.log(image,timestamp.toString(), e);
		});
}


