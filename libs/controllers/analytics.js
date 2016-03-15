var ua = require('universal-analytics');
var config = require('./../config');
var DeviceInfoModel = require('./../model/api/deviceInfo');
var gaAccountId = config.get('analytics:gaAccountId');
var serverUrl = config.get('analytics:serverUrl');

module.exports = {
    pageView: function (req, res, next) {
        var pageData = {
            dp: req.path,
            dh: serverUrl,
            uip: req.ip,
            ua: req.headers['user-agent']
        };
        var visitor;
        var deviceId = req.get('device-id');
        if (deviceId != undefined) {
            visitor = ua(gaAccountId, deviceId, {strictCidFormat: false, https: true});
            pageData['dt'] = deviceId;
            DeviceInfoModel.findById(deviceId, function (err, deviceInfo) {
                if (err) {
                    visitor.pageview(pageData).send();
                } else {
                    var params = {
                        ec: deviceInfo.platform,
                        ea: deviceInfo.model,
                        el: deviceInfo.osVersion
                    };
                    visitor.pageview(pageData).event(params).send();
                }
            });
        } else {
            visitor = ua(gaAccountId, {https: true});
            visitor.pageview(pageData).send();
        }
        next();
    }
};