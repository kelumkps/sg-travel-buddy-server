var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var BusStop = new Schema({
    number: {
        type: String,
        unique: true,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    location: {
        type: {
            type: String,
            default: 'Point'
        },
        coordinates: [Number]
    },
    busServices: [String]
});

BusStop.index({ location : '2dsphere' });

module.exports = mongoose.model('BusStop', BusStop);