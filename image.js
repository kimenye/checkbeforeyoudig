// Node_mailer
var email = require("mailer");
var CONFIG = require('config').Environment;
var to = "jokhessa@yahoo.com";
var from = CONFIG.mail_from_address;
var password = CONFIG.password;
var subject = "Test Email";

function sendEmail() {
	email.send({
		host : CONFIG.smtp_server, // smtp server hostname
		port : CONFIG.smtp_port, // for SSL support - REQUIRES NODE v0.3.x OR HIGHER
		domain : "localhost", // domain used by client to identify itself to server
		to : to,
		from : "Sprout Consulting <" + from + ">",
		subject : subject,
		authentication : "login", // auth login is supported; anything else is no auth
		username : from, // username
		password : password,         // password
		attachments : [{
			fileName : "text1.txt",
			contents : "hello world!"
		}]
	}, function(err, result) {
		if(err) {
			console.log("Could not send email");
		} else {
			console.log("Email sent")
		}
	});
}

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

request.addListener('response', function(response) {
	console.log("Response is " + response.statusCode);
	if(response.statusCode == 200) {
		response.setEncoding('binary');
		var imageData = '';

		var bufSize = 64 * 1024;
		var bufPos = 0;
		var buf = new Buffer(bufSize);

		response.addListener('data', function(chunk) {
			// console.log('Data chunk added');
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
			fs.writeFile('image.png', imageData, bufPos, 'binary', function(err) {
				if(err)
					throw err;
				console.log('File saved');
				doc = new PDFDocument();

				if(bufPos != 0) {
					buf = buf.slice(0, bufPos);
				};
				//buffer = new Buffer(imageData.length);

				//doc.image(imageData, 100,100);
				// console.log("Chunk size " + buf.readUInt32());
				doc.imageFromBuffer(buf, 100, 100);
				doc.write('image.pdf');
			});
		});
	}
});

request.end();
sendEmail();
