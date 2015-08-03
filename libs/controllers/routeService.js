var RouteModel = require('./../model/api/route');
var log = require('./../log')(module);

module.exports = {
	createRoute: function(route, callback) {
		var routeContent = {
			path: {
            	type: 'LineString',
            	coordinates: route.coordinates
            }
		};
		if (route.busStops) routeContent['busStops'] = route.busStops;
		if (route.userId) routeContent['userId'] = route.userId;

		var routeModel = new RouteModel(routeContent);
		routeModel.save(callback);
	},
	updateRoute: function(route, callback) {
		var conditions = { _id: route._id },
		options = { multi: false },
		update = {};
		if(route.coordinates) update['$push'] = {'path.coordinates': route.coordinates};
		if(route.busStops) update['$set'] = {busStops: route.busStops};

		if(update.$push || update.$set) {
			RouteModel.update(conditions, update, options, callback);
		} else {
			RouteModel.findById(route._id, callback);
		}
	}
};