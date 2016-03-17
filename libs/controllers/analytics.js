var ua = require('universal-analytics');
var config = require('./../config');
var DeviceInfoModel = require('./../model/api/deviceInfo');
var gaAccountId = config.get('analytics:gaAccountId');
var serverUrl = config.get('analytics:serverUrl');

var pageTitles = {
    "/oauth2/token": "Auth Token",
    "/oauth2/auth": "Auth",
    "/oauth2/decision": "Auth Decision",
    "/oauth2/exchange": "Token Exchange",
    "/oauth2/revoke": "Token Revoke",
    "/api/users": "New User",
    "/api/buses": "List of Buses",
    "/api/buses/": "Bus Service Info",
    "/api/stops": "List of Bus Stops",
    "/api/stops/": "Bus Stop",
    "/api/routes": "New Route",
    "/api/routes/": "Update Route",
    "/api/deviceInfo": "Device Info",
    "/api/userInfo": "User Info"
};

module.exports = {
    pageView: function (req, res, next) {
        var pageData = {
            dp: req.path,
            dh: serverUrl,
            uip: req.ip,
            ua: req.headers['user-agent']
        };
        pageData['dt'] = getPageTitle(req.path);
        var visitor;
        var deviceId = req.get('device-id');
        if (deviceId != undefined) {
            visitor = ua(gaAccountId, deviceId, {strictCidFormat: false, https: true});
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

function getPageTitle(path) {
    var pageTitle = pageTitles[path];
    if (pageTitle != undefined) {
        return pageTitle;
    } else {
        var i = path.lastIndexOf("/") + 1;
        var updatedPath = path.substring(0, i);
        return pageTitles[updatedPath];
    }
}