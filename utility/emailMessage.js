var CONFIG = require('config').Environment

var confirmUrl = CONFIG.url + "/confirm?token=";
var website = CONFIG.url;

module.exports.getActivationEmail = function(user) {
	
	var message = "<p>" + new Date() + "</p>"
		+ "<br />"
		+ "<p>Dear " + user.fullName + "</p>"
		+ "<br /><br />"
		+ "<p>Thank you for registering with the Check Before You Dig service. "
		+ "With your Username below, you now have access to our online enquiry service.</p>"
		+ "<br />"
		+ "<p>Before you can lodge an enquiry you need to confirm you have received this email correctly. "
		+ "You can do this by clicking on the following link and confirming your account.</p>"
		+ "<br />"
		+ "<p><a href='" + confirmUrl + user.token + "'>Validate your email address</a></p>"
		+ "<br />"
		+ "<p>To lodge a Check Before You Dig enquiry please visit our online service at "
		+ "<a href='" + website + "'>" + website + "</a> "
		+ "click on the link to request plans and follow the prompts.</p>"
		+ "<br />"
		+ "<p>Username: " + user.emailAddress + "</p>"
		+ "<br />"
		+ "<p>All users of this service acknowledge and agree that they have read and understood the terms and "
		+ "disclaimers on which this service is provided, which is set out at "
		+ "<a href='" + website + "'>" + website + "</a></p>";

		return message;
}

module.exports.getPasswordResetEmail = function(user) {
	var message = "<p>" + new Date() + "</p>"
		+ "<br />"
		+ "<p>Dear " + user.fullName + "</p>"
		+ "<br />"
		+ "<p>Use the link below to reset your password</p>"
		+ "<br />"
		+ "<p><a href='" + confirmUrl + user.token + "'>Reset Password</a></p>"
		+ "<br />"
		+ "<p>To lodge a Check Before You Dig enquiry please visit our online service at "
		+ "<a href='" + website + "'>" + website + "</a> "
		+ "click on the link to request plans and follow the prompts.</p>"
		+ "<br />"
		+ "<p>Username: " + user.emailAddress + "</p>"
		+ "<br />"
		+ "<p>All users of this service acknowledge and agree that they have read and understood the terms and "
		+ "disclaimers on which this service is provided, which is set out at "
		+ "<a href='" + website + "'>" + website + "</a></p>";
		
		return message;
}
