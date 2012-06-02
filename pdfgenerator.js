var CONFIG = require('config').Environment;
var from = CONFIG.mail_from_address;
var password = CONFIG.password;
var nodemailer = require("nodemailer");
var BufferStream = require('bufferstream')


var http = require('http');
var url = require('url');
var fs = require('fs');
var PDFDocument = require('pdfkit-memory');

PDFGenerator = function() {
};

PDFGenerator.prototype.generatePDF = function(callback, emailAddress, enquiry) {
	console.log(enquiry);
	doc = new PDFDocument();
	doc.text("Check Before You Dig", {align : "center"});
	mail(doc, emailAddress);
}


// create reusable transport method (opens pool of SMTP connections)
var smtpTransport = nodemailer.createTransport("SMTP", {
	service : "Gmail",
	auth : {
		user : from,
		pass : password
	}
});

// setup e-mail data with unicode symbols
function mail(doc, emailAddress) {
	
	doc.output(function(out) {
		console.log("Length of output is " + out.length);
		stream = new BufferStream({encoding:'binary', size:'flexible'});

		stream.write(out);
		console.log('The stream is writtable ' + stream.readable);
		stream.end();
		
		

		var mailOptions = {
			from : "Sprout Consulting <" + from + ">", // sender address
			to : emailAddress, // list of receivers
			subject : "Check Before you Dig Report", // Subject line
			html : "<b>Thank you for using Check Before you Dig. Attached is a pdf document of your search query results.</b>", // html body
			attachments : [{
				fileName : "Report.pdf",
				streamSource : stream
			}]
		}


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
	});
	
	
}

exports.PDFGenerator = PDFGenerator;