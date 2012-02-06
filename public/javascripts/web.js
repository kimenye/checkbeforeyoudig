$(document).ready(function() {
	var geocoder;
	var map;
	var circle, rectangle;
	var infowindow = new google.maps.InfoWindow();
	
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
			} 
			else 
			{
		        console.log("Geocode was not successful for the following reason: " + status);
			}
		});
	}
	
	initialize();
	
	function loadFusionTable(map) {
		var layer = new google.maps.FusionTablesLayer(2852009, {
			suppressInfoWindows: true
		});
		layer.setMap(map);
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
	$("#btn_submit").button( { disabled: true });
	
	$(window).resize(function() {
		if (map) {
			google.maps.event.trigger(map, 'resize');
		}
	});
	
	$("#txt_where").keypress(function(event) {
		if ( event.which == 13 ) {
			$('#loading').addClass('overlay');
			search($('#txt_where').val());
		}
	});
	
	function search(text) {
		geocoder.geocode( { 'address' : text + ', Mombasa'}, function(results,status) {
			if (status == google.maps.GeocoderStatus.OK) {
				var point = results[0].geometry;
				//debugger;
				console.log("Pos: " + point.location.lat() + "," + point.location.lng());

				// if (circle) {
				// 					circle.setMap(null);
				// 					circle = null;
				// 				}
				// 				 
				// 				circle = new google.maps.Circle({radius: 1000, center: point.location});
				// 				circle.setMap(map);
				
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
				
				
				
				$('#' + id).click(function() {
					if (rectangle) {
						rectangle.setMap(null);
						rectangle = null;
					}
					rectangle = new google.maps.Rectangle({ bounds: point.viewport });
					rectangle.setMap(map);
					map.fitBounds(point.viewport);
				});
				
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
			$('#loading').removeClass('overlay');
		});
	}
	
});
