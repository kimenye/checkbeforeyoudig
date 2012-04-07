var http = require('http');
var url = require('url');
var fs = require('fs');

/**
 * See static maps documentation for additional parameters.
 * https://developers.google.com/maps/documentation/staticmaps/
 */

var base_url = 'http://maps.googleapis.com/maps/api/staticmap?';
var req_url = base_url + image_for(-4.0434771,39.6682065,640,640, 16);

function image_for(lat, lon, width, height, zoom) {
	var params_url = 'sensor=false';
	
	if (lat && lon)
		params_url += '&center=' + lat + ',' + lon;
	
	if (width && height)
		params_url += '&size=' + width + 'x'+ height;
	
	if (zoom)
		params_url += '&zoom=' + zoom;
	
	return params_url;
}

u = url.parse(req_url);

var client = http.createClient(80, u['host']);
var request = client.request('GET', u['path'], {"host": u['host']});

console.log('Request made ' + u['host'] + u['path']);

request.addListener('response', function (response) {	
	console.log("Response is " + response.statusCode);
	if (response.statusCode == 200) {
		response.setEncoding('binary');
		var imageData = '';

		response.addListener('data', function(chunk) {
			// console.log('Data chunk added');
			imageData += chunk;
		});
		
		response.addListener('end', function() {
			fs.writeFile('image.png', imageData, 'binary', function(err) {
				if (err) throw err;
				console.log('File saved');	
			});
		});
	}
});



request.end();
