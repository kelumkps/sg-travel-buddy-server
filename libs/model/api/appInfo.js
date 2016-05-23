var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var AppInfo = new Schema({
    appUrl: String,
    isActive: {
        type: Boolean,
        default: true
    },
    created: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('AppInfo', AppInfo);