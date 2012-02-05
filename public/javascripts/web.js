$(document).ready(function() {
	var geocoder;
	var map;
	var circle;
	var infowindow = new google.maps.InfoWindow();
	
	var drawingManager = new google.maps.drawing.DrawingManager({
		drawingControlOptions: {
			drawingModes: [google.maps.drawing.OverlayType.POLYGON, google.maps.drawing.OverlayType.RECTANGLE, google.maps.drawing.OverlayType.CIRCLE]
		}
	});
	
	
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
				drawingManager.setMap(map);
				loadJson(map);
			} 
			else 
			{
		        console.log("Geocode was not successful for the following reason: " + status);
			}
		});
	}
	
	initialize();
	
	function loadJson(map, center) {
		console.log("Loading the json");
		$.ajax({
          type: "GET",
          url: "javascripts/zones.json",
          cache: false,
          dataType: "json",
          success: function(data) {
				onJson(data, map);
			}
        });
	}
	
	function onJson(data,map) {
		// debugger;
		if (data && data.features) {
			
			var ft = new GeoJSON(data);
			if (ft.length) {
				// console.log("Number of features: " + ft.length);
				for (var i = 0; i < ft.length; i++){
					ft[i].setMap(map);
					setInfoWindow(ft[i], map);
				}
			}
			else
			{
				ft.setMap(map);
			}
		}
	}
	
	function setInfoWindow (feature, map) {
		google.maps.event.addListener(feature, "click", function(event) {
			// debugger;
			var content = "<div id='infoBox'><strong>Zone Properties</strong><br />";
			for (var j in this.geojsonProperties) {
				content += j + ": " + this.geojsonProperties[j] + "<br />";
			}
			content += "</div>";
			infowindow.setContent(content);
			infowindow.position = event.latLng;
			infowindow.open(map);
		});
	}
	
	
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
