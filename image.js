var CONFIG = require('config').Environment;
var to = "jokhessa@yahoo.com";
var from = CONFIG.mail_from_address;
var password = CONFIG.password;
var nodemailer = require("nodemailer");


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
	to : to, // list of receivers
	subject : "Test Email", // Subject line
	html : "<b>This is a test email</b>", // html body
	attachments : [{
		fileName : "text1.txt",
		contents : "hello world!"
	}, {
		fileName : "text4.txt",
		streamSource : fs.createReadStream("file.txt")
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

request.end();
