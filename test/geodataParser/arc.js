import {assert} from 'chai';
import moment from 'moment';

import { getLocationAtTime } from '../../lib/geodataParser/arc';

const ts = moment('2018:10:21 12:30:40 -07:00', 'YYYY:MM:DD HH:mm:ss Z');

describe('geodataParser: arc', () => {
	it('resolves correctly', () => {
		return assert.eventually.deepEqual(getLocationAtTime(ts), {
			lat: 37.76916776279181,
			lon: -122.435996604631,
			timeDiff: 1556000,
		});
	});
});