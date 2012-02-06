$(document).ready(function() {
	var map;
	var PIPES_TABLE = 2852415;
	var TEST_GEO = 2852795;
	var ZONES_TABLE = 2852009;
	
	
	$('#submit').button();
	$('#submit').click(function(event) {
		var text = $('#criteria').val();
		if (text) {
			log("Geocoding " + text + " ...");
			search(text);
		}
	});
	
	function search(text) {
		var geocoder = new google.maps.Geocoder();
		geocoder.geocode( { 'address' : text + ', Mombasa'}, function(results,status) {
			if (status == google.maps.GeocoderStatus.OK) {
				var point = results[0].geometry;
				var bounds = point.viewport;
				
				log('Changamwe found!');
				log("Pos: " + point.location.lat() + "," + point.location.lng());
				
				log('Preparing bounding box for changamwe...');
				log('Center: ' + bounds.getCenter().lat() + "," + bounds.getCenter().lng());
				
				var myOptions = {
					zoom: 12,
					center: point.location,
					disableDefaultUI: true,
					mapTypeId: google.maps.MapTypeId.ROADMAP,
					panControlOptions: {
						position: google.maps.ControlPosition.RIGHT_CENTER
					},
					zoomControlOptions: {
					       style: google.maps.ZoomControlStyle.LARGE,
				        position: google.maps.ControlPosition.RIGHT_CENTER
				    },
					streetViewControl: false					
				};
				map = new google.maps.Map(document.getElementById("mapimage"), myOptions);
				map.fitBounds(point.viewport);
								
				//The syntax is: RECTANGLE(<lower_left_corner>, <upper_right_corner>)
				var rect = 'RECTANGLE(LATLNG(' + bounds.getSouthWest().lat() + ',' + bounds.getSouthWest().lng() +'), LATLNG(' + bounds.getNorthEast().lat() + ',' + bounds.getNorthEast().lng() +'))';
				log('Bounding box: ' + rect);
				
				var rectangle = new google.maps.Rectangle({ bounds: point.viewport });
				rectangle.setMap(map);
				
				//Full query
				var where = 'ST_INTERSECTS(geometry,' + rect + ')';
				var select = 'select * from ' + ZONES_TABLE + ' where ' + where;
				log('Zones select is:' + select);
				
				var query = 'https://www.google.com/fusiontables/api/query?sql=' + select;
				log('Query is: ' + query);
				
				log('<a href="' + query + '" target="_blank">Run it</a>');
				
				log('Runing the query');
				
				// ft2json.query(
				// 					select,
				// 					function(result) {
				// 						debugger;
				// 					}
				// 				);
				$.ajax({
					type: "GET",
					url: "http://ft2json.appspot.com/q?sql=" + select,
					dataType: "json",
					success: function(data) {
						log("Query successful");
						log("Number of intersecting features : " + data.count);
						log("Preparing Fusion Layer");
						
						var layer = new google.maps.FusionTablesLayer({
							query: {
								select: 'geometry',
								where: where,
								from: ZONES_TABLE
							}
						});
						layer.setMap(map);
						
						log("Done!");
						log("Checking interest against pipes");
						
						//var select = 'select * from ' + PIPES_TABLE + ' where ' + where;
						
						var pipesLayer = new google.maps.FusionTablesLayer({
							query: {
								select: 'geometry',
								where: where,
								from: PIPES_TABLE
							}
						});
						pipesLayer.setMap(map);
						log("Done!");
					}
				});
				
				
			}
		});
	}
	
	function log(text) {
		$('#results').append('<li>' + text + '</li>');
	}
});