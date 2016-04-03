var UserTokenModel = require('./../model/auth/userToken');
var UserModel = require('./../model/auth/user');

var mailer = require('./emailService');
var log = require('./../log')(module);
var config = require('./../config');

module.exports = {
    passwordReset: function (req, res) {
        log.info('Reset password for email ', req.body.email, 'isFromWeb ', req.body.isFromWeb);
        var isFromWeb = "true" === req.body.isFromWeb;
        UserModel.findOne({username: req.body.email}, function (err, user) {
            if (err) {
                if (isFromWeb) {
                    req.flash('errors', {msg: 'Oh no! Service is currently unavailable. Please try again later.'});
                    return res.redirect('back');
                } else return res.status(500).send('Internal Server Error');
            }
            if (!user) {
                if (isFromWeb) {
                    req.flash('errors', {msg: 'Oh no! No account with that email address exists. Please try again with valid email'});
                    return res.redirect('back');
                } else return res.status(404).send('User Not Found');
            }

            UserTokenModel.remove({userId: user.userId}, function (err) {
                if (err) {
                    if (isFromWeb) {
                        req.flash('errors', {msg: 'Oh no! Service is currently unavailable. Please try again later.'});
                        return res.redirect('back');
                    } else return res.status(500).send('Internal Server Error');
                }
                UserTokenModel.new(user.userId, function (err, token) {
                    var siteURL = req.protocol + '://' + req.hostname;
                    var resetUrl = siteURL + '/password_reset/' + token.token;
                    var locals = {
                        subject: 'SG Travel Buddy : Recover Your Password',
                        resetUrl: resetUrl,
                        email: user.username,
                        name: user.name || user.username,
                        siteURL: siteURL,
                        productName: 'SG Travel Buddy',
                        twitterIconUrl: siteURL + '/images/twitter-icon.png',
                        twitterHandler: 'SGTravelBuddy'
                    };
                    mailer.sendOne('password_reset', locals, function (err, respMs, html, text) {
                        if (err) {
                            if (isFromWeb) {
                                req.flash('errors', {msg: 'Oh no! Service is currently unavailable. Please try again later.'});
                                return res.redirect('back');
                            } else return res.status(500).send('Internal Server Error');
                        }
                        if (isFromWeb) {
                            req.flash('success', {msg: 'An e-mail has been sent to ' + req.body.email + ' with further instructions.'});
                            return res.redirect('back');
                        } else return res.status(200).send('Please Check your emails');
                    });
                });
            });
        });
    },

    passwordRestCheck: function (req, res) {
        log.info("Password reset check for token ", req.params.token);
        UserTokenModel.findOne({token: req.params.token}, function (err, token) {
            if (err) {
                req.flash('errors', {msg: 'Oh no! Service is currently unavailable. Please try again later.'});
                return res.render('reset');
            }
            if (!token) {
                req.flash('errors', {msg: 'Oh no! Password reset token is invalid or has expired.'});
                return res.render('forgot');
            }

            if (Math.round((Date.now() - token.created) / 1000) > config.get('security:tokenLife')) {
                UserTokenModel.remove({token: token.token}, function (err) {
                    if (err) log.error('Error while removing user token', err);
                });
                req.flash('errors', {msg: 'Oh no! Password reset token is invalid or has expired.'});
                return res.render('forgot');
            }

            UserModel.findById(token.userId, function (err, user) {
                if (err) {
                    req.flash('errors', {msg: 'Oh no! Service is currently unavailable. Please try again later.'});
                    return res.render('reset');
                }
                if (!user) {
                    req.flash('errors', {msg: 'Oh no! Password reset token is invalid or has expired.'});
                    return res.render('forgot');
                }
                res.render('reset');
            });
        });
    },

    updatePassword: function (req, res) {
        log.info("Update new password for token ", req.params.token);
        if (req.body.password != req.body.confirm) {
            req.flash('errors', {msg: 'Oh no! Password must match.'});
            return res.redirect('back');
        }

        UserTokenModel.findOne({token: req.params.token}, function (err, token) {
            if (err) {
                req.flash('errors', {msg: 'Oh no! Service is currently unavailable. Please try again later.'});
                return res.redirect('back');
            }
            if (!token) {
                req.flash('errors', {msg: 'Oh no! Password reset token is invalid or has expired.'});
                return res.render('forgot');
            }

            if (Math.round((Date.now() - token.created) / 1000) > config.get('security:tokenLife')) {
                UserTokenModel.remove({token: token.token}, function (err) {
                    if (err) log.error('Error while removing user token', err);
                });
                req.flash('errors', {msg: 'Oh no! Password reset token is invalid or has expired.'});
                return res.render('forgot');
            }

            UserModel.findById(token.userId, function (err, user) {
                if (err) {
                    req.flash('errors', {msg: 'Oh no! Service is currently unavailable. Please try again later.'});
                    return res.redirect('back');
                }
                if (!user) {
                    req.flash('errors', {msg: 'Oh no! Password reset token is invalid or has expired.'});
                    return res.render('forgot');
                }
                user.password = req.body.password;
                user.save(function (err) {
                    if (err) {
                        req.flash('errors', {msg: 'Oh no! Service is currently unavailable. Please try again later.'});
                        return res.redirect('back');
                    }
                    res.redirect("/");
                });
                UserTokenModel.remove({token: token.token}, function (err) {
                    if (err) log.error('Error while removing user token', err);
                });
            });
        });
    }
};
