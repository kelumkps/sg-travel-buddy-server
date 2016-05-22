var request = require('request');
var config = require('./../config');
var BusService = require('./../model/api/busService');
var BusStop = require('./../model/api/busStop');
var log = require('./../log')(module);

var uri = config.get('sgLtaDataMall:uri');
var busServiceEndPoint = config.get('sgLtaDataMall:busServiceEndPoint');
var busRoutesEndPoint = config.get('sgLtaDataMall:busRoutesEndPoint');
var busStopsEndPoint = config.get('sgLtaDataMall:busStopsEndPoint');
var headers = {
    'Accept': 'application/json',
    'AccountKey': config.get('sgLtaDataMall:accountKey'),
    'UniqueUserID': config.get('sgLtaDataMall:uniqueUserId')
};

function fetchTransportData(endPoint, callBack, skip, data) {
    skip = skip || 0;
    data = data || [];
    var options = {
        url: uri + endPoint + '?$skip=' + skip,
        headers: headers
    };
    request(options, function (err, response, body) {
        if (err) {
            callBack(data);
        } else {
            var values = JSON.parse(body).value;
            if (values === undefined || values.length == 0) {
                callBack(data);
            } else {
                fetchTransportData(endPoint, callBack, skip + 50, data.concat(values));
            }
        }
    });
}

module.exports = {
    startSync: function (req, res) {
        log.info("Started to sync from LTA");
        fetchTransportData(busRoutesEndPoint, function (routesData) {
            var allBusRoutes = processBusRoutesData(routesData);
            var routesDataSize = routesData.length;
            log.info('BusRoutes EndPoint data size', routesData.length);
            if (routesDataSize < 1) return res.status(500).send("Internal Server Error");
            fetchTransportData(busStopsEndPoint, function (stopsData) {
                var stopsDataSize = stopsData.length;
                log.info('BusStops EndPoint data size', stopsData.length);
                if (stopsDataSize < 1) return res.status(500).send("Internal Server Error");
                var allBusStops = processBusStopsData(stopsData, allBusRoutes);
                fetchTransportData(busServiceEndPoint, function (serviceData) {
                    var serviceDataSize = serviceData.length;
                    log.info('BusService EndPoint data size', serviceData.length);
                    if (serviceDataSize < 1) return res.status(500).send("Internal Server Error");
                    var allBusServices = processBusServiceData(serviceData, allBusStops, allBusRoutes);
                    log.info("Processing finished for Bus Service Data");
                    for (var busId in allBusServices) {
                        if (allBusServices.hasOwnProperty(busId)) {
                            BusService.findOneAndUpdate({_id: busId}, allBusServices[busId],
                                {upsert: true, new: true}, function (err, doc) {
                                if (err) log.error('Error while saving bus service with id', busId, err, 'new doc', doc, 'old doc', allBusServices[busId]);
                            });
                        }
                    }
                    for (var stopId in allBusStops) {
                        if (allBusStops.hasOwnProperty(stopId)) {
                            BusStop.findOneAndUpdate({_id: stopId}, allBusStops[stopId],
                                {upsert: true, new: true}, function (err, doc) {
                                if (err) log.error('Error while saving bus service with id', stopId, err, 'new doc', doc, 'old doc', allBusStops[stopId]);
                            });
                        }
                    }
                    return res.status(200).send({routesDataSize: routesDataSize, stopsDataSize: stopsDataSize, serviceDataSize: serviceDataSize});
                });
            });
        });
    }
};

function processBusRoutesData(routesData) {
    var byService = {};
    var byStops = {};
    routesData.forEach(function (route) {
        var serviceInfo = byService[route['ServiceNo']] || {};
        var directionData = serviceInfo[route['Direction']] || {};
        var stopSeq = route['StopSequence'];
        directionData[stopSeq] = route['BusStopCode'];
        var direction = route['Direction'];
        var directionCount = serviceInfo['countDir' + direction] || 0;
        if (stopSeq > directionCount) directionCount = stopSeq;
        serviceInfo['countDir' + direction] = directionCount;
        byService[route['ServiceNo']] = serviceInfo;
        serviceInfo[route['Direction']] = directionData;

        var stopInfo = byStops[route['BusStopCode']] || [];
        stopInfo.push(route['ServiceNo']);
        byStops[route['BusStopCode']] = stopInfo;
    });
    var allBusRoutes = {};
    allBusRoutes['byStops'] = byStops;
    allBusRoutes['byService'] = byService;
    return allBusRoutes;
};

function processBusStopsData(stopsData, allBusRoutes) {
    var allBusStops = {};
    var routesByStops = allBusRoutes['byStops'];
    stopsData.forEach(function (stop) {
        var busStop = {
            _id: stop['BusStopCode'],
            name: stop['Description'],
            location: {
                type: "Point",
                coordinates: [stop['Longitude'], stop['Latitude']]
            },
            busServices: routesByStops[stop['BusStopCode']]
        };
        allBusStops[stop['BusStopCode']] = busStop;
    });
    return allBusStops;
};

function processBusServiceData(serviceData, allBusStops, allBusRoutes) {
    var allBusServices = {};
    var routesByService = allBusRoutes['byService'];
    serviceData.forEach(function (service) {
        var serviceNo = service['ServiceNo'];
        var busService = allBusServices[serviceNo] || {};
        var direction = service['Direction'];

        var originCode = service['OriginCode'];
        var destCode = service['DestinationCode'];
        if (originCode === '80008') originCode = '80009';
        if (destCode === '80008') destCode = '80009';
        var originStop = allBusStops[originCode];
        var destStop = allBusStops[destCode];
        if (originStop == undefined) originStop = {};
        if (destStop == undefined)destStop = {};
        var busServiceName = originStop.name + ' - ' + destStop.name;

        var routesForService = routesByService[serviceNo];
        if (busService['routeOneStops'] == undefined && routesForService != undefined) {
            var noOfStopsInDir1 = routesForService['countDir1'];
            var routeOneStops = [];
            var oneStops = routesForService['1'];
            for (i = 1; i <= noOfStopsInDir1; i++) {
                var stop = allBusStops[oneStops[i]];
                if (stop != undefined) {
                    var routeStop = {number: stop._id, name: stop.name};
                    routeOneStops.push(routeStop);
                }
            }

            busService['routeOneStops'] = routeOneStops;
        }

        busService['_id'] = serviceNo;
        busService['type'] = service['Category'];
        busService['operator'] = service['Operator'];

        if (busService['routes'] == undefined || direction == 2) {
            busService['routes'] = direction;
        }

        if (direction == 1) {
            busService['routeOneName'] = busServiceName;
        } else {
            busService['routeTwoName'] = busServiceName;
        }

        var routeTwoStops = [];
        if (direction === 2  && routesForService != undefined) {
            var noOfStopsInDir2 = routesForService['countDir2'];
            var routeTwoStops = [];
            var twoStops = routesForService['2'];
            for (i = 1; i <= noOfStopsInDir2; i++) {
                var stop = allBusStops[twoStops[i]];
                if (stop != undefined) {
                    var routeStop = {number: stop._id, name: stop.name};
                    routeTwoStops.push(routeStop);
                }
            }
            busService['routeTwoStops'] = routeTwoStops;
        }

        allBusServices[serviceNo] = busService;
    });

    return allBusServices;
};