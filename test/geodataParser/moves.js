import {assert} from 'chai';
import moment from 'moment';
import { parseLatLon } from '../../utils';

import { getLocationAtTime } from '../../lib/geodataParser/moves';

const ts = moment('2017:12:25 13:42:40 +11:00', 'YYYY:MM:DD HH:mm:ss Z');

describe('geodataParser: moves', () => {
	it('resolves correctly', () => {
		return assert.eventually.deepEqual(getLocationAtTime(ts)
			.then(point => {
				// const sg = parseLatLon(point.lat, point.lon);
				// console.log('move string', sg.fullString);
				return point;
			}), {
			lat: -37.816267,
			lon: 144.95301
		});
	});
});