'use strict';

var _express = require('express');

var _express2 = _interopRequireDefault(_express);

var _bodyParser = require('body-parser');

var _bodyParser2 = _interopRequireDefault(_bodyParser);

var _pm = require('pm2');

var _pm2 = _interopRequireDefault(_pm);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var app = (0, _express2.default)(); // BASE SETUP
// =============================================================================

// call the packages we need

var port = process.env.PORT || 4000; // set our port

// ROUTES FOR OUR API
// =============================================================================

// create our router
var router = _express2.default.Router();

app.use(_bodyParser2.default.json());
app.use(_bodyParser2.default.urlencoded({ extended: false }));
// middleware to use for all requests
router.use(function (req, res, next) {
	console.log('[' + req.method + '] ' + req.originalUrl);
	next();
});

router.get('/', function (req, res) {
	res.json({ message: 'hooray! welcome to our api!', port: process.env.PORT });
});

router.post('/process', function (req, res) {
	var procName = req.body.name;
	var port = parseInt(req.body.port);
	var error_file = 'logs/' + procName + '.err.log';
	var out_file = 'logs/' + procName + '.out.log';

	_pm2.default.connect(function (err) {
		if (err) {
			res.status(500).json({
				msg: '[pm2.connect] ' + err.toString()
			});
			return;
		}

		_pm2.default.start({
			"apps": [{
				"exec_mode": "fork_mode",
				"script": "./dist/main.js",
				"name": procName,
				"node_args": ["--harmony"],
				"env": {
					"PORT": port,
					"NODE_ENV": app.get('env')
				},
				"error_file": error_file,
				"out_file": out_file
			}]
		}, function (err, apps) {
			console.log("pm2 start");
			_pm2.default.disconnect(); // Disconnect from PM2
			if (err) {
				res.status(500).json({
					msg: '[pm2.start] ' + err.toString()
				});
			} else {
				(function () {
					var services = [];
					apps.forEach(function (service) {
						services.push({
							name: service.pm2_env.name,
							port: service.pm2_env.PORT,
							pm_id: service.pm2_env.pm_id,
							pid: service.pid
						});
					});
					res.status(200).json(services);
				})();
			}
		});
	});
});

router.get('/process', function (req, res) {
	_pm2.default.connect(function (err) {
		if (err) {
			res.status(500).json({
				msg: '[pm2.connect] ' + err.toString()
			});
			return;
		}

		_pm2.default.list(function (err, processDescriptionList) {
			_pm2.default.disconnect();
			if (err) {
				res.status(500).json({
					msg: '[pm2.list] ' + err.toString()
				});
			} else {
				(function () {
					var services = [];
					processDescriptionList.forEach(function (service) {
						services.push({
							name: service.name,
							port: service.pm2_env.PORT,
							pm_id: service.pm_id,
							pid: service.pid
						});
					});
					res.status(200).json(services);
				})();
			}
		});
	});
});

router.put('/process/stop', function (req, res) {
	var pm_id = req.body.pm_id;

	_pm2.default.connect(function (err) {
		if (err) {
			res.status(500).json({
				msg: '[pm2.connect] ' + err.toString()
			});
			return;
		}
		_pm2.default.stop(pm_id, function (err, proc) {
			_pm2.default.disconnect();
			if (err) {
				res.status(500).json({
					msg: '[pm2.stop] ' + err.toString()
				});
			} else {
				res.status(200).json(proc);
			}
		});
	});
});

router.put('/process/start', function (req, res) {
	var pm_id = req.body.pm_id;

	_pm2.default.connect(function (err) {
		if (err) {
			res.status(500).json({
				msg: '[pm2.connect] ' + err.toString()
			});
			return;
		}
		_pm2.default.start(pm_id, function (err, proc) {
			_pm2.default.disconnect();
			if (err) {
				res.status(500).json({
					msg: '[pm2.start] ' + err.toString()
				});
			} else {
				res.status(200).json(proc);
			}
		});
	});
});

router.put('/process/restart', function (req, res) {
	var pm_id = req.body.pm_id;

	_pm2.default.connect(function (err) {
		if (err) {
			res.status(500).json({
				msg: '[pm2.connect] ' + err.toString()
			});
			return;
		}
		_pm2.default.restart(pm_id, function (err, proc) {
			_pm2.default.disconnect();
			if (err) {
				res.status(500).json({
					msg: '[pm2.restart] ' + err.toString()
				});
			} else {
				res.status(200).json(proc);
			}
		});
	});
});

router.delete('/process', function (req, res) {
	var pm_id = req.body.pm_id;

	_pm2.default.connect(function (err) {
		if (err) {
			res.status(500).json({
				msg: '[pm2.connect] ' + err.toString()
			});
			return;
		}
		_pm2.default.delete(pm_id, function (err, proc) {
			_pm2.default.disconnect();
			if (err) {
				res.status(500).json({
					msg: '[pm2.restart] ' + err.toString()
				});
			} else {
				res.status(200).json(proc);
			}
		});
	});
});

// REGISTER OUR ROUTES -------------------------------
app.use('/api', router);

process.on('SIGINT', function () {
	console.log('------------------------------ SIGINT');
	var fs = require('fs');
	fs.writeFile("./greenfrog.hello.test", "Hey there!", function (err) {
		if (err) {
			process.exit(err ? 1 : 0);
		}

		console.log("The file was saved!");
		process.exit(0);
	});
});

// START THE SERVER
// =============================================================================
app.listen(port);
console.log('Magic happens on port ' + port);