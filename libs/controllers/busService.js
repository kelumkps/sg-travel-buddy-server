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
            if (err) return sendServerErrorResponse(res, err);
            return res.send(buses);
        });
    },
    getBusById: function (req, res) {
        var fields = req.query.fields || "";
        BusModel.findById(req.params.id, fields.split(',').join(' '), function (err, bus) {
            if (err) return sendServerErrorResponse(res, err);
            if (!bus) {
                res.statusCode = 404;
                return res.send({
                    error: 'Not found'
                });
            }
            return res.send(bus);
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
            if (err) return sendServerErrorResponse(res, err);
            return res.send(stops);
        });
    },
    getBusStopsById: function (req, res) {
        var fields = req.query.fields || "";
        BusStopModel.findById(req.params.id, fields.split(',').join(' '), function (err, stop) {
            if (err) return sendServerErrorResponse(res, err);
            if (!stop) {
                res.statusCode = 404;
                return res.send({
                    error: 'Not found'
                });
            }
            return res.send(stop);
        })
    },
    getBusStopsByBusId: function (req, res) {
        var fields = req.query.fields || "";
        var busId = req.params.id;
        BusModel.findById(busId, function (err, bus) {
            if (err) return sendServerErrorResponse(res, err);
            if (!bus) {
                res.statusCode = 404;
                return res.send({
                    error: 'Bus Id is not found'
                });
            }
            BusStopModel.find({'_id': {$in: bus.routeOneStops}}, fields.split(',').join(' '), function (err, stops) {
                if (err) return sendServerErrorResponse(res, err);

                var result = {
                    "_id": bus._id,
                    "routes": bus.routes,
                    "type": bus.type,
                    "operator": bus.operator,
                    "name": bus.name,
                    "routeOneStops": stops
                };
                if (bus.routes == 2) {
                    BusStopModel.find({'_id': {$in: bus.routeTwoStops}}, fields.split(',').join(' '), function (err, stops) {
                        if (err) return sendServerErrorResponse(res, err);
                        result['routeTwoStops'] = stops;
                        return res.send(result);
                    });
                } else {
                    return res.send(result);
                }
            });
        })
    }
};

function sendServerErrorResponse(res, err) {
    res.statusCode = 500;
    log.error('Internal error(%d): %s', res.statusCode, err.message);
    return res.send({
        error: 'Server error'
    });
}