/**
 * @class
 * Add a Geolocation button to the map.
 * This class inherits from {@link deCarta.UI.MapControl}.
 *
 * @description Locate Map Control
 *
 * @constructor
 * @param opt Options A list of options with which to initialize the LocateControl.
 * Valid options are:
 * <ul>
 *   <li>(string) position: (Inherited from {@link deCarta.UI.MapControl}), which should
 *       be set to one of: 'topLeft', 'topRight', 'bottomLeft', 'bottomRight' (default='topLeft')</li> 
 *   <li>(function) newLocationCallback: a function that will be invoked when a new location is found.</li>
 *   <li>(function) newLocationErrorCallback: a function that will invoked when an error is returned from the geolocation api. </li>
 *   <li>(bool) enableHighAccuracy: enebles the highest accuracy supported by the device. </li>
 * </ul>
 * To style this control, edit the corresponding CSS file in the css/UI dir.
 * @see deCarta.UI.MapControl
 * @see deCarta.Core.Map
 */
deCarta.UI.LocateControl = function(opt){	 
    this.options = {
        newLocationCallback : undefined,
        newLocationErrorCallback : undefined,
        enableHighAccuracy : false,
        cssClass : "deCarta-control-locate",
        layout: function(width, height, existingControls){
            return {top: height - this.height, left:  0};
        }
    }
    
    this.options = deCarta.Utilities.extendObject(this.options, opt);
    
    deCarta.UI.MapControl.call(this, this.options);  

    this.locating = false;

    this.location;
    this.geoLocation;
}


//Define methods to extend LocateControl
deCarta.UI.LocateControl.prototype = {
    /**
     * @private
     */
    ready: false,
    tracking: false,
    /**
     * @private
     */
    initElements: function(){   

        this.domElement = document.createElement('div');
        this.contentElement = document.createElement('div');
        this.domElement.style.position = 'absolute';
        this.contentElement.className = 'deCarta-control-locate deCarta-control-locate-off';
        if(this.options.cssClass !== this.contentElement.className){
            this.contentElement.className = this.contentElement.className + ' ' + this.options.cssClass;
        }

        this.domElement.className = "domElement";

        deCarta.Touch.attachListener('tap', this.contentElement, this.geoLocate.bind(this), true);

        this.gpsPinOverlay = new deCarta.Core.MapOverlay({
            name: 'GPSPin',
            zIndex: 3
        });

        this.options.map.addLayer(this.gpsPinOverlay);

        this.height = (this.options.height || 20);

        this.ready = true; 

    },

    /**
     * @private
     */
    stopTracking: function(){
        navigator.geolocation.clearWatch(this.watchId);
        this.contentElement.className = 'deCarta-control-locate deCarta-control-locate-off';
        if(this.options.cssClass !== this.contentElement.className){
            this.contentElement.className = this.contentElement.className + ' ' + this.options.cssClass;
        }
        this.gpsPinOverlay.hide();
        this.tracking = false;        
    },


    /**
     * @private
     */
    geoLocate: function(callback){

        if (!navigator.geolocation) return;

        if (this.tracking){
            this.stopTracking();
            return;
        }

        this.tracking=true;
        var map = this.options.map;
        var base = this.contentElement.className;
        base=base.substring(0,base.indexOf(" "));
        this.contentElement.className =  base + ' deCarta-control-locate-on';

        var watchId = this.watchId = navigator.geolocation.watchPosition(
            function(geoLocationPosition){
                var pos = new deCarta.Core.Position(geoLocationPosition.coords.latitude, geoLocationPosition.coords.longitude);
                this.location = pos;
                this.geoLocation=geoLocationPosition;
                if(this.options.newLocationCallback){
                    //console.log("foo")
                    this.options.newLocationCallback(geoLocationPosition,pos); // hey, pass both, be generous
                }
                if(typeof callback === 'function'){
                    callback(geoLocationPosition,pos); // hey, pass both, be generous
                }

                map.center=pos;

                if( !this.gpsPin ){  // first time to lazy instantiate

                    this.gpsPin = new deCarta.Core.Pin({
                        imageSrc : "img/gps.png",
                        position:pos.clone(),
                        xOffset: 7,
                        yOffset: 7,
                        text: 'accuracy '+geoLocationPosition.coords.accuracy+'M'
                    });

                    this.gpsRadius = new deCarta.Core.Circle({
                        position:pos.clone(),
                        radius: geoLocationPosition.coords.accuracy //start with zero since its invisible
                    });
                    this.gpsPinOverlay.addObject(this.gpsRadius);
                    this.gpsPinOverlay.addObject(this.gpsPin);

                } else {
                    this.gpsPin.position = pos.clone();
                    this.gpsRadius.position = pos.clone();
                    this.gpsRadius.radius = geoLocationPosition.coords.accuracy-10;
                    this.gpsPinOverlay.show();
                }

                map.zoomTo(new deCarta.Core.Radius(geoLocationPosition.coords.accuracy,"M").getZoom(pos,map.width,map.height))
                map.render();

            }.bind(this),
            function(error){
                if(this.options.newLocationErrorCallback)
                    this.options.newLocationErrorCallback(error);
                navigator.geolocation.clearWatch(watchId);
                var base = this.contentElement.className;
                base=base.substring(0,base.indexOf(" "));
                this.contentElement.className =  base + ' deCarta-control-locate-off';

                deCarta.Core.EventManager.stopListeningByIdx('tap',eventIndex);
                this.tracking=false;

            }.bind(this),
            {
                enableHighAccuracy:this.options.enableHighAccuracy
            }
        );
            
        var eventIndex = deCarta.Core.EventManager.listen('tap', function(e){    
            navigator.geolocation.clearWatch(watchId);
                var base = this.contentElement.className;
                base=base.substring(0,base.indexOf(" "));
                this.contentElement.className =  base + ' deCarta-control-locate-off';

            deCarta.Core.EventManager.stopListeningByIdx('tap',eventIndex);
            this.tracking=false;
        }.bind(this));
        // console.log("registered watchId",watchId);
        // console.log("registered eventIndex",eventIndex);
    },
    /**
     * This render method implements the render method from the 
     * {@link deCarta.UI.MapControl} base class.
     * It is responsible for rendering this control on the map,
     * and produces a single HTML Dom Element containing the whole
     * GUI for the control.
     * @param {string} container The DOM element within which the control is rendered. 
     */
    render: function(container){
        if (!this.ready) this.initElements();
        this.domElement.appendChild( this.contentElement );
        container.appendChild( this.domElement );
        this.width = this.domElement.offsetWidth;
        this.height = this.domElement.offsetHeight;        
    }
}; 
//Extend the MapControl with the additional methods for LocateControl
deCarta.UI.LocateControl.prototype = deCarta.Utilities.inherit(deCarta.UI.LocateControl.prototype, deCarta.UI.MapControl.prototype);