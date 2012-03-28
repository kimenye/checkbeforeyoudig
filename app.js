// Still working on the everyauth functionality. Will complete by the end of the day.
// That and jasmine integration



/**
 * Module dependencies.
 */

var express = require('express'), routes = require('./routes'), everyauth = require('everyauth'), jasmine = require('jasmine-node');

var app = module.exports = express.createServer();
var CONFIG = require('config').Environment;

// Data provider
var DataProvider = require('./dataprovider').DataProvider;
var data = new DataProvider();

var mailer = require('./utility/mailer');



everyauth
  .password
  	everyauth.password.extractExtraRegistrationParams( function (req) {
  return {
      occupation: req.body.occupation
  };
})
    .loginWith('email')
    .getLoginPath('/')
    .postLoginPath('/login')
    .loginLocals({
     title : 'Dial Before You Dig'
  })
    .loginView('index.jade')
    .
authenticate(function(email, password) {
	var errors = [];
	if(!email)
		errors.push('Missing email');
	if(!password) {
		errors.push('Missing password');
	}
	if(errors.length)
		return errors;

	data.findUserByEmail(function(user) {
		if(user && user.password === password) {
			return user;
			console.log("Login successful");
		} else {
			return ['Login failed'];
			console.log("Login failed");
		}
	}, email);
})

    .getRegisterPath('/')
    .postRegisterPath('/register')
    .registerLocals({
     title : 'Dial Before You Dig'
  })
    .registerView('index.jade')
    .validateRegistration( function (newUserAttrs, errors) {
      data.findUserByEmail(function(user) {
		if(user) {
			errors.push('Email already registered');
			console.log("Email already registered");
		}
		
	}, newUserAttrs.email);
      
      if(errors.length) {
			return errors;
		}
    })
    .registerUser(function(newUserAttrs) {

		var emailAddress = newUserAttrs.email;
		var occupation = newUserAttrs.occupation;
		var token = generateUUID();
		function generateUUID() {
			var d = new Date().getTime();
			var uuid = 'xxxxxxxxxxxx4xxxyxxxxxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
				var r = (d + Math.random() * 16) % 16 | 0;
				d = d / 16 | 0;
				return (c == 'x' ? r : (r & 0x7 | 0x8)).toString(16);
			});
			return uuid;
		}

		console.log('Email Address is ' + emailAddress + '\nOccupation is ' + occupation + '\ntoken is ' + token);

		data.createUser(function(user) {
			// Send an email to the user
			mailer.sendEmail(user);
			console.log("Created : " + user.emailAddress + " Occupation: " + user.occupation + " Token: " + token);
			return user;
		}, emailAddress, occupation, token);
})

    .loginSuccessRedirect('/home')
    .registerSuccessRedirect('/registered');


// Configuration
app.configure(function() {
	app.set('views', __dirname + '/views');
	app.set('view engine', 'jade');
	app.use(express.bodyParser());
	app.use(express.methodOverride());
	app.use(express.cookieParser());
	app.use(express.session({
		secret : 'your secret here'
	}));
	app.use(everyauth.middleware());
	app.use(require('stylus').middleware({
		src : __dirname + '/public'
	}));
	app.use(app.router);
	app.use(express.static(__dirname + '/public'));
});

everyauth.helpExpress(app);

app.configure('development', function() {
	app.use(express.errorHandler({
		dumpExceptions : true,
		showStack : true
	}));
});

app.configure('production', function() {
	app.use(express.errorHandler());
});
// Routes

app.get('/', routes.index);

app.get('/home', function(req, res) {
	res.render('home', {
		title : 'Dial Before You Dig :: test',
		layout : 'layout'
	})
});

app.get('/test', function(req, res) {
	res.render('test', {
		title : 'Dial Before You Dig :: test',
		layout : 'layout'
	})
});
/**
 * This gets called when you post the register form
 */
/*
app.post('/register', function(req, res) {
	var emailAddress = req.param('emailAddress');
	var occupation = req.param('occupation');
	var token = generateUUID();
	function generateUUID() {
		var d = new Date().getTime();
		var uuid = 'xxxxxxxxxxxx4xxxyxxxxxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
			var r = (d + Math.random() * 16) % 16 | 0;
			d = d / 16 | 0;
			return (c == 'x' ? r : (r & 0x7 | 0x8)).toString(16);
		});
		return uuid;
	};


	console.log('Email Address is ' + emailAddress + '\nOccupation is ' + occupation + '\ntoken is ' + token);

	data.createUser(function(user) {
		// Send an email to the user
		mailer.sendEmail(user);
		console.log("Created : " + user.emailAddress + " Occupation: " + user.occupation + " Token: " + token);
	}, emailAddress, occupation, token);
	//Redirect the user to the thank you page
	res.render('registered', {
		title : 'Thank you for your registration'
	});
});

app.get('/registered', function(req, res) {
	//Redirect the user to the thank you page
	res.render('registered', {
		title : 'Thank you for your registration'
	});
});*/


/**
 * This gets called when a user click on the confirmation link
 */
app.get('/confirm', function(req, res) {
	var token = req.param('token')
	console.log("Confirmation token is " + token);

	// Redirect the user to the password-set/confirm page
	res.render('confirm', {
		title : 'Set your Password',
		token : token
	});

});
/**
 * This gets called when a user sets their password
 */
app.post('/validate', function(req, res) {
	// Will implement front end validation
	if(req.param('password') === req.param('passwordConfirm')) {
		data.updateUser(function(req, res) {
			console.log("Activation: " + user.activated + " regDate" + user.registrationDate);
		}, req.param('token'), new Date(), req.param('password'));

		res.render('home', {
			title : 'Dial Before You Dig :: test',
			layout : 'layout'
		})
	} else {
		console.log("Passwords do not match");
	}
});
var port = CONFIG.port;
app.listen(port, function() {
	console.log("Listening on " + port);
});

console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
