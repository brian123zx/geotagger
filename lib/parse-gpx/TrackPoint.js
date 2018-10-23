class TrackPoint {
    constructor(el, lat, lng, time, heartrate, cadence, name) {
        this.elevation = el;
        this.latitude = lat;
        this.longitude = lng;
        this.timestamp = time;
        this.heartrate = heartrate;
        this.cadence = cadence;
        this.name = name;
    }
}

module.exports = TrackPoint;
