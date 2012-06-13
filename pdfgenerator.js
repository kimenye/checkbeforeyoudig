var CONFIG = require('config').Environment;
var from = CONFIG.mail_from_address;
var password = CONFIG.password;
var nodemailer = require("nodemailer");
var BufferStream = require('bufferstream')


var http = require('http');
var url = require('url');
var fs = require('fs');
var PDFDocument = require('pdfkit-memory');
var request = null;

PDFGenerator = function() {
};

PDFGenerator.prototype.generatePDF = function(callback, emailAddress, enquiry) {
	/*
	console.log(enquiry);
		doc = new PDFDocument();
		doc.text("Check Before You Dig", {align : "center"});
		mail(doc, emailAddress);*/
		
		generate(emailAddress);

}

function generate(emailAddress) {
	u = url.parse("http://maps.googleapis.com/maps/api/staticmap?sensor=false&center=-4.0434771,39.6682065&size=640x640&zoom=16");

var client = http.createClient(80, u['host']);
var request = client.request('GET', u['path'], {
	"host" : u['host']
});

console.log('Request made ' + u['host'] + u['path']);

doc = new PDFDocument();

request.addListener('response', function(response) {
	console.log("Response is " + response.statusCode);
	if(response.statusCode == 200) {
		response.setEncoding('binary');
		var imageData = '';

		var bufSize = 64 * 1024;
		var bufPos = 0;
		var buf = new Buffer(bufSize);

		response.addListener('data', function(chunk) {
			imageData += chunk;
			var bufNextPos = bufPos + chunk.length;
			if(bufNextPos == bufSize) {
				buf.write(chunk, 'binary', bufPos);
				res.write(buf);
				bufPos = 0;
			} else {
				buf.write(chunk, 'binary', bufPos);
				bufPos = bufNextPos;
			}

		});

		response.addListener('end', function() {
			//fs.writeFile('image.png', imageData, bufPos, 'binary', function(err) {
				//if(err)
					//throw err;
				//console.log('File saved');
				

				if(bufPos != 0) {
					buf = buf.slice(0, bufPos);
				};
				doc.imageFromBuffer(buf, 100, 100);
				// doc.write('image.pdf');
				mail(doc, emailAddress);
			//});
		});
	}
});
}


// create reusable transport method (opens pool of SMTP connections)
var smtpTransport = nodemailer.createTransport("SMTP", {
	service : "Gmail",
	auth : {
		user : from,
		pass : password
	}
});

if(request) {
	request.end();
}

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