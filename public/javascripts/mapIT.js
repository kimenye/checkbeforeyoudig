$(document).ready(function() {

    var Data = {
        INITIAL_ZOOM: 12,
        PIPES_TABLE: 2852415,
        TEST_GEO: 2852795,
        ZONES_TABLE:2852009
    };

    deCarta.Core.Configuration.clientName = Config.clientName;
    deCarta.Core.Configuration.clientPassword = Config.clientPassword;

    var controls = [];
    controls.push(new deCarta.UI.ZoomControl({position: 'leftTop', marginX: '20'}));

    function handlerCallback(bbox) {
        console.log("In callback");
        window.shapeOverlay.addObject(polygonForBoundingBox(bbox));
        window.vm.loadOverlays(bbox);
    }

    function polygonForBoundingBox(bbox) {
        return new deCarta.Core.Polygon({
            vertices: [
                new deCarta.Core.Position(bbox.btmRightPoint.lat,bbox.btmRightPoint.lon), //BR
                new deCarta.Core.Position(bbox.btmRightPoint.lat,bbox.topLeftPoint.lon), //BL
                new deCarta.Core.Position(bbox.topLeftPoint.lat,bbox.topLeftPoint.lon ), //TL
                new deCarta.Core.Position(bbox.topLeftPoint.lat,bbox.btmRightPoint.lon) //TR
            ],
            strokeColor: '#000',
            fillColor: '#000088'
        });
    }
    controls.push(new deCarta.UI.ActionSelectControl({position: 'leftTop', marginX: '20', callback: handlerCallback }));

    var mombasa = new deCarta.Core.StructuredAddress(
        {
            municipality : "Mombasa",
            countryCode : "KE"
        },
        new deCarta.Core.Locale('EN', 'KE')
    );

    deCarta.Core.Geocoder.geocode(mombasa,function(addressResults){
//        console.log("Addresses", addressResults);
        var bestResult = addressResults[0];
        initMap(bestResult);
    });

    function initMap(baseLocation) {
        console.log("Base location : ", baseLocation);
        window.shapeOverlay = new deCarta.Core.MapOverlay({
            name: "Shapes"
        });
        window.map = new deCarta.Core.Map({
            zoom: 14,
            id: "map_canvas",
//            center: new deCarta.Core.Position(Config.position),
            center: baseLocation.Position,
            controls: controls,
            onReady: function(){
                /* We instantiate a MapBoundary object */

                //the general coast province
                var mapBoundary = new deCarta.Mobile.MapBoundary();
                mapBoundary.setPositions([
                    new deCarta.Core.Position(-3.953996,39.558678),
                    new deCarta.Core.Position(-4.116327,39.551811),
                    new deCarta.Core.Position(-4.117355,39.773598),
                    new deCarta.Core.Position(-3.929678,39.769135)
                ]);
                /* Apply it to the map. */
                window.map.setBoundary(mapBoundary);
                window.map.addOverlay(window.shapeOverlay);
                window.map.render();
            }.bind(this)
        });
    }

    function ViewModel() {
        var self = this;
        var EnquiryType = { searchByName : "Search By Name", searchByCustomArea : "Search By Custom Area"};

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

        self.clearSearch = function() {
            if (!self.isCustomAreaSearch()) {

            }
        };

        self.doSearch = function() {
//            debugger;
            var query = new deCarta.Core.StructuredAddress(
                {
                    municipality : self.searchTerm(),
                    countryCode : "KE"
                },
                new deCarta.Core.Locale('EN', 'KE')
            );

            deCarta.Core.Geocoder.geocode(query,function(addressResults){
                var bestResult = addressResults[0];
//                initMap(bestResult);
                console.log("Best result: ", bestResult);
//                debugger;
//                handlerCallback(bestResult.BoundingBox);
                var br = bestResult.BoundingBox.pos[0].content;
                var tl = bestResult.BoundingBox.pos[1].content;

                var brCds = br.split(" ");
                var tlCds = tl.split(" ");

//                console.log("BR: ", br);
                debugger;

                var brPt = new deCarta.Core.Position(parseFloat(brCds[0]), parseFloat(brCds[1]));
                var tlPt = new deCarta.Core.Position(parseFloat(tlCds[0]), parseFloat(tlCds[1]));

                var bbox = new deCarta.Core.BoundingBox(brPt, tlPt);
                handlerCallback(bbox);
            });
        };

        self.loadOverlays = function(bbox) {
            var rect = 'RECTANGLE(LATLNG(' + bbox.btmRightPoint.lat + ',' + bbox.topLeftPoint.lon +'), LATLNG(' + bbox.topLeftPoint.lat + ',' + bbox.btmRightPoint.lon +'))';
            var where = 'ST_INTERSECTS(geometry,' + rect + ')';
            var query = "select * from " + Data.PIPES_TABLE + ' where ' + where;
            console.log("Query: ", query);
            $.ajax({
                type: "GET",
                url: "http://ft2json.appspot.com/q?sql=" + query,
                dataType: "json",
                success: function(data) {
                    for (var i=0;i<data.data.length;i++) {
                        var geom = data.data[i].geometry;

                        var xml = $($.parseXML(geom));
                        var coords = xml.find("coordinates").text()
                        var points = coords.split(" ");

                        var pts = [];
                        for (var x=0;x<points.length;x++) {
                            var pt = points[x];
                            pt = pt.split(",");
                            pts[x] = new deCarta.Core.Position(parseFloat(pt[1]), parseFloat(pt[0]));
                        }

                        var pl = new deCarta.Core.Polyline({
                            lineGeometry: pts,
                            strokeColor:'#D00',
                            strokeWidth:2
                        });

                        window.shapeOverlay.addObject(pl);
                    }
                }
            });
        }
    }
    window.vm = new ViewModel();
    ko.applyBindings(window.vm);
});