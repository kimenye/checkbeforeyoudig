var CONFIG = require('config').Environment;
var to = "CHANGEME";
var from = CONFIG.mail_from_address;
var password = CONFIG.password;
var nodemailer = require("nodemailer");
var BufferStream = require('bufferstream')


var http = require('http');
var url = require('url');
var fs = require('fs');
var PDFDocument = require('pdfkit-memory');

/**
 * See static maps documentation for additional parameters.
 * https://developers.google.com/maps/documentation/staticmaps/
 */

var base_url = 'http://maps.googleapis.com/maps/api/staticmap?';
var req_url = base_url + image_for(-4.0434771, 39.6682065, 640, 640, 16);

function image_for(lat, lon, width, height, zoom) {
	var params_url = 'sensor=false';

	if(lat && lon)
		params_url += '&center=' + lat + ',' + lon;

	if(width && height)
		params_url += '&size=' + width + 'x' + height;

	if(zoom)
		params_url += '&zoom=' + zoom;

	return params_url;
}

u = url.parse(req_url);

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
				mail(doc)
			//});
		});
	}
});

// create reusable transport method (opens pool of SMTP connections)
var smtpTransport = nodemailer.createTransport("SMTP", {
	service : "Gmail",
	auth : {
		user : from,
		pass : password
	}
});

request.end();

// setup e-mail data with unicode symbols
function mail(doc) {
	
	doc.output(function(out) {
		console.log("Length of output is " + out.length);
		stream = new BufferStream({encoding:'binary', size:'flexible'});

		stream.write(out);
		console.log('The stream is writtable ' + stream.readable);
		stream.end();
		
		

		var mailOptions = {
			from : "Sprout Consulting <" + from + ">", // sender address
			to : to, // list of receivers
			subject : "Test Email", // Subject line
			html : "<b>This is a test email</b>", // html body
			attachments : [{
				fileName : "text1.txt",
				contents : "hello world!"
			}, {
				fileName : "image.pdf",
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

			// if you don't want to use this transport object anymore, uncomment following line
			smtpTransport.close();
			// shut down the connection pool, no more messages
		});
	});
	
	
}


