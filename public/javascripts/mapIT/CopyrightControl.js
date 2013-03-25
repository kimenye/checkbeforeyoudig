/**
 * @class
 * Add a copyright string to the map.
 * This class inherits from {@link deCarta.UI.MapControl}.
 *
 * @description Copyright Map Control
 *
 * @constructor
 * @param opt Options A list of options with which to initialize the CopyrightControl.
 * Valid options are:
 * <ul>
 *   <li>(string) position: (Inherited from {@link deCarta.UI.MapControl}), which should
 *       be set to one of: 'topLeft', 'topRight', 'bottomLeft', 'bottomRight' (default='topLeft')</li>
 * </ul>
 * To style this control, edit the corresponding CSS file in the css/UI dir.
 * @see deCarta.UI.MapControl
 * @see deCarta.Core.Map
 */

deCarta.UI.CopyrightControl = function(opt){
    this.options = {
        text:"deCarta 2012", /* default */
        layout: function(width, height, existingControls){
            return {top: height - this.height, left:  0};
        }
    }
    
    this.options = deCarta.Utilities.extendObject(this.options, opt);
    
    deCarta.UI.MapControl.call(this, this.options);  
}



//Define methods to extend CopyrightControl
deCarta.UI.CopyrightControl.prototype = {
	
    /**
	 * @private
	 */
    ready: false,

    /**
	 * @private
     */
    initElements: function(){   

        this.domElement = document.createElement('div');
        this.contentElement = document.createElement('div');
        this.domElement.style.position = 'absolute';
        this.contentElement.className = 'deCarta-control-copyright';
        if(this.options.cssClass !== this.contentElement.className){
            this.contentElement.className = this.contentElement.className + ' ' + this.options.cssClass;
        }
        this.domElement.className = "domElement";

        this.contentElement.innerHTML = this.options.text;
        this.ready = true; 
        this.height = (this.options.height || 20);
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

}; //end CopyrightControl prototype

//Extend the MapControl with the additional methods for CopyrightControl
deCarta.UI.CopyrightControl.prototype = deCarta.Utilities.inherit(deCarta.UI.CopyrightControl.prototype, deCarta.UI.MapControl.prototype);
