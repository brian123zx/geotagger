/**
 * Gets point with p.time closest to time
 * @param  {moment} time   Moment time
 * @param  {Array} points  Array of points with time to compare
 * @return {Object}        Object with point from Array input and timeDiff
 */
const getClosestPoint = (time, points) => {
	// find closest track point to time
	var point;
	var pointDiff;
	for(var p of points) {
		var d = Math.abs(time.diff(p.time));
		if(pointDiff === undefined || d < pointDiff) {
			pointDiff = d;
			point = p;
		}
	}
	return {
		point,
		timeDiff: pointDiff,
	};
}
export default getClosestPoint;
