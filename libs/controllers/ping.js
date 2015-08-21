var PingModel = require('./../model/api/ping');

module.exports = {
	getPings: function (req, res) {
        PingModel.find({}, function (err, buses) {
            if (err) return sendServerErrorResponse(res, err);
            return res.send(buses);
        });
    },
    createPing: function(req, res) {
    	var ping = new PingModel();
	    ping.save(function (err, ping) {
	    	if (err) return sendServerErrorResponse(res, err);
	    	return res.send(ping);
	    });
    },
    deletePings: function(req, res) {
    	PingModel.remove({}, function (err) {
        	if (err) return sendServerErrorResponse(res, err);
        	return res.send({
                status: 'OK',
                message: new Date()
            });
    	});
    }
};

function sendServerErrorResponse(res, err) {
    res.statusCode = 500;
    log.error('Internal error(%d): %s', res.statusCode, err.message);
    return res.send({
        error: 'Server error'
    });
}