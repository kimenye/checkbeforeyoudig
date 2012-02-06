$(document).ready(function() {
	var geocoder, map, circle, rectangle;
	var zonesLayer, pipesLayer;

	var PIPES_TABLE = 2852415;
	var TEST_GEO = 2852795;
	var ZONES_TABLE = 2852009;
	var drawingMode = true;
	var selectedItem = null;
		
	/**
	 * Initialize the drawing manager
	 */
	var drawingManager = new google.maps.drawing.DrawingManager({
		drawingControlOptions: {
			drawingModes: [google.maps.drawing.OverlayType.POLYGON, google.maps.drawing.OverlayType.RECTANGLE], //google.maps.drawing.OverlayType.CIRCLE],
			position: google.maps.ControlPosition.TOP_RIGHT
		}
	});
	
	/**
	 * Event listner for when a polygon is completed
	 */
	google.maps.event.addListener(drawingManager, 'polygoncomplete', function(polygon) {
		searchCustom(polygon);
	});
	
	/**
	 * Event listner for when a rectangle is completed
	 */
	google.maps.event.addListener(drawingManager, 'rectanglecomplete', function(rectangle) {
		searchCustom(rectangle);
	});
	
	function searchCustom(customArea) {
		invalidate(selectedItem);
		map.fitBounds(customArea.getBounds());
		drawingMode = true;
		$('#txt_where').val('Selected Area').attr('disabled','disabled');
		$('#btn_clear').button( "option", "disabled", false );

		selectedItem = customArea;
	}
	
	function initMap() {
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
			} 
			else 
			{
		        console.log("Geocode was not successful for the following reason: " + status);
			}
		});
	}
	
	function initUI() {
		$('#result_tabs').tabs();
		$("#accordion").accordion({ header: "h4" });
		$("#header").css({ opacity: 0.9 });
		$("#sidebar").css({ opacity: 0.7 });
		$("#btn_submit").button( { disabled: false });
		$("#btn_clear").button( {disabled: true});
		
		$("#btn_clear").click(function(event) {
			reset();
		});
		
		$('#btn_submit').click(function(event) {
			var text = $('#txt_where').val();
			if (text && selectedItem == null) {
				search(text);
			}
			else if (selectedItem != null)
			{
				searchBounds(selectedItem.getBounds(), text);
			}
		});
		
		$("#txt_where").keypress(function(event) {
			if ( event.which == 13 ) {
				var text = $('#txt_where').val();
				if (text)
					search(text);
			}
		});
	}
	
	initMap();
	initUI();
	
	/** 
	 * Extend Google Maps to get bounds from a polygon
	 */	
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

	
	$(window).resize(function() {
		if (map) {
			google.maps.event.trigger(map, 'resize');
		}
	});
	
	/**
	 * Load the overlaps 
	 */
	function loadOverlays(bounds) {		
		var rect = 'RECTANGLE(LATLNG(' + bounds.getSouthWest().lat() + ',' + bounds.getSouthWest().lng() +'), LATLNG(' + bounds.getNorthEast().lat() + ',' + bounds.getNorthEast().lng() +'))';
		var where = 'ST_INTERSECTS(geometry,' + rect + ')';
		
		pipesLayer = new google.maps.FusionTablesLayer({
			query: {
				select: 'geometry',
				where: where,
				from: PIPES_TABLE
			}
		});
		pipesLayer.setMap(map);
		
		var pipeSQL = 'select OBJECTID, DIAMETER,Material,PLength from ' + PIPES_TABLE + ' where ' + where;
		$.ajax({
			type: "GET",
			url: "http://ft2json.appspot.com/q?sql=" + pipeSQL,
			dataType: "json",
			success: function(data) {
				$('#affected_pipes').html(data.count + " Pipes Affected");
				if (data.data) {
					var dt = data.data;
					var html = '<table id="table_pipes"><thead><th>Id</th><th>Material</th><th>Length</th></thead><tbody>';
					for(var idx=0;idx<data.data.length;idx++) {
						html += '<tr><td>' + dt[idx].OBJECTID + '</td>' + '<td>' + dt[idx].Material + '</td><td>' + Math.round(dt[idx].PLength) + '</td></tr>';
					}
					html += '</tbody></html>';
					$('#pipes').html(html);
					$('#table_pipes').dataTable({
					        "bPaginate": false,
					        "bLengthChange": false,
					        "bFilter": false,
					        "bSort": false,
					        "bInfo": false,
					        "bAutoWidth": false
					    });
					// $('#searches').resize();
				}
			}
		});
		
		zonesLayer = new google.maps.FusionTablesLayer({
			query: {
				select: 'geometry',
				where: where,
				from: ZONES_TABLE
			}
		});
		
		var zoneSQL = 'select Main_Area,Book_Name,Id from ' + ZONES_TABLE + ' where ' + where;
		$.ajax({
			type: "GET",
			url: "http://ft2json.appspot.com/q?sql=" + zoneSQL,
			dataType: "json",
			success: function(data) {
				$('#affected_zones').html(data.count + " Zones Affected");
				if (data.data) {
					var dt = data.data;
					var html = '<table id="table_zones"><thead><th>Id</th><th>Area</th></thead><tbody>';
					for(var idx=0;idx<data.data.length;idx++) {
						html += '<tr><td>' + dt[idx].Id + '</td>' + '<td>' + dt[idx].Main_Area + '</td></tr>';
					}
					html += '</tbody></html>';
					$('#zones').html(html);
					$('#table_zones').dataTable({
					        "bPaginate": false,
					        "bLengthChange": false,
					        "bFilter": false,
					        "bSort": false,
					        "bInfo": false,
					        "bAutoWidth": false
					    });
					$('#searches').resize();
				}
			}
		});
		
		zonesLayer.setMap(map);
	}
	
	function searchBounds(bounds,text) {
		deactivate();
		loadOverlays(bounds);
		
		$('#sidebar').removeClass('hide');
		var id = text.replace(/ /g,'');
		$('#searches').append('<li id="li_result"><a href="#">' + text + '</a><a id="rm_result" href="#" class="ui-icon ui-icon-trash right"></li>');


		$('#rm_result').click(function() {
			// clearSearch(id);
			reset();
		});
	}
	
	
	/**
	 * Search. Create a bounds using the geocode
	 */
	function search(text) {
		geocoder.geocode( { 'address' : text + ', Mombasa'}, function(results,status) {
			if (status == google.maps.GeocoderStatus.OK) {
				var point = results[0].geometry;
				
				console.log("Pos: " + point.location.lat() + "," + point.location.lng());
				
				invalidate(rectangle);	
				rectangle = new google.maps.Rectangle({ bounds: point.viewport });
				rectangle.setMap(map);
				map.fitBounds(point.viewport);
				searchBounds(point.viewport, text);
			}
			else
			{
				console.log("Geocode was not successful for the following reason: " + status);
			}
		});
	}
	
	
	/**
	 * Invalidate a map object
	 */
	function invalidate(obj,dontNullify) {
		if (obj) {
			obj.setMap(null);
			if (dontNullify)
				obj = null;
		}
	}
	
	/**
	 * Deactivate when we are performing a search
	 */
	function deactivate() {
		invalidate(drawingManager, true);
		
		$('#no-searches').addClass('hide');					
		$('#searches').resize();
		$('#txt_where').attr('disabled','disabled');
		$('#btn_submit').button( "option", "disabled", true );
		$('#btn_clear').button( "option", "disabled", false );
	}
	
	/**
	 * Reset the search
	 */
	function reset() {
		invalidate(rectangle);
		invalidate(zonesLayer);
		invalidate(pipesLayer);
		invalidate(selectedItem);
		drawingManager.setMap(map);
		
		$('#txt_where').removeAttr('disabled').val('');
		$('#btn_submit').button('option', "disabled", false);
		$('#btn_clear').button( "option", "disabled", true );
		$('#sidebar').addClass('hide');
		$('#li_result').remove();
	}
	
	function test() {
		$('#txt_where').val('Changamwe');
	}
	// test();
	
});
