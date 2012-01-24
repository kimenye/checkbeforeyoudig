$(document).ready(function() {
	var geocoder;
	var map;
	
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
			console.log("Resizing the map");
			//map.onResize();
			google.maps.event.trigger(map, 'resize');
		}
	});
});
