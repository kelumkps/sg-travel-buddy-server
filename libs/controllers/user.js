var UserModel = require('./../model/auth/user');
var log = require('./../log')(module);
var mailer = require('./emailService');

module.exports = {
    createRegularUser: function (req, res) {
        var user = new UserModel({
            name: req.body.name,
            username: req.body.username,
            password: req.body.password,
            role: "user",
            distance: 500
        });

        user.save(function (err) {
            if (!err) {
                log.info("A New regular user created", user.username);
                res.statusCode = 201;
                var siteURL = 'https://' + req.hostname;
                var locals = {
                    subject: 'Welcome to SG Travel Buddy',
                    email: user.username,
                    name: user.name || user.username,
                    siteURL: siteURL,
                    productName: 'SG Travel Buddy',
                    twitterIconUrl: siteURL + '/images/twitter-icon.png',
                    twitterHandler: 'SGTravelBuddy'
                };
                mailer.sendOne('welcome', locals, function (err, respMs, html, text) {
                    if (err) {
                        log.error("Error while sending welcome email", user.username, err);
                    }
                    log.info('Welcome email sent to new user', user.username);
                });

                return res.send({
                    name: user.name,
                    username: user.username,
                    role: user.role,
                    distance: user.distance
                });
            } else {
                if (err.code == 11000) res.send(409, 'user_already_exist_error');
                else if (err.name == 'ValidationError') res.send(400, 'Validation error');
                else res.send(500, 'Internal Server error');

                log.error('Internal error(%d): %s', res.statusCode, err.code, err.message);
            }
        });
    },
    getUser: function (req, res) {
        if (req.user) {
            log.info('Get user profile');
            UserModel.findById(req.user.userId, function (err, user) {
                if (err) return res.send(500, 'Internal Server Error');
                if (!user) return res.send(404, 'Not found');
                res.statusCode = 200;
                return res.send({
                    name: user.name,
                    username: user.username,
                    role: user.role,
                    distance: user.distance
                });
            });
        } else {
            res.send(404, 'Not found');
        }
    },
    updateUser: function (req, res) {
        if (req.user) {
            log.info('Update user profile');
            UserModel.findById(req.user.userId, function (err, user) {
                if (err) return res.send(500, 'Internal Server Error');
                if (!user) return res.send(404, 'User Not found');

                if (req.body.currentPassword) {
                    var currentPassword = req.body.currentPassword;
                    if (!user.checkPassword(currentPassword)) {
                        return res.send(404, 'User Not found');
                    }
                }

                if (req.body.newPassword) user.password = req.body.newPassword;
                if (req.body.name) user.name = req.body.name;
                if (req.body.distance) user.distance = req.body.distance;
                user.save(function (err) {
                    if (err) {
                        return res.send(500, 'Internal Server Error');
                    }
                    res.statusCode = 200;
                    return res.send({
                        name: user.name,
                        distance: user.distance
                    });
                });
            });
        }
    }
};
