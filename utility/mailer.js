var email = require("mailer");
var CONFIG = require('config').Environment

var confirmUrl = CONFIG.url + "/confirm?token=";
var website = CONFIG.url;
var from = CONFIG.mail_from_address;
var password = CONFIG.password;

module.exports.sendEmail = function(user, subject, template) {
	var date = new Date();
	
	email.send({
		host : CONFIG.smtp_server, // smtp server hostname
		port : CONFIG.smtp_port, // for SSL support - REQUIRES NODE v0.3.x OR HIGHER
		domain : "localhost", // domain used by client to identify itself to server
		to : user.emailAddress,
		from : "Sprout Consulting <" + from + ">",
		subject : subject,
		template : template, // path to template
		data : {
			"date" : date,
			"user" : user.fullName,
			"username" : user.emailAddress,
			"confirm" : confirmUrl + user.token,
			"website address" : website
		},
		authentication : "login", // auth login is supported; anything else is no auth
		username : from, // username
		password : password         // password
	}, function(err, result) {
		if(err) {
			console.log("Could not send email");
		} else {
			console.log("Email sent")
		}
	});
}
