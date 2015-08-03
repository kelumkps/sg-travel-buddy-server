var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var Route = new Schema({
    path: {
        type: {
            type: String,
            default: 'LineString'
        },
        coordinates: [Schema.Types.Mixed]
    },
    busStops: [String],
    distanceLimit: {
        type: Number,
        default: 500
    },
    userId: {
        type: String,
        index: true
    },
    created: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Route', Route);