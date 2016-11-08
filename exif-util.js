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
	read
};