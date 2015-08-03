var routeService = require('./routeService');
var BusStopModel = require('./../model/api/busStop');
var log = require('./../log')(module);

// export function for listening to the socket
module.exports = function (socket) {
    log.info('A new client is connected');

    socket.emit('init', {
        message: 'Greetings from SG Travel Buddy!'
    });

    socket.on('routes:create', function (data) {
        if (!data.coordinates) {
            socket.emit('routes:error', {error: "routes:create", message: "Bad Request: Missing Coordinates"});
        } else {
            var route = {
                coordinates: req.body.coordinates
            };
            if (data.userId) route['userId'] = data.userId;
            if (data.busStops) route['busStops'] = data.busStops;

            routeService.createRoute(route, function (err, route) {
                if (err) {
                    socket.emit('routes:error', {error: "routes:create", message: err.message});
                } else {
                    socket.emit('routes:create', route);
                }
            });
        }
    });

    socket.on('routes:update', function (data) {
        var route = {
            _id: data.id
        };
        if (data.busStops) route['busStops'] = data.busStops;
        if (data.coordinates) route['coordinates'] = data.coordinates;
        if (route.coordinates) {
            routeService.findRouteById(route._id, 'distanceLimit', function (err, rt) {
                if (err) socket.emit('routes:error', {error: "routes:update", message: err.message});
                if (!rt) socket.emit('routes:error', {error: "routes:update", message: "Route Not Found"});

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
                    if (err) socket.emit('routes:error', {error: "routes:update", message: err.message});
                    if (stops) socket.emit('routes:geoNear', stops);

                    routeService.updateRoute(route, function (err) {
                        if (err) log.error('Error while updating route', route, err);
                    });
                });

            });
        } else if (route.busStops) {
            routeService.updateRoute(route, function (err) {
                if (err) socket.emit('routes:error', {error: "routes:update", message: err.message});
            });
        } else {
            socket.emit('routes:error', {
                error: "routes:update",
                message: "Bad Request: Missing Coordinates or Bus Stops"
            });
        }
    });


    // clean up when a user leaves, and broadcast it to other users
    socket.on('disconnect', function () {
        log.info('A new client is disconnected');
    });
};
