var fs = require("fs");
var async = require("async");
var log = require('./../libs/log')(module);
var mongoose = require('./../libs/db/mongoose').mongoose;

var UserModel = require('./../libs/model/auth/user');
var ClientModel = require('./../libs/model/auth/client');
var AccessTokenModel = require('./../libs/model/auth/accessToken');
var RefreshTokenModel = require('./../libs/model/auth/refreshToken');
var BusStop = require('./../libs/model/api/busStop');
var BusService = require('./../libs/model/api/busService');

var userFunc = function (callback) {
    UserModel.remove({}, function (err) {
        var user = new UserModel({
            name: "Regular User",
            username: "user@me.com",
            password: "password",
            role: "user"
        });

        var admin = new UserModel({
            name: "Admin",
            username: "admin@me.com",
            password: "admin123",
            role: "admin"
        });

        user.save(function (err, user) {
            if (err) log.error(err);
            else log.info("New user - %s:%s", user.username, user.password);

            admin.save(function (err, user) {
                if (err) log.error(err);
                else log.info("New user - %s:%s", admin.username, admin.password);
                callback(null, 1);
            });
        });
    });
};

var clientFunc = function (callback) {
    ClientModel.remove({}, function (err) {
        var client = new ClientModel({
            name: "SG Travel Buddy Beta",
            clientId: "sg-travel-buddy-v1",
            clientSecret: "welcome1",
            domains: "localhost"
        });
        client.save(function (err, client) {
            if (err) log.error(err);
            else log.info("New client - %s:%s", client.clientId, client.clientSecret);
            callback(null, 2);
        });
    });
};

var accessTokenFunc = function (callback) {
    AccessTokenModel.remove({}, function (err) {
        if (err) log.error(err);
        callback(null, 3);
    });
};

var refreshTokenFunc = function (callback) {
    RefreshTokenModel.remove({}, function (err) {
        if (err) log.error(err);
        callback(null, 4);
    });
};

var busServiceFunc = function (callback) {
    BusService.remove({}, function (err) {
        var lines = fs.readFileSync(__dirname + '/bus-data/bus_services.json', 'utf8').toString().split('\n');
        var noOfLines = lines.length;
        var done = 0;
        lines.forEach(function (line) {
            if (line != undefined && line.length > 0) {
                var bus = JSON.parse(line);
                var busService;
                if (bus.routeTwoStops == undefined) {
                    busService = new BusService({
                        _id: bus._id,
                        routes: bus.routes,
                        type: bus.type,
                        operator: bus.operator,
                        name: bus.name,
                        routeOneStops: bus.routeOneStops
                    });
                } else {
                    busService = new BusService({
                        _id: bus._id,
                        routes: bus.routes,
                        type: bus.type,
                        operator: bus.operator,
                        name: bus.name,
                        routeOneStops: bus.routeOneStops,
                        routeTwoStops: bus.routeTwoStops
                    });
                }
                busService.save(function (err, bus) {
                    if (err) log.error(err.message, JSON.stringify(busService));
                    done++;
                    if (noOfLines == done) {
                        log.info("Bus Services Created - %d", done);
                        callback(null, done);
                    }
                });
            } else {
                noOfLines--;
            }
        });
    });
};

var busStopFunc = function (callback) {
    BusStop.remove({}, function (err) {
        var lines = fs.readFileSync(__dirname + '/bus-data/bus_stops.json', 'utf8').toString().split('\n');
        var noOfLines = lines.length;
        var done = 0;
        lines.forEach(function (line) {
            if (line != undefined && line.length > 0) {
                var stop = JSON.parse(line);
                var busStop = new BusStop({
                    _id: stop._id,
                    name: stop.name,
                    location: {
                        type: stop.location.type,
                        coordinates: stop.location.coordinates
                    },
                    busServices: stop.busServices
                });

                busStop.save(function (err, bus) {
                    if (err) log.error(err.message, JSON.stringify(busStop));
                    done++;
                    if (noOfLines == done) {
                        log.info("Bus Stops Created - %d", done);
                        callback(null, done);
                    }
                });
            } else {
                noOfLines--;
            }
        });
    });
};

var timeOutFun = function (callback) {
    setTimeout(function () {
        log.info('Finished data importing');
        callback(null, 7);
    }, 5000);
};

async.series([
        userFunc,
        clientFunc,
        accessTokenFunc,
        refreshTokenFunc,
        busServiceFunc,
        busStopFunc,
        timeOutFun
    ],
    function (err, results) {
        if (err) log.error(err);
        log.info('Finished executing all tasks', results);
        process.exit();
    });

