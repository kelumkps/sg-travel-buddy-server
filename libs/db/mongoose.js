var mongoose = require('mongoose');
var log = require('./../log')(module);
var config = require('./../config');

var mongoURL = config.get('mongoose:uri');
var mongoURLLabel = ""

if (process.env.OPENSHIFT_MONGODB_DB_URL || process.env.MONGO_URL || process.env.DATABASE_SERVICE_NAME) {
    mongoURL = process.env.OPENSHIFT_MONGODB_DB_URL || process.env.MONGO_URL;
    if (mongoURL == null && process.env.DATABASE_SERVICE_NAME) {
      var mongoServiceName = process.env.DATABASE_SERVICE_NAME.toUpperCase(),
          mongoHost = process.env[mongoServiceName + '_SERVICE_HOST'],
          mongoPort = process.env[mongoServiceName + '_SERVICE_PORT'],
          mongoDatabase = process.env[mongoServiceName + '_DATABASE'],
          mongoPassword = process.env[mongoServiceName + '_PASSWORD']
          mongoUser = process.env[mongoServiceName + '_USER'];

      if (mongoHost && mongoPort && mongoDatabase) {
        mongoURLLabel = mongoURL = 'mongodb://';
        if (mongoUser && mongoPassword) {
          mongoURL += mongoUser + ':' + mongoPassword + '@';
        }
        // Provide UI label that excludes user id and pw
        mongoURLLabel += mongoHost + ':' + mongoPort + '/' + mongoDatabase;
        mongoURL += mongoHost + ':' +  mongoPort + '/' + mongoDatabase;
      }
    }
}

mongoose.connect(mongoURL);

var db = mongoose.connection;

db.on('error', function (err) {
    log.error('connection error:', err.message);
});
db.once('open', function callback() {
    log.info("Connected to DB!", mongoURLLabel);
});

module.exports = mongoose;
