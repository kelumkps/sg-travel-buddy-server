var routeService = require('./routeService');

module.exports = {
	createRoute: function (req, res) {
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

		if(route.busStops || route.coordinates) {
			routeService.updateRoute(route, function (err, route) {
            	if (err) return sendServerErrorResponse(res, err);
            	return res.send(route);           
        	});	
		} else {
			res.send(400, {error: "Bad Request", message: "Missing Coordinates or busStops"});
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