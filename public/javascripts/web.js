$(document).ready(function() {
	var geocoder;
	var map;
	var circle;
	
	function initialize() {
		geocoder = new google.maps.Geocoder();
		geocoder.geocode( { 'address':  'Mombasa, Coast'}, function(results, status) {
			if (status == google.maps.GeocoderStatus.OK) {
				console.log("Pos: " + results[0].geometry.location.lat() + "," + results[0].geometry.location.lng());
				var myOptions = {
					zoom: 13,
					center: results[0].geometry.location,
					mapTypeId: google.maps.MapTypeId.ROADMAP
				};
				map = new google.maps.Map(document.getElementById("map_canvas"), myOptions);
			} 
			else 
			{
		        console.log("Geocode was not successful for the following reason: " + status);
			}
		});
	}
	
	initialize();
	
	$(window).resize(function() {
		if (map) {
			google.maps.event.trigger(map, 'resize');
		}
	});
	
	$('#submit_query').bind("click", function(event, ui) {
		var text = $('#start_address').val();
		
		if (text.length > 0) {
			console.log('Geocoding ' + text);
			$('#loading').addClass('overlay');
			geocoder.geocode( { 'address' : text + ', Mombasa'}, function(results,status) {
				if (status == google.maps.GeocoderStatus.OK) {
					var point = results[0].geometry;
					// debugger;
					console.log("Pos: " + results[0].geometry.location.lat() + "," + results[0].geometry.location.lng());
					// console.log()
					// var topRight = point.viewport.getNorthEast();
					// var bottomLeft = point.viewport.getSouthWest();
					// var distance = topRight.distanceFrom(bottomLeft) * 1000;
					// 
					// console.log("Distance : " + distance);
					
					if (circle) {
						circle.setMap(null);
						circle = null;
					}
					 
					circle = new google.maps.Circle({radius: 1000, center: point.location});
					// map.fitBounds(circle.getBounds());
					circle.setMap(map);
				}
				else
				{
					console.log("Geocode was not successful for the following reason: " + status);
				}
				$('#loading').removeClass('overlay');
			});
		}
	});
});
