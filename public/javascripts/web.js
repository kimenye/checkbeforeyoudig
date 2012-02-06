function Selection(id) {
	
}


$(document).ready(function() {
	var geocoder;
	var map;
	var circle, rectangle;
	var zonesLayer, pipeLayer;
	var infowindow = new google.maps.InfoWindow();
	var PIPES_TABLE = 2852415;
	var TEST_GEO = 2852795;
	var ZONES_TABLE = 2852009;
	
	var selections;
	
	var drawingManager = new google.maps.drawing.DrawingManager({
		drawingControlOptions: {
			drawingModes: [google.maps.drawing.OverlayType.POLYGON, google.maps.drawing.OverlayType.RECTANGLE, google.maps.drawing.OverlayType.CIRCLE],
			position: google.maps.ControlPosition.TOP_RIGHT
		}
	});
	
	
	function initialize() {
		geocoder = new google.maps.Geocoder();
		geocoder.geocode( { 'address':  'Mombasa, Coast'}, function(results, status) {
			if (status == google.maps.GeocoderStatus.OK) {
				console.log("Pos: " + results[0].geometry.location.lat() + "," + results[0].geometry.location.lng());
				var myOptions = {
					zoom: 12,
					center: results[0].geometry.location,
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
				map = new google.maps.Map(document.getElementById("map_canvas"), myOptions);
				drawingManager.setMap(map);
				//loadJson(map);
				loadFusionTable(map);
				//search($('#txt_where').val());
			} 
			else 
			{
		        console.log("Geocode was not successful for the following reason: " + status);
			}
		});
	}
	
	initialize();
	
	function loadFusionTable(map) {
		zonesLayer = new google.maps.FusionTablesLayer(ZONES_TABLE, {
			suppressInfoWindows: true
		});
		zonesLayer.setMap(map);
	}
	
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
		if (data && data.features) {
			
			var bd = new google.maps.LatLngBounds();
			var ft = new GeoJSON(data, parcelStyle);
			if (ft.length) {
				for(var i=0;i<ft.length;i++) {
					setupFeature(ft[i], map);
					var p = ft[i].getBounds();
					bd.union(p);
				}
			}
			else
			{
				setupFeature(ft,map);
				bd.union(ft.getBounds());
			}
			map.fitBounds(bd);
			map.setCenter(bd.getCenter());
		}
	}
	
	function setupFeature(feature,map) {
		feature.setMap(map);
		setInfoWindow(feature,map);
	}
	
	function setInfoWindow (feature, map) {
		google.maps.event.addListener(feature, "click", function(event) {
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
	
	var parcelStyle = {
		strokeColor: "#FF7800",
		strokeOpacity: 1,
		strokeWeight: 1,
		fillColor: "#46461F",
		fillOpacity: 0.15
	};
	
	function getZoomForBounds(bounds) {
		var GLOBE_WIDTH = 256; // a constant in Google's map projection
		var west = bounds.getSouthWest().lng();
		var east = bounds.getNorthEast().lng();
		var angle = east - west;
		if (angle < 0) {
		  angle += 360;
		}
		console.log($('#map_canvas').width());
		var zoom = Math.round(Math.log($('#map_canvas').width() * 360 / angle / GLOBE_WIDTH) / Math.LN2);
		return zoom;
	}
	
	if (!google.maps.Polygon.prototype.getBounds) {
        google.maps.Polygon.prototype.getBounds = function(latLng) {
            var bounds = new google.maps.LatLngBounds();
            var paths = this.getPaths();
            var path;
            for (var p = 0; p < paths.getLength(); p++) {
                path = paths.getAt(p);
                for (var i = 0; i < path.getLength(); i++) {
                    bounds.extend(path.getAt(i));
                }
            }
            return bounds;
        }
    }
	
	$("#accordion").accordion({ header: "h4" });
	$("#header").css({ opacity: 0.9 });
	$("#sidebar").css({ opacity: 0.7 });
	$("#btn_submit").button( { disabled: false });
	$('#btn_submit').click(function(event) {
		var text = $('#txt_where').val();
		if (text) {
			search(text);
		}
	});
	
	$(window).resize(function() {
		if (map) {
			google.maps.event.trigger(map, 'resize');
		}
	});
	
	$("#txt_where").keypress(function(event) {
		if ( event.which == 13 ) {
			search($('#txt_where').val());
		}
	});
	
	function loadPipes(map,bounds) {
// /		debugger;
		//where ST_INTERSECTS(geometry, RECTANGLE(LATLNG(49.289, -123.144), LATLNG(49.292, -123.138)))
		
		var where = 'ST_INTERSECTS(geometry, RECTANGLE(LATLNG(' + bounds.getNorthEast().lat() + ',' + bounds.getNorthEast().lng() +'), LATLNG(' + bounds.getSouthWest().lat() +',' +  bounds.getSouthWest().lng() +')))';
		console.log(where);
		
		var c = 'ST_INTERSECTS(geometry, CIRCLE(LATLNG(' + bounds.getCenter().lat() + ',' + bounds.getCenter().lng() +'),1)';
		console.log(c);
		
		circle = new google.maps.Circle({center: bounds.getCenter(), map: map, radius: 1000});
		
		var pipes = new google.maps.FusionTablesLayer({
			query: {
				select: 'geometry',
				where: c,
				from: PIPES_TABLE
			}
		});
		pipes.setMap(map);
	}
	
	function search(text) {
		geocoder.geocode( { 'address' : text + ', Mombasa'}, function(results,status) {
			if (status == google.maps.GeocoderStatus.OK) {
				var point = results[0].geometry;
				
				console.log("Pos: " + point.location.lat() + "," + point.location.lng());
				
				if (rectangle) {
					rectangle.setMap(null);
					rectangle = null;
				}
				
				rectangle = new google.maps.Rectangle({ bounds: point.viewport });
				rectangle.setMap(map);
				map.fitBounds(point.viewport);
				
				var id = text.replace(/ /g,'');
				
				$('#no-searches').addClass('hide');					
				$('#searches').append('<li id="li_' + id + '"><a id="' + id +'" href="#">' + text + '</a><a id="rm_' + id +  '" href="#" class="ui-icon ui-icon-trash right"></li>');
				$('#searches').resize();
				$('#txt_where').attr('disabled','disabled');
				$('#btn_submit').button( "option", "disabled", true );
				loadPipes(map, point.viewport);

				// $('#' + id).click(function() {
				// 					if (rectangle) {
				// 						rectangle.setMap(null);
				// 						rectangle = null;
				// 					}
				// 					rectangle = new google.maps.Rectangle({ bounds: point.viewport });
				// 					rectangle.setMap(map);
				// 					map.fitBounds(point.viewport);
				// 				});
				
				$('#rm_' + id).click(function() {
					if (rectangle) {
						rectangle.setMap(null);
						rectangle = null;
					}
					
					$('#li_' + id).remove();
				});
				
				
			}
			else
			{
				console.log("Geocode was not successful for the following reason: " + status);
			}
			// $('#loading').removeClass('overlay');
		});
	}
	
});
