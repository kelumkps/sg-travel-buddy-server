var DeviceInfoModel = require('./../model/api/deviceInfo');

var log = require('./../log')(module);

module.exports = {
    createOrUpdate: function (req, res) {
        var deviceInfo = {
            uuid: req.body.uuid,
            serial: req.body.serial,
            platform: req.body.platform,
            model: req.body.model,
            manufacturer: req.body.manufacturer,
            osVersion: req.body.osVersion,
            appVersion: req.body.appVersion,
            cordova: req.body.cordova,
            isVirtual: req.body.isVirtual
        };
        log.info('Create or update device information', deviceInfo);
        if (req.body.uuid && req.body.serial) {
            var conditions = {uuid: req.body.uuid, serial: req.body.serial},
                options = {upsert: true, new: true};
            deviceInfo['$inc'] =  {onlineCount: 1};
            DeviceInfoModel.findOneAndUpdate(conditions, deviceInfo, options, function (err, info) {
                if (err) return sendServerErrorResponse(res, err);
                var response = {_id: info._id, notifications: []};
                if (info.notifications) {
                    for (var i = 0; i < info.notifications.length; i++) {
                        var notification = info.notifications[i];
                        if (!notification.isRead) {
                            response.notifications.push(notification);
                            notification.isRead = true;
                            break;
                        }
                    }
                    if (response.notifications.length > 0) {
                        DeviceInfoModel.update({_id: info._id}, info, function (err) {
                            if (err) log.error('Error while updating DeviceInfo', info, err);
                        });
                    }
                }
                return res.send(response);
            })
        } else {
            res.send(400, {error: "Bad Request", message: "Missing uuid or serial number"});
        }
    }
};

function sendServerErrorResponse(res, err) {
    res.statusCode = 500;
    log.error('Internal error(%d): %s', res.statusCode, err.message);
    return res.send({
        error: 'Server error'
    });
}
