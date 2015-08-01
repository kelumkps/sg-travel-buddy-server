var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var BusService = new Schema({
    _id: {
        type: String,
        required: true
    },
    routes: {
        type: Number,
        required: true
    },
    type: {
        type: String,
        required: true
    },
    operator: {
        type: String,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    routeOneStops: [String],
    routeTwoStops: [String]
});

module.exports = mongoose.model('BusService', BusService);