const xml2js = require('xml2js');
const fs = require('fs');
const parseTrack = require('./parseTrack');

module.exports = (filename) => {

    return new Promise((res, rej) => {
        fs.readFile(filename,'utf8', (err, data) => {
            if(err) {
                rej(err);
                return;
            }

            let parser = new xml2js.Parser();
            parser.parseString(data, (err, xml) => {
                if(err) {
                    rej(err);
                } else {
                    // console.log(xml.gpx.trk)
                    res(parseTrack(xml.gpx));
                }
            });
        });
    });
};