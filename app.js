/**
 * Module dependencies.
 */

var express = require('express'), routes = require('./routes'), everyauth = require('everyauth');
var Promise = everyauth.Promise;

var app = module.exports = express.createServer();
var CONFIG = require('config').Environment;

// Data provider
var DataProvider = require('./dataprovider').DataProvider;
var data = new DataProvider();

// PDF generator
var PDFGenerator = require('./pdfgenerator').PDFGenerator;
var pdf = new PDFGenerator();

// User
var User = require('./dataprovider').User;
//Enquiry
var Enquiry = require('./dataprovider').Enquiry;

var mailer = require('./utility/mailer');
var emailMessage = require('./utility/emailMessage');

var confirmUrl = CONFIG.url + "/confirm?token=";
var website = CONFIG.url;



everyauth.everymodule.findUserById(function (userId, callback) {
    data.findUserById(userId, callback);
});


everyauth.password
    .loginWith('email')
    .getLoginPath('/login')
    .postLoginPath('/login')
    .loginView('index.jade')
    .loginLocals({
        title : CONFIG.name
    })
    .authenticate(function(email, password) {
        var errors = [];
        if(!email)
            errors.push('Missing email');
        if(!password) {
            errors.push('Missing password');
        }
        if(errors.length) {
            return errors;
        }

        var promise = this.Promise();
        data.findUserByEmail(function(user) {
            if(user && user.password === password) {
                promise.fulfill(user);
            } else {
                return promise.fulfill(["Incorrect username/password combination"]);
            }
        }, email);
        return promise;
    })
    .getRegisterPath('/register')
    .postRegisterPath('/register')
    .registerView('register.jade')
    .registerLocals({
        title : CONFIG.name
    })
  	.extractExtraRegistrationParams( function (req) {
  		return {
      		occupation: req.body.occupation,
			fullName : req.body.fullName
  		};
	})
    .validateRegistration( function (newUserAttrs, errors) {
        //TODO: This is a workaround
        //we should already be having all the parameters we need.
        //therefore we should clear the validation
        errors.splice(0,errors.length);
        return errors;
    })
    .registerUser(function(newUserAttrs) {
        console.log('Creating new user')
        var emailAddress = newUserAttrs.email;
        var occupation = newUserAttrs.occupation;
        var name = newUserAttrs.fullName;

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

        var promise = this.Promise();
        data.createUser(function(user) {
            if(user) {
                // Send an email to the user. Temporarily disabled this so as not to run it twice
                if (!CONFIG.test) {
                    var subject = "Dial Before you Dig Registration Confirmation";
                    var message = emailMessage.getActivationEmail(user);
                    mailer.sendEmail(user, subject, message);
                }
                promise.fulfill(user);
            }
            else {
                return promise.fulfill(["Email already registered"]);
            }

        }, emailAddress, occupation, token, name);
        return promise;
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

everyauth.debug = false;
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


app.get('/', function (req, res) {
	console.log("User is logged in " + req.loggedIn);
	if (!req.loggedIn) {
		res.render('index', { title: CONFIG.name, layout: 'layout', errors: new Array()})
	}
	else
	{
		res.render('home', { title: CONFIG.name, layout: 'layout_full'})
	}

});

app.get('/home', function(req, res) {
//	if (!req.loggedIn) {
//		res.render('index', { title: CONFIG.name, layout: 'layout', errors: new Array()})
//	}
//	else
//	{
		res.render('home', { title: CONFIG.name, layout: 'layout_full'})
//	}
});

app.get('/test', function(req, res) {
	res.render('test', {
		title : CONFIG.name,
		layout : 'layout'
	})
});

app.get('/registered', function(req, res) {
	//Redirect the user to the thank you page
	
	//for some reason registration seems to log you in?
	//so we need to override this
	req.logout();
	res.render('registered', {
		title : 'Thank you for your registration'
	});
});

app.get('/logout', function(req, res) {
	req.logout();
	// res.render('')
	this.redirect(res, '/');
});

/**
 * This gets called when a user clicks on the confirmation link
 */
app.get('/confirm', function(req, res) {
	var token = req.param('token')
	console.log("Confirmation token is " + token);

	// Redirect the user to the password-set/confirm page
	res.render('confirm', {
		title : 'Set your Password',
		token : token,
		title : CONFIG.name,
		layout : 'layout'
	});

});

/**
 * This gets called when a user sets their password
 */
app.post('/setpassword', function(req, res) {
	if(req.param('password') === req.param('passwordConfirm')) {
		data.updateUser(function(user, error) {
			if(user) {
				if(!error) {
					//TODO: Login user automatically
					res.render('index', {
						title : CONFIG.name,
						layout : 'layout',
						errors : ["Password saved. You can now login"]
					});
				}
			} else {
				res.render('index', {
					title: CONFIG.name,
					layout: 'layout',
					errors: ["Error updating account"]
				});
			}
		}, req.param('token'), new Date(), req.param('password'));

	} else {
		console.log("Passwords do not match");
	}
});

/**
 * Gets called when a user clicks the forgot-password link
 */
app.get('/forgotpassword', function(req, res) {
	res.render('forgotpassword', {
		title : CONFIG.name,
		layout : 'layout'
	})
});

/**
 * Gets called when a user clicks the register link
 */
app.get('/register', function(req, res) {
	res.render('register', {
		title : CONFIG.name,
		layout : 'layout',
		errors: new Array()
	})
});

/**
 * Sends a password-reset link to the user
 */
app.post('/forgotpassword', function(req, res) {
	data.findUserByEmail(function(user) {
		if(user) {
			//if (!CONFIG.test) {
				var subject = "Dial Before you Dig Password Reset";
				var message = emailMessage.getPasswordResetEmail(user);
				mailer.sendEmail(user, subject, message);
			//}
					res.render('passwordreset', {
						title : CONFIG.name,
						layout : 'layout'
					});
		}
		else {
			res.render('emailerror', {
					title: CONFIG.name,
					layout: 'layout'
				});
		}
	}, req.param('email'));
});


app.get('/searches', function(req, res) {
    data.findUsersLastFiveQueries(function(enquiries) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(enquiries));
    }, req.user.emailAddress);
});

/**
 * Saves a users search parameters
 */
app.post('/savesearch', function(req, res) {
	data.saveEnquiry(function(enquiry) {
		console.log("saved enquiry " + req.param('enquiry') + " for " + req.user);
		res.send("ok");
	}, req.user.emailAddress, req.param('enquiryType'), req.param('searchTerm'), req.param('typeOfWork'), new Date(), req.param('customArea'));
});


app.post('/generatepdf', function(req, res) {
	
	data.findUsersLastQuery(function(enquiries) {
		
		pdf.generatePDF(function(req, res, result) {
            console.log("pdf sent : " + result);
            res.send("OK");
        }, req.user.emailAddress, enquiries, req, res);
        
    }, req.user.emailAddress);
    
});



var port = CONFIG.port;
app.listen(port, function() {
	console.log("Listening on " + port);
});

console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);