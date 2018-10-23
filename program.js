import { defaults, extend } from 'lodash';
import config from './config';

var packageJSON = require('./package.json');
var program = require('commander');
const path = require('path');


const int = (val) => {
	return parseInt(val || 0);
};

program
	.version(packageJSON.version)
	.option('-g, --geodata [path]', 'Path to geodata directory')
	.option('-t, --offset [seconds]', 'Time offset in seconds', int)
	.option('-z, --offsetTimezone [hours]', 'Timezone offset in hours. Changes the timezone the image was recorded in', int)
	.option('-m, --mode [val]', 'The mode of operation. Defaut: write')
	.option('-o, --overwrite [bool]', 'Overwrites existing location metadata. Default: false')
	.parse(process.argv);

const cmdArgs = {
	movesJSONPath: program.geodata || path.resolve('./', 'storylines'),
	timeOffset: program.offset,
	timezoneOffset: program.offsetTimezone,
	mode: program.mode,
	overwrite: program.overwrite,
	args: program.args,
};
// apply program config from commandline on top of default config
const combined = defaults({}, cmdArgs, config);
extend(config, combined);
