var mongoose = require('mongoose');
var log = require('./../log')(module);
var config = require('./../config');

var mongoConnectionUrl = config.get('mongoose:uri');

if (process.env.OPENSHIFT_MONGODB_DB_URL) {
    mongoConnectionUrl = process.env.OPENSHIFT_MONGODB_DB_URL +
        process.env.OPENSHIFT_APP_NAME;
} else if (process.env.OPENSHIFT_MONGODB_DB_PASSWORD) {
    mongoConnectionUrl = 'mongodb://' + process.env.OPENSHIFT_MONGODB_DB_USERNAME + ":" +
        process.env.OPENSHIFT_MONGODB_DB_PASSWORD + "@" +
        process.env.OPENSHIFT_MONGODB_DB_HOST + ':' +
        process.env.OPENSHIFT_MONGODB_DB_PORT + '/' +
        process.env.OPENSHIFT_APP_NAME;
}

mongoose.connect(mongoConnectionUrl);

var db = mongoose.connection;

db.on('error', function (err) {
    log.error('connection error:', err.message);
});
db.once('open', function callback() {
    log.info("Connected to DB!");
});

module.exports = mongoose;