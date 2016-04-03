var express = require('express');
var path = require('path'); // path parsing module
var favicon = require('serve-favicon');
var morgan = require('morgan');
var bodyParser = require('body-parser');
var methodOverride = require('method-override');
var passport = require('passport');
var session = require('express-session');
var sass = require('node-sass-middleware');

var log = require('./libs/log')(module);
var config = require('./libs/config');
var userCtrl = require('./libs/controllers/user');
var passwordRecoveryCtrl = require('./libs/controllers/passwordRecovery');
var busServiceCtrl = require('./libs/controllers/busService');
var routeHttpCtrl = require('./libs/controllers/routeHttp');
var pingCtrl = require('./libs/controllers/ping');
var deviceInfoCtrl = require('./libs/controllers/deviceInfo');
var analyticsCtrl = require('./libs/controllers/analytics');
var oauth2 = require('./libs/auth/oauth2');
var authConfig = require('./libs/auth/authConfigs');
var access = authConfig.accessLevels;
require('./libs/auth/auth');
require('./libs/db/mongoose');

var app = express();
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);


var serverPort = process.env.OPENSHIFT_NODEJS_PORT || config.get('port');
var serverIpAddress = process.env.OPENSHIFT_NODEJS_IP || '127.0.0.1';

// Socket.io Communication
io.sockets.on('connection', require('./libs/controllers/socket'));

var publicDir = process.argv[2] || __dirname; //todo remove this

app.use(favicon(__dirname + '/public/favicon.ico')); // use standard favicon
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.use(sass({
    src: path.join(__dirname, 'public'),
    dest: path.join(__dirname, 'public'),
    sourceMap: true
}));
app.use(morgan(config.get('logger:format'))); // log every request to the console
app.use(bodyParser.urlencoded({
    extended: false
})); // parse application/x-www-form-urlencoded  
app.use(bodyParser.json()); // parse application/json 
app.use(methodOverride()); // simulate DELETE and PUT
app.use(require('express-flash')());
app.use(session({secret: 'SECRET'})); // session secret
app.use(passport.initialize());
app.use(passport.session()); // persistent login sessions
app.use(express.static(path.join(publicDir, "public"))); // starting static file server, that will watch `public` folder (in our case there will be `index.html`)

app.get('/api', function (req, res) {
    res.send('API is running');
});

app.get('/api/pings', pingCtrl.getPings);

app.post('/api/pings', pingCtrl.createPing);

app.delete('/api/pings', pingCtrl.deletePings);

app.use(analyticsCtrl.pageView);

app.post('/oauth2/token', oauth2.token);

app.get('/oauth2/auth', oauth2.authorization);

app.post('/oauth2/decision', oauth2.decision);

app.post('/oauth2/exchange', oauth2.exchange);

app.get('/oauth2/revoke', oauth2.revoke);

app.post('/api/users', userCtrl.createRegularUser);

app.get('/api/users', passport.authenticate('bearer', {session: false}),
    authConfig.authorize(access.user),
    userCtrl.getUser);

app.post('/password_reset', passwordRecoveryCtrl.passwordReset);
app.get('/password_reset/:token', passwordRecoveryCtrl.passwordRestCheck);
app.post('/password_reset/:token', passwordRecoveryCtrl.updatePassword);

app.get('/api/buses', busServiceCtrl.getBuses);

app.get('/api/buses/:id', busServiceCtrl.getBusById);

app.get('/api/stops', busServiceCtrl.getBusStops);

app.get('/api/stops/:id', busServiceCtrl.getBusStopsById);

app.post('/api/routes', routeHttpCtrl.createRoute);

app.put('/api/routes/:id', routeHttpCtrl.updateRoute);

app.post('/api/deviceInfo', deviceInfoCtrl.createOrUpdate);

app.get('/api/userInfo',
    passport.authenticate('bearer', {
        session: false
    }),
    authConfig.authorize(access.user),
    function (req, res) {
        // req.authInfo is set using the `info` argument supplied by
        // `BearerStrategy`.  It is typically used to indicate a scope of the token,
        // and used in access control checks.  For illustrative purposes, this
        // example simply returns the scope in the response.
        res.json({
            user_id: req.user.userId,
            name: req.user.username,
            scope: req.authInfo.scope
        })
    }
);

app.use(function (req, res, next) {
    res.status(404);
    log.debug('Not found URL: %s', req.url);
    res.send({
        error: 'Not found'
    });
});

app.use(function (err, req, res, next) {
    res.status(err.status || 500);
    log.error('Internal error(%d): ', res.statusCode, err);
    res.send({
        error: err.message
    });
});

server.listen(serverPort, serverIpAddress, function () {
    log.info('%s: SGTravelBuddy server started on %s:%d ...',
        Date(Date.now()), serverIpAddress, serverPort);
});

