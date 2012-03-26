// Not complete - at the moment it sends to my email address (the hardcoded one)
// but doesn't work with the passed in email parameter - will debug today

var nodemailer = require("nodemailer");

var emailAddress;

var Mailer = function(emailAddress) {
	this.emailAddress = emailAddress;
}
// create reusable transport method (opens pool of SMTP connections)
var smtpTransport = nodemailer.createTransport("SMTP", {
	service : "Gmail",
	auth : {
		user : "user@gmail.com",  // Was using my gmail credentials for testing
		pass : "password"
	}
});

// setup e-mail data with unicode symbols
var mailOptions = {
	from : "Sprout Consulting <noreply@sprout.co.ke>", // sender address
	to : "jokhessa@yahoo.com", // list of receivers
	subject : "Hello", // Subject line
	text : "Hello world text", // plaintext body
	html : "<b>Hello world html</b>" // html body
}

module.exports.sendEmail = function(emailAddress) {
	var mailer = new Mailer(emailAddress);

	// send mail with defined transport object
	smtpTransport.sendMail(mailOptions, function(error, response) {
		if(error) {
			console.log(error);
		} else {
			console.log("Message sent: " + response.message);
		}
		smtpTransport.close();
		// shut down the connection pool, no more messages
	});
}