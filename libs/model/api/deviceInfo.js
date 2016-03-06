var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var DeviceInfo = new Schema({
    uuid: {type: String, unique: true, required: true},
    serial: {type: String, unique: true, required: true},
    platform: String,
    model: String,
    osVersion: String,
    appVersion: String,
    cordova: String,
    isVirtual: Boolean,
    notifications: [{
        header: String,
        body: String,
        isRead: Boolean,
        _id: false
    }],
    created: {
        type: Date,
        default: Date.now
    },
    updated: {
        type: Date,
        default: Date.now
    }
});

DeviceInfo.index({uuid: 1, serial: 1});

module.exports = mongoose.model('DeviceInfo', DeviceInfo);
