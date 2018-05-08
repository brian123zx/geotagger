const request = require('request-promise-native');
const movesAuth = require('./movesAuth.json');

const fetchStoryline = (timestamp) => {
	const date = timestamp.format('YYYYMMDD');
	const url = `https://api.moves-app.com/api/1.1/user/storyline/daily/${date}?trackPoints=true&access_token=${movesAuth.access_token}`;
	console.log(`fetching storyline for ${date} from moves-app`);
	return request.get(url)
	.then((data) => {
		// console.log('DATA!!!', data, typeof data);
		console.log(`fetched storyline`);
		return JSON.parse(data);
	});
};

module.exports = {
	fetchStoryline,
};