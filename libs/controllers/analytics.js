var ua = require('universal-analytics');
var config = require('./../config');
var DeviceInfoModel = require('./../model/api/deviceInfo');
var gaAccountId = config.get('analytics:gaAccountId');
var serverUrl = config.get('analytics:serverUrl');

var pageTitles = {
    "GET": {
        "/oauth2/auth": "Auth",
        "/api/users": "Get User",
        "/password_reset/": "Get Password Reset Form",
        "/api/sync": "Trigger LTA Sync",
        "/api/buses": "List of Buses",
        "/api/buses/": "Bus Service Info",
        "/api/stops": "List of Bus Stops",
        "/api/stops/": "Bus Stop",
        "/api/userInfo": "User Info",
        "/oauth2/revoke": "Token Revoke"
    },
    "POST": {
        "/oauth2/token": "Auth Token",
        "/oauth2/decision": "Auth Decision",
        "/oauth2/exchange": "Token Exchange",
        "/api/users": "Create New User",
        "/password_reset": "Request Reset Password",
        "/password_reset/": "Update Password",
        "/api/routes": "New Route",
        "/api/deviceInfo": "Device Info",
        "/api/appInfo": "Add New App URL"
    },
    "PUT": {
        "/api/users": "Update User",
        "/api/routes/": "Update Route"
    }
};

module.exports = {
    pageView: function (req, res, next) {
        var pageData = {
            dp: req.path,
            dh: serverUrl,
            uip: req.ip,
            ua: req.headers["user-agent"],
            ds: "web",
            ul: req.headers["accept-language"]
        };
        pageData['dt'] = getPageTitle(req.method, req.path);
        var visitor;
        var deviceId = req.get('device-id');
        if (deviceId != undefined) {
            pageData['ds'] = 'app';
            pageData['cid'] = deviceId;
            pageData['uid'] = deviceId;
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
            visitor = ua(gaAccountId, "Web-Client", {strictCidFormat: false, https: true});
            visitor.pageview(pageData).send();
        }
        next();
    }
};

function getPageTitle(method, path) {
    var titles = pageTitles[method] || {};
    var pageTitle = titles[path];
    if (pageTitle != undefined) {
        return pageTitle;
    } else {
        var i = path.lastIndexOf("/") + 1;
        var updatedPath = path.substring(0, i);
        return titles[updatedPath];
    }
}