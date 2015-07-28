var UserModel = require('./../model/auth/user');
var log = require('./../log')(module);

module.exports = {
    createRegularUser: function (req, res) {
        var user = new UserModel({
            username: req.body.username,
            password: req.body.password,
            role: "user"
        });

        user.save(function (err) {
            if (!err) {
                log.info("A New regular user created", user.username);
                res.statusCode = 201;
                return res.send({
                    username: user.username,
                    role: user.role
                });
            } else {
                if (err.code == 11000) res.send(409, 'Conflict: Duplicate Resource');
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
                res.statusCode = 201;
                return res.send({
                    username: user.username,
                    role: user.role
                });
            });
        } else {
            res.send(404, 'Not found');
        }
    }
};
