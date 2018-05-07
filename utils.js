const geolib = require('geolib');
const parseLatLon = (lat, lon) => {
	var deg, min, sec;

	var latitude = decimalToSexagesimal(lat);
	var longitude = decimalToSexagesimal(lon);

	return {
		GPSLatitude: `${latitude.deg} deg ${latitude.min}' ${Math.floor(latitude.sec*100)/100}" ${lat < 0 ? 'S' : 'N'}`,
		GPSLongitude: `${longitude.deg} deg ${longitude.min}' ${Math.floor(longitude.sec*100)/100}" ${lon < 0 ? 'W' : 'E'}`,
		GPSLatitudeRef: lat < 0 ? 'South' : 'North',
		GPSLongitudeRef: lon < 0 ? 'West' : 'East',
	};
};
const decimalToSexagesimal = (dec) => {
	var deg, min, sec;
	const sexagesimalRegex = /^(\d{1,3})°\ (\d{1,3})'\ ([\d.]+)"$/;
	[,deg, min, sec] = sexagesimalRegex.exec(geolib.decimal2sexagesimal(dec));
	return {
		deg,
		min,
		sec
	};
};
module.exports = {
	parseLatLon,
	decimalToSexagesimal,
}