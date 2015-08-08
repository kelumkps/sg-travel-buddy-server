var mongoose = require('mongoose');
var textSearch = require('mongoose-text-search');

var Schema = mongoose.Schema;

var BusStop = new Schema({
    _id: {
        type: String,
        required: true
    },
    name: {
        type: String,
        required: true,
        index: true
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

BusStop.plugin(textSearch);

BusStop.index({location: '2dsphere'});
BusStop.index({_id: 'text', name: 'text'});

module.exports = mongoose.model('BusStop', BusStop);