var email = require("mailer");

var confirmUrl = "http://localhost:3000/confirm?token="; // To be changed
var website = "http://dialbeforeyoudig.herokuapp.com";

module.exports.sendEmail = function(user) {
	var date = new Date();
email.send({
	host : "smtp.gmail.com", // smtp server hostname
	port : "587", // for SSL support - REQUIRES NODE v0.3.x OR HIGHER
	domain : "localhost", // domain used by client to identify itself to server
	to : user.emailAddress,
	from : "Sprout Consulting <noreply@sprout.co.ke>",
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
	username : "user@gmail.com", // username
	password : "password"         // password
}, function(err, result) {
	if(err) {
		console.log("Could not send email");
	} else {
		console.log("Email sent")
	}
});
}
