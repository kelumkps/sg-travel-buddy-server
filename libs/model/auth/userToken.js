var crypto = require('crypto');
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var UserToken;

var userTokenSchema = new Schema({
    userId: {type: Schema.ObjectId, index: true},
    token: {type: String, index: true},
    created: {
        type: Date,
        default: Date.now
    }
});

userTokenSchema.statics.new = function (userId, fn) {
    var user = new UserToken();
    // create a random string
    crypto.randomBytes(48, function (ex, buf) {
        // make the string url safe
        var token = buf.toString('base64').replace(/\//g, '_').replace(/\+/g, '-');
        // embed the userId in the token, and shorten it
        user.token = userId + '|' + token.toString().slice(1, 24);
        user.userId = userId;
        user.save(fn);
    });
};

module.exports = UserToken = mongoose.model('UserToken', userTokenSchema);
