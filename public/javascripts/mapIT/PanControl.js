/**
 * @class
 * Add a pan control to the map.
 * This class inherits from {@link deCarta.UI.MapControl}.
 *
 * @description Pan Map Control
 *
 * The PanControl provides a control consisting of 4 arrows 
 * over the map that let you pan the map, and provide a GPS locate button in
 * the center of the arrows.
 * This class inherits from {@link deCarta.UI.MapControl}.
 * @param opt Options A list of options with which to initialize the PanControl.
 * Valid options are:
 * <ul>
 *   <li>(string) position: (Inherited from {@link deCarta.UI.MapControl}), which should
 *       be set to one of: 'topLeft', 'topRight', 'bottomLeft', 'bottomRight'
 *       (default='topLeft')</li>
 *   <li>(int) panDistance: 
 *       distance (in pixels) of each pan event (defualt = 50)</li>
 * </ul>
 * To style this control, edit the corresponding CSS file in the css/UI dir.
 * @see deCarta.UI.MapControl
 * @see deCarta.Core.Map 
 */
deCarta.UI.PanControl = function(opt){
    this.options = {
        cssClass : 'deCarta-control-pan',
        panDistance: 50,
        layout: function(width, height, existingControls){
            return {top: 10, left: 10}
        }
    }
    
    this.options = deCarta.Utilities.extendObject(this.options, opt);
    
    deCarta.UI.MapControl.call(this, this.options);
/*    if (!this.options.style){
        if (deCarta.Window.isMobile()) this.options.style = 'mobile';
        else this.options.style = 'desktop';
    }*/
    this.locateTimeout = 10000;
    this.locateHighAccuracy = false;
    this.locateMaxAge = 1000 * 60 * 60 * 24;
	
}


//Define methods to extend PanControl
deCarta.UI.PanControl.prototype = {
        
        /**
		 * @private
	     */
        initElements: function(){

            this.domElement = document.createElement('div');
            this.contentElement = document.createElement('div');
            this.domElement.style.position = 'absolute';
            this.contentElement.style.position = 'relative';
            this.contentElement.className = 'deCarta-control-pan';
            if(this.options.cssClass !== this.contentElement.className){
                this.contentElement.className = this.contentElement.className + ' ' + this.options.cssClass;
            }
            this.domElement.className = "domElement";

            var commonStyle = {
                height: '16px',
                width: '16px',
                position:'absolute',
                cursor: 'pointer'
            }
            
            this.panNorthBtn = document.createElement('div');
            deCarta.Utilities.extendStyle(this.panNorthBtn.style, commonStyle);
            this.panNorthBtn.style.top = 0;
            this.panNorthBtn.style.left = '16px';
            //this.panNorthBtn.style.backgroundColor = '#0F0';
            deCarta.Touch.attachListener('tap', this.panNorthBtn, this.options.map.pan.bind(this.options.map, 'north', this.options.panDistance), true);
            
            this.panSouthBtn = document.createElement('div');
            deCarta.Utilities.extendStyle(this.panSouthBtn.style, commonStyle);
            this.panSouthBtn.style.top = '32px';
            this.panSouthBtn.style.left = '16px';
            //this.panSouthBtn.style.backgroundColor = '#FF0';
            deCarta.Touch.attachListener('tap', this.panSouthBtn, this.options.map.pan.bind(this.options.map, 'south', this.options.panDistance), true);
            
            this.panWestBtn  = document.createElement('div');
            deCarta.Utilities.extendStyle(this.panWestBtn.style, commonStyle);
            this.panWestBtn.style.top = '16px';
            this.panWestBtn.style.left = '0px';
            //this.panWestBtn.style.backgroundColor = '#0FF';
            deCarta.Touch.attachListener('tap', this.panWestBtn, this.options.map.pan.bind(this.options.map, 'west', this.options.panDistance), true);
            
            this.panEastBtn  = document.createElement('div');
            deCarta.Utilities.extendStyle(this.panEastBtn.style, commonStyle);
            this.panEastBtn.style.top = '16px';
            this.panEastBtn.style.left = '32px';
            //this.panEastBtn.style.backgroundColor = '#00F';
            deCarta.Touch.attachListener('tap', this.panEastBtn, this.options.map.pan.bind(this.options.map, 'east', this.options.panDistance), true);
                        
            this.locateBtn  = document.createElement('div');
            deCarta.Utilities.extendStyle(this.locateBtn.style, commonStyle);
            this.locateBtn.style.top = '16px';
            this.locateBtn.style.left = '16px';  
            deCarta.Touch.attachListener('tap', this.locateBtn, this.geoLocate.bind(this), true)
            
            this.contentElement.appendChild(this.panNorthBtn);            
            this.contentElement.appendChild(this.panWestBtn);
            this.contentElement.appendChild(this.locateBtn);
            this.contentElement.appendChild(this.panEastBtn);
            this.contentElement.appendChild(this.panSouthBtn);          
            
            this.ready = true;                        
            
        },
        
        /**
		 * @private
	     */
        geoLocate: function(){
            if (!navigator.geolocation) return;
            var map = this.options.map;
            var locateBtn = this.locateBtn;
            locateBtn.src= 'img/pan_spinner.gif';
            navigator.geolocation.getCurrentPosition(
                function(position){
                    var pos = new deCarta.Core.Position(position.coords.latitude, position.coords.longitude);
                    map.centerOn(pos);
                    locateBtn.src= 'img/pan_center.png';
                },
                function(error){
                    //error error oh
                },
                {
                    timeout:this.locateTimeout,
                    maximumAge:this.locateMaxAge,
                    enableHighAccuracy:this.locateHighAccuracy
                }
            );
        },
        
       /**
	    * This render method implements the render method from the 
	    * {@link deCarta.UI.MapControl} base class.
	    * It is responsible for rendering this control on the map,
	    * and produces a single HTML Dom Element containing the whole
	    * GUI for the control.
	    * @param {HTMLDOMElement} container The container which holds this control
	    */
        render: function(container){
            if (!this.ready) this.initElements();
            this.domElement.appendChild( this.contentElement );
            container.appendChild( this.domElement );            
            this.width = this.domElement.offsetWidth;
            this.height = this.domElement.offsetHeight;        
        }

}; //end PanControl prototype

//Extend the MapControl with the additional methods for PanControl
deCarta.UI.PanControl.prototype = deCarta.Utilities.inherit(deCarta.UI.PanControl.prototype, deCarta.UI.MapControl.prototype);
