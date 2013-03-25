/**
 * @private
 * Provides a layer slider control. This class is not currently supported by the deCarta Mobile JavaScript API.
 */

deCarta.UI.LayerControl = function(opt){
    
    deCarta.UI.MapControl.call(this, opt);
}



//Define methods to extend LayerControl
deCarta.UI.LayerControl.prototype = {

    ready: false,

    initElements: function(){

        this.domElement = document.createElement('div');
        this.domElement.style.position = 'absolute';
        this.contentElement = document.createElement('div');
        this.contentElement.className = 'deCarta-control-layer';
        if(this.options.cssClass && this.options.cssClass !== this.contentElement.className){
            this.contentElement.className = this.contentElement.className + ' ' + this.options.cssClass;
        }        
        this.domElement.className = "domElement";

        this.streetBtn = document.createElement('div'); 
        this.streetBtn.className = 'button street selected';
        deCarta.Touch.attachListener('tap', this.streetBtn, function(){this.options.map.setStreetView() }.bind(this), true);

        this.satelliteBtn = document.createElement('div');
        deCarta.Touch.attachListener('tap', this.satelliteBtn, function(){this.options.map.setSatelliteView() }.bind(this), true);
        this.satelliteBtn.className = 'button satellite';

        this.hybridBtn = document.createElement('div');
        deCarta.Touch.attachListener('tap', this.hybridBtn, function(){this.options.map.setHybridView() }.bind(this), true);
        this.hybridBtn.className = 'button hybrid';

        var clear = document.createElement('div');
        clear.style.clear = 'both';

        this.contentElement.appendChild(this.streetBtn);
        this.contentElement.appendChild(this.satelliteBtn);
        this.contentElement.appendChild(this.hybridBtn);
        this.contentElement.appendChild(clear);

        this.domElement.appendChild(this.contentElement);
        
        this.options.map.onviewchange(function(ev){
            switch (ev.view){
                case 'street':
                    this.streetBtn.className = 'button street selected';
                    this.satelliteBtn.className = 'button satellite';
                    this.hybridBtn.className = 'button hybrid';
                break;
                case 'satellite':
                    this.streetBtn.className = 'button street';
                    this.satelliteBtn.className = 'button satellite selected';
                    this.hybridBtn.className = 'button hybrid';
                break;
                case 'hybrid':
                    this.streetBtn.className = 'button street';
                    this.satelliteBtn.className = 'button satellite';
                    this.hybridBtn.className = 'button hybrid selected';
                break;
            }
        }.bind(this));

        this.ready = true;
    },

    render: function(container){        
        if (!this.ready) this.initElements();
        container.appendChild( this.domElement );
        this.width = this.domElement.offsetWidth;
        this.height = this.domElement.offsetHeight;          
    }
	
	
}; //end LayerControl prototype

//Extend the MapControl with the additional methods for LayerControl
deCarta.UI.LayerControl.prototype = deCarta.Utilities.inherit(deCarta.UI.LayerControl.prototype, deCarta.UI.MapControl.prototype);
