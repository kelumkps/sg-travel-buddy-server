var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var Ping = new Schema({
    created: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Ping', Ping);