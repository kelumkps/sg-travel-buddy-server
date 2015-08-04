var routeService = require('./routeService');
var BusStopModel = require('./../model/api/busStop');
var log = require('./../log')(module);

module.exports = {
    createRoute: function (req, res) {
        log.info('Start creating a new route');
        if (!req.body.coordinates) return res.send(400, {error: "Bad Request", message: "Missing Coordinates"});

        var route = {
            coordinates: req.body.coordinates
        };
        if (req.user) route['userId'] = req.user.userId;
        if (req.body.busStops) route['busStops'] = req.body.busStops;

        routeService.createRoute(route, function (err, route) {
            if (err) return sendServerErrorResponse(res, err);
            return res.send(route);
        });
    },
    updateRoute: function (req, res) {
        var route = {
            _id: req.params.id
        };
        if (req.body.busStops) route['busStops'] = req.body.busStops;
        if (req.body.coordinates) route['coordinates'] = req.body.coordinates;

        if (route.coordinates) {
            routeService.findRouteById(route._id, 'distanceLimit', function (err, rt) {
                if (err) return sendServerErrorResponse(res, err);
                if (!rt) return res.(404, {error: 'Not found'});
                var query = {};
                query.location = {
                    $near: {
                        $geometry: {
                            type: "Point",
                            coordinates: route.coordinates
                        },
                        $maxDistance: rt.distanceLimit
                    }
                };
                BusStopModel.find(query, "_id", {sort: "_id"}, function (err, stops) {
                    if (err) return sendServerErrorResponse(res, err);
                    if (!stops) stops = [];
                    res.send(200, stops);
                    routeService.updateRoute(route, function (err) {
                        if (err) log.error('Error while updating route', route, err);
                    });
                });

            });
        } else if (route.busStops) {
            routeService.updateRoute(route, function (err, route) {
                if (err) return sendServerErrorResponse(res, err);
                return res.send(200, route);
            });
        } else {
            res.send(400, {error: "Bad Request", message: "Missing Coordinates or Bus Stops"});
        }
    }

};

function sendServerErrorResponse(res, err) {
    res.statusCode = 500;
    log.error('Internal error(%d): %s', res.statusCode, err.message);
    return res.send({
        error: 'Server error'
    });
};