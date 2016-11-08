const fs = require('fs');
const geolib = require('geolib');
const piexif = require('./piexif');


/**
 * Sets the latitude and longitude exif
 * info in an image at a specified path
 * @param {String}
 * @param {long}
 * @param {long}
 */
function setImageGPS(path, lat, lon) {
	var deg, min, sec;
	const prefix = 'data:image/jpeg;base64,';
	var jpg = fs.readFileSync(path, 'base64');
	var exifObj = piexif.load(prefix + jpg);

	var {deg, min, sec} = decimalToSexagesimal(lat);
	exifObj.GPS[piexif.GPSIFD.GPSLatitude] = [[deg,1],[min,1],[sec*100,100]];
	exifObj.GPS[piexif.GPSIFD.GPSLatitudeRef] = lat < 0 ? 'S' : 'N';

	var {deg, min, sec} = decimalToSexagesimal(lon);
	exifObj.GPS[piexif.GPSIFD.GPSLongitude] = [[deg,1],[min,1],[sec*100,100]];
	exifObj.GPS[piexif.GPSIFD.GPSLongitudeRef] = lon < 0 ? 'W' : 'E';

	jpg = writeExif(exifObj, prefix + jpg);
	fs.writeFileSync(path, jpg.substring(prefix.length), {encoding: 'base64'});
}

function writeExif(exifObj, jpg) {
	return piexif.insert(piexif.dump(exifObj), jpg);
}

function decimalToSexagesimal(dec) {
	var deg, min, sec;
	const sexagesimalRegex = /^(\d{1,3})°\ (\d{1,3})'\ ([\d.]+)"$/;
	[,deg, min, sec] = sexagesimalRegex.exec(geolib.decimal2sexagesimal(dec));
	return {
		deg,
		min,
		sec
	};
}


module.exports = setImageGPS;