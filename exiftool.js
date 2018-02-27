const fs = require('fs');
const geolib = require('geolib');
const piexif = require('./piexif');

const exiftool = require('node-exiftool');
const exiftoolbin = require('dist-exiftool');
const ep = new exiftool.ExiftoolProcess(exiftoolbin);

const { decimalToSexagesimal } = require('./utils');

/**
 * Sets the latitude and longitude exif
 * info in an image at a specified path
 * @param {String}
 * @param {long}
 * @param {long}
 */
function setImageGPS(path, lat, lon) {
	var deg, min, sec;

	var latitude = decimalToSexagesimal(lat);
	var longitude = decimalToSexagesimal(lon);

	return ep.writeMetadata(img, {
			GPSLatitude: `${latitude.deg} deg ${latitude.min}' ${floor(latitude.sec*100)/100}" ${latitude.deg < 0 ? 'S' : 'N'}`,
			GPSLongitude: `${longitude.deg} deg ${longitude.min}' ${floor(longitude.sec*100)/100}" ${longitude.deg < 0 ? 'W' : 'E'}`,
			GPSLatitudeRef: latitude.deg < 0 ? 'South' : 'North',
			GPSLongitudeRef: longitude.deg < 0 ? 'West' : 'East',
		}, ['overwrite_original']);
}

function close() {
	return ep.close();
}

function init() {
	return ep.open();
}


module.exports = {
	setImageGPS,
	close,
	exiftool: ep,
	init,
};
