import path from 'path';
import { compact, map, sortBy, sortedIndexBy } from 'lodash';
import moment from 'moment';
import config from '../../config';
import parseGpx from '../parse-gpx';
import getClosestPoint from '../getClosestPoint';
import { parseLatLon } from '../../utils';
// import geolib from 'geolib';

const { arcPath } = config;

/**
 * Uses Arc geodata to return coordinates at a given timestamp
 * @param  {Moment} timestamp Moment timestamp
 * @return {object}           object with keys lat, lon, timeDiff
 */
export const getLocationAtTime = timestamp => Promise.resolve().then(() => {
	return getArcFile(timestamp)
		.then(points => {
			const sorted = sortBy(points, p => moment(p.timestamp).valueOf());
			// console.log(points.length);
			// console.log(timestamp.toString());
			// sorted.map(p => {
			// 	console.log(p.timestamp);
			// })

			const insertIndex = sortedIndexBy(sorted, { timestamp }, o => moment(o.timestamp).valueOf())
			// console.log(insertIndex);

			const compareArray = map(compact([
				sorted[insertIndex-1],
				sorted[insertIndex],
				sorted[insertIndex+1]
			]), o => {
				o.time = o.timestamp;
				return o;
			});

			const closestPoint = getClosestPoint(timestamp, compareArray);
			// console.log('closest point', closestPoint);
			if(!closestPoint) throw new Error('No point found');
			// const sg = parseLatLon(closestPoint.point.latitude, closestPoint.point.longitude);
			// console.log(sg.fullString);
			return {
				lat: Number(closestPoint.point.latitude),
				lon: Number(closestPoint.point.longitude),
				timeDiff: Math.abs(moment(timestamp).diff(closestPoint.point.time)),
			}
		});
});

const getArcFile = (timestamp) => Promise.resolve().then(() => {
	const fileName = `${timestamp.format('YYYY-MM-DD')}.gpx`;
	const filePath = path.join(arcPath, fileName);
	return parseGpx(filePath);
});