var BusModel = require('./../model/api/busService');
var BusStopModel = require('./../model/api/busStop');
var log = require('./../log')(module);

module.exports = {
    getBuses: function (req, res) {
        var fields = req.query.fields || "";
        var sort = req.query.sort || "";
        var limit = req.query.limit || "";
        var skip = req.query.skip || "";
        var options = {
            sort: sort.split(',').join(' '),
            limit: limit,
            skip: skip
        };
        BusModel.find({}, fields.split(',').join(' '), options, function (err, buses) {
            if (!err) {
                return res.send(buses);
            } else {
                res.statusCode = 500;
                log.error('getBuses: Internal error(%d): %s', res.statusCode, err.message);
                return res.send({
                    error: 'Server error'
                });
            }
        });
    },
    getBusById: function (req, res) {
        var fields = req.query.fields || "";
        BusModel.findById(req.params.id, fields.split(',').join(' '), function (err, bus) {
            if (!bus) {
                res.statusCode = 404;
                return res.send({
                    error: 'Not found'
                });
            }
            if (!err) {
                return res.send(bus);
            } else {
                res.statusCode = 500;
                log.error('getBusById: Internal error(%d): %s', res.statusCode, err.message);
                return res.send({
                    error: 'Server error'
                });
            }
        })
    },
    getBusStops: function (req, res) {
        var fields = req.query.fields || "";
        var sort = req.query.sort || "";
        var limit = req.query.limit || "";
        var skip = req.query.skip || "";
        var options = {
            sort: sort.split(',').join(' '),
            limit: limit,
            skip: skip
        };
        var conditions = {};
        var search = req.query.q;
        if (search != undefined && search != "") {
            conditions = {$text: {$search: search}};
        }
        BusStopModel.find(conditions, fields.split(',').join(' '), options, function (err, stops) {
            if (!err) {
                return res.send(stops);
            } else {
                res.statusCode = 500;
                log.error('getBusStops: Internal error(%d): %s', res.statusCode, err.message);
                return res.send({
                    error: 'Server error'
                });
            }
        });
    },
    getBusStopsById: function (req, res) {
        var fields = req.query.fields || "";
        BusStopModel.findById(req.params.id, fields.split(',').join(' '), function (err, stop) {
            if (!stop) {
                res.statusCode = 404;
                return res.send({
                    error: 'Not found'
                });
            }
            if (!err) {
                return res.send(stop);
            } else {
                res.statusCode = 500;
                log.error('getBusStopsById: Internal error(%d): %s', res.statusCode, err.message);
                return res.send({
                    error: 'Server error'
                });
            }
        })
    }

};