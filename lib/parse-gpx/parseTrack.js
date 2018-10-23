const TrackPoint = require('./TrackPoint');

const mapTrackPoint = t => {
  // console.log(t);
  var elevation = t.ele[0],
      lat = t['$'].lat,
      lng = (t['$'].lng || t['$'].lon),
      timestamp = t.time[0],
      name = t.name && t.name[0],
      hr,
      cadence;

  if(t.extensions) {
    var extensions = t.extensions[0];
    for(var k in extensions) {
      var extension = extensions[k][0];

      // Strava exports gpx
      if(typeof extension === 'object') {
        for(var k2 in extension) {
          if(k2.indexOf('hr') > -1) {
            hr = extension[k2][0];
          }
          if(k2.indexOf('cadence') > -1) {
            cadence = extension[k2][0];
          }
        }
      } else {
          // topografix gpx
          if(k.indexOf('hr') > -1) {
            hr = extension;
          }

          if(k.indexOf('cadence') > -1) {
            cadence = extension;
          }
      }
    }
  }

  return new TrackPoint(elevation, lat, lng, timestamp, hr, cadence, name);
}

const parseTrack = gpx =>  {
  const points = [];
  gpx.trk.forEach(t => {
    t.trkseg.forEach(ts => {
      if(!ts || !Array.isArray(ts.trkpt)) return;
      ts.trkpt.forEach(tp => {
        points.push(mapTrackPoint(tp));
      });
    });
  });
  gpx.wpt.forEach(wp => {
    points.push(mapTrackPoint(wp));
  })
  return points;
};

module.exports = parseTrack;
