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
    routeOneName: {
        type: String,
        required: true
    },
    routeTwoName: {
        type: String
    },
    routeOneStops: [{
        number: String,
        name: String,
        _id: false
    }],
    routeTwoStops: [{
        number: String,
        name: String,
        _id: false
    }]
});

module.exports = mongoose.model('BusService', BusService);