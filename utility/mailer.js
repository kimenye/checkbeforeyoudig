var email = require("mailer");
var CONFIG = require('config').Environment

var confirmUrl = CONFIG.url + "/confirm?token=";
var website = CONFIG.url;
var from = CONFIG.mail_from_address;

module.exports.sendEmail = function(user) {
	var date = new Date();
	email.send({
		host : "smtp.gmail.com", // smtp server hostname
		port : "587", // for SSL support - REQUIRES NODE v0.3.x OR HIGHER
		domain : "localhost", // domain used by client to identify itself to server
		to : user.emailAddress,
		from : "Sprout Consulting <" + from + ">",
		subject : "Dial Before you Dig Registration Confirmation",
		template : "public/templates/emailTemplate.txt", // path to template
		data : {
			"date" : date,
			"user" : "Jane Doe",
			"username" : user.emailAddress,
			"confirm" : confirmUrl + user.token,
			"website address" : website
		},
		authentication : "login", // auth login is supported; anything else is no auth
		username : from, // username
		password : "password"         // password
	}, function(err, result) {
		if(err) {
			console.log("Could not send email");
		} else {
			console.log("Email sent")
		}
	});
}
