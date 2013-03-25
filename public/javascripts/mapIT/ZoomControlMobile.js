/**
 * @class ZoomControlMobile - Add a zoom control to the map to present the user
 * with zoom in / zoom out buttons.
 * This class inherits from {@link deCarta.UI.MapControl}.
 *
 * @description Zoom Map Control
 *
 * @constructor
 * @param opt Options A list of options with which to initialize the ZoomControlMobile.
 * Valid options are:
 * <ul>
 *   <li>(string) position: (Inherited from {@link deCarta.UI.MapControl}), which should
 *       be set to one of: 'topLeft', 'topRight', 'bottomLeft', 'bottomRight' (default='topLeft')</li>
 * </ul>
 * To replace the images used in this control, place them in the correct (std / hires)
 * pack in the resources directory. Read more about image packs in the docs index.
 *
 * @see deCarta.UI.MapControl
 * @see deCarta.Core.Map
 */

deCarta.UI.ZoomControlMobile = function(opt){
    this.options = {
        autoResize: true,        
        cssClass : 'deCarta-control-zoom-mobile',
        layout: function(width, height, existingControls, allControls){
            
            var top = 10;
            if (allControls)
                for (var i = 0; i < allControls.length; i++){
                    var c = allControls[i];
                    if (c instanceof deCarta.UI.PanControl){
                        var p = c.options.layout(width, height, existingControls);                        
                        if (p.top == 10 && p.left == 10){                        
                            var top = 70;
                        }
                    }
                }
            
            return {top: top, left: 20}
        }
    }
    this.options = deCarta.Utilities.extendObject(this.options, opt);    
    deCarta.UI.MapControl.call(this, this.options);    
}


//Define methods to extend ZoomControlMobile
deCarta.UI.ZoomControlMobile.prototype = {

    /**
	 * @private
	 */
    ready: false,
	
    /**
	 * @private
	 */
    zoomLevels: 21,
	
    /**
	 * @private
	 */
    zoomOfs: 0,

    /**
	 * @private
	 */
    initElements: function(){

        if (this.domElement) return;

        this.domElement = document.createElement('div');
        this.contentElement = document.createElement('div');
        this.domElement.style.position = 'absolute';
        this.contentElement.className = 'deCarta-control-zoom-mobile';
        if(this.options.cssClass !== this.contentElement.className){
            this.contentElement.className = this.contentElement.className + ' ' + this.options.cssClass;
        }
        this.domElement.className = "domElement";


        this.zoomIn = document.createElement('div');
        this.zoomOut = document.createElement('div');
        
        this.zoomIn.className = "deCarta-control-zoomInBtn-mobile";
        this.zoomOut.className = "deCarta-control-zoomOutBtn-mobile";


        deCarta.Touch.attachListener('tap', this.zoomIn, function(ev){
             this.options.map.zoomIn();
        }.bind(this), false);

        deCarta.Touch.attachListener('tap', this.zoomOut, function(ev){
             this.options.map.zoomOut();
        }.bind(this), false);
        
        this.contentElement.appendChild(this.zoomIn);
        this.contentElement.appendChild(this.zoomOut);        
        this.ready = true; 
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
}; //end ZoomControlMobile prototype

//Extend the MapControl with the additional methods for ZoomControlMobile
deCarta.UI.ZoomControlMobile.prototype = deCarta.Utilities.inherit(deCarta.UI.ZoomControlMobile.prototype, deCarta.UI.MapControl.prototype);