$(document).ready(function() {
	var zonesLayer, pipesLayer;

    var Data = {
        INITIAL_ZOOM: 12,
        PIPES_TABLE: 2852415,
        TEST_GEO: 2852795,
        ZONES_TABLE:2852009
    };

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

    function getPolylineToSave(usrPath) {
        if (usrPath && usrPath.getPaths()) {
            var pts = [];

            for(var idx=0;idx<usrPath.getPath().length;idx++) {
                var latlng = usrPath.getPath().getAt(idx);
                pts[pts.length] = { "lat" : latlng.lat(), "lng" : latlng.lng() };
            }
            return pts;
        }
        return null;
    }

    function Result(bounds) {
        this.bounds = bounds;
    }

	function ViewModel() {
		var self = this;
        var map, geocoder, startingPosition, rectangle;
        var EnquiryType = { searchByName : 0, searchByCustomArea : 1};

		self.searchTerm = ko.observable("Changamwe");
		self.typeOfWork = ko.observable();
        self.previousSearches = ko.observableArray([]);
        self.polygon = ko.observable(null);
        self.searchResult = ko.observable();

        self.enquiryType = ko.computed(function() {
            if (self.polygon() != null)
                return EnquiryType.searchByCustomArea;
            else
                return EnquiryType.searchByName;
        });

        self.isCustomAreaSearch = ko.computed(function() {
            return self.enquiryType() == EnquiryType.searchByCustomArea;
        })

        self.doSearch = function() {
            geocoder.geocode( { 'address' : self.searchTerm() + ', Mombasa'}, function(results,status) {
                if (status == google.maps.GeocoderStatus.OK) {
                    var point = results[0].geometry;
                    rectangle = new google.maps.Rectangle({ bounds: point.viewport });
                    rectangle.setMap(map);
                    map.fitBounds(point.viewport);
                    self.searchBounds(point.viewport);
                }
                else
                {
                    console.log("Geocode was not successful for the following reason: " + status);
                }
            });
        };

        self.clearSearch = function() {
            console.log("Performing search");
            self.polygon(null);
            self.searchTerm(null);
            self.searchResult(null);
            rectangle.setMap(null);

            map.fitBounds(startingPosition.viewport);
        };

        /**
         * Initialize the drawing manager
         */
        var drawingManager = new google.maps.drawing.DrawingManager({
            drawingControlOptions: {
                drawingModes: [google.maps.drawing.OverlayType.POLYGON],
                position: google.maps.ControlPosition.TOP_RIGHT
            }
        });

        /**
         * Event listener for when a polygon is completed
         */
        google.maps.event.addListener(drawingManager, 'polygoncomplete', function(polygon) {
            self.polygon(polygon);
        });

        self.polygon.subscribe(function(newValue) {
            self.searchTerm("Custom Area");
            self.searchCustom();
        });

        $(window).resize(function() {
            if (map) {
                google.maps.event.trigger(map, 'resize');
            }
        });

        self.searchBounds = function(bounds) {
            self.searchResult(new Result(bounds));
            $.ajax({
                type : "POST",
                url : "savesearch",
                data : {
                    enquiryType : self.enquiryType(),
                    searchTerm : self.searchTerm(),
                    typeOfWork : self.typeOfWork(),
                    customArea : getPolylineToSave(self.polygon())
                }
            });
        }

        self.searchCustom = function() {
            map.fitBounds(self.polygon().getBounds());
        }

        self.initMap = function() {
            geocoder = new google.maps.Geocoder();
            geocoder.geocode( { 'address':  'Mombasa, Coast'}, function(results, status) {
                if (status == google.maps.GeocoderStatus.OK) {
                    var myOptions = {
                        zoom: Data.INITIAL_ZOOM,
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
                    startingPosition = results[0].geometry;
                }
                else
                {
                    console.log("Geocode was not successful for the following reason: " + status);
                }
            });
        };
        self.initMap();
	}

	ko.applyBindings(new ViewModel());


	/**
	 * Load the overlays
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
//				$('#affected_pipes').html(data.count + " Pipes Affected");
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
					// $('#searches').resize();
				}
			}
		});
		
		zonesLayer.setMap(map);
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
		// $('#searches').resize();
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
		invalidate(cstmArea);
		drawingManager.setMap(map);


	}
	
	function test() {
		$('#txt_where').val('Changamwe');
		//$('#dialog').dialog('open');
	}
	//test();
	
});
