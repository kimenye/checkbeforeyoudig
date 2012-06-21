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

    /**
     * Convert the custom area into an object we can save
     * @param usrPath
     * @return {*}
     */
    function getLinesToSave(usrPath) {
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

    /**
     * Result object
     * @param bounds
     * @constructor
     */
    function Result(bounds) {
        var me = this;
        me.bounds = bounds;
        me.pipes = ko.observableArray([]);
    }

    /**
     * KnockoutJS VM
     * @constructor
     */
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
            if (!self.isCustomAreaSearch()) {
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
            }
            else {
                self.searchBounds(self.polygon().getBounds());
            }
        };

        self.emailMe = function() {

            $('#emailMe').button('loading');
            $.ajax({
                type: "GET",
                url: "/generatepdf",
                success: function(data) {
                    console.log("Success" + data);
                    if (data == "OK") {
//                        alert("Results sent to your registered email");
                    }
                    $('#emailMe').button('reset');
                }
            });

        };

        self.clearSearch = function() {
            self.detach(self.polygon());
            self.polygon(null);
            self.searchTerm(null);
            self.searchResult(null);
            self.detach(rectangle);
            self.detach(pipesLayer);
            drawingManager.setDrawingMode(null);
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
            //remove the old polygon if its still there
            self.detach(self.polygon());
            self.polygon(polygon);
        });

        self.detach = function(item) {
            if (item != null)
                item.setMap(null);
        }

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
                    customArea : getLinesToSave(self.polygon())
                }
            });
            self.loadOverlays(bounds);
        }

        self.searchCustom = function() {
            if (self.polygon() != null)
                map.fitBounds(self.polygon().getBounds());
        }

        self.loadOverlays = function(bounds) {
            var rect = 'RECTANGLE(LATLNG(' + bounds.getSouthWest().lat() + ',' + bounds.getSouthWest().lng() +'), LATLNG(' + bounds.getNorthEast().lat() + ',' + bounds.getNorthEast().lng() +'))';
            var where = 'ST_INTERSECTS(geometry,' + rect + ')';

            pipesLayer = new google.maps.FusionTablesLayer({
                query: {
                    select: 'geometry',
                    where: where,
                    from: Data.PIPES_TABLE
                }
            });
            pipesLayer.setMap(map);

            var pipeSQL = 'select OBJECTID, DIAMETER,Material,PLength from ' + Data.PIPES_TABLE + ' where ' + where;
            $.ajax({
                type: "GET",
                url: "http://ft2json.appspot.com/q?sql=" + pipeSQL,
                dataType: "json",
                success: function(data) {
                    if (data.data) {
                        var dt = data.data;
                        self.searchResult().pipes(data.data);
                    }
                }
            });
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

        self.getPreviousSearches = function() {
            $.getJSON("searches", function(data) {
//               debugger;
                self.previousSearches(data);
            });
        };
        self.getPreviousSearches();
	}

	ko.applyBindings(new ViewModel());
});