var CONFIG = require('config').Environment;

var from = CONFIG.mail_from_address;
var password = CONFIG.password;
var nodemailer = require("nodemailer");

module.exports.sendEmail = function(user, subject, message) {
	// create reusable transport method (opens pool of SMTP connections)
	var smtpTransport = nodemailer.createTransport("SMTP", {
		service : "Gmail",
		auth : {
			user : from,
			pass : password
		}
	});

	// setup e-mail data with unicode symbols
	var mailOptions = {
		from : "Sprout Consulting <" + from + ">", // sender address
		to : user.emailAddress, // list of receivers
		subject : subject, // Subject line
		html : message // html body
	}

	// send mail with defined transport object
	smtpTransport.sendMail(mailOptions, function(error, response) {
		if(error) {
			console.log(error);
		} else {
			console.log("Message sent: " + response.message);
		}

		// if you don't want to use this transport object anymore, uncomment following line
		smtpTransport.close();
		// shut down the connection pool, no more messages
	});
}