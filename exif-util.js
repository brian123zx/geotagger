var fs = require('fs');
const piexif = require('./piexif');

/**
 * @param  {string} path of file
 * @return {object} exif object with parsed keys
 */
function read(path) {
	const prefix = 'data:image/jpeg;base64,';
	// read file
	var jpg = fs.readFileSync(path, 'base64');
	// get exif data
	var exifObj = piexif.load(prefix + jpg);
	// parse into more readable object
	var readable = {};
	for (var ifd in exifObj) {
		if (ifd == "thumbnail") {
			continue;
		}
		readable[ifd] = {};
		for (var tag in exifObj[ifd]) {
			readable[ifd][piexif.TAGS[ifd][tag]["name"]] = exifObj[ifd][tag];
		}
	}
	return readable;
}

/**
 * @param  {object}
 * @return {object}
 */
function getLocation(exifObj) {
	if(!exifObj.GPS) return undefined;
	var lat, lon, deg, min, sec, ref;

	try {
		[deg, min, sec] = exifObj.GPS.GPSLatitude;
		ref = exifObj.GPS.GPSLatitudeRef;
		deg = deg[0]/deg[1];
		min = min[0]/min[1];
		sec = sec[0]/sec[1];
		lat = `${deg}° ${min}' ${sec}" ${ref}`;

		[deg, min, sec] = exifObj.GPS.GPSLongitude;
		ref = exifObj.GPS.GPSLongitudeRef;
		deg = deg[0]/deg[1];
		min = min[0]/min[1];
		sec = sec[0]/sec[1];
		lon = `${deg}° ${min}' ${sec}" ${ref}`;
	} catch(e) {
		return undefined;
	}

	return {
		lat,
		lon
	};
}



/**
 * @param  {object} exifObj  Object returned from piexif exif parser
 */
function print(exifObj) {
	for (var ifd in exifObj) {
		if (ifd == "thumbnail") {
			continue;
		}
		console.log("-" + ifd);
		for (var tag in exifObj[ifd]) {
			console.log("  " + piexif.TAGS[ifd][tag]["name"] + ":" + exifObj[ifd][tag]);
		}
	}
}

module.exports = {
	print,
	read,
	getLocation
};