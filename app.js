
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , auth = require('everyauth')


var app = module.exports = express.createServer();

// Data provider
var DataProvider = require('./dataprovider').DataProvider;
var data = new DataProvider();

// Configuration

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.cookieParser());
  app.use(express.session({ secret: 'your secret here' }));
  app.use(require('stylus').middleware({ src: __dirname + '/public' }));
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
});

app.configure('production', function(){
  app.use(express.errorHandler()); 
});

// Routes

app.get('/', routes.index);

app.get('/home', function(req, res) {
	res.render('home', { title: 'Dial Before You Dig :: test', layout: 'layout' })
});

app.get('/test', function(req, res){
  res.render('test', { title: 'Dial Before You Dig :: test', layout: 'layout' })
});

/**
 * This gets called when you post the register form
 */
app.post('/register', function(req, res) {
	var emailAddress = req.param('emailAddress');
	console.log('Email Address is ' + emailAddress);
	
	//create a user
	
	//generate an access token
	
	//Email the user to activate their registration
	
	//Redirect the user to the thank you page
	res.render('registered', {title: 'Thank you for your registration' });
});

var port = process.env.PORT || 3000;
app.listen(port, function() {
  console.log("Listening on " + port);
});

console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);