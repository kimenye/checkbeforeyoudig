/**
 * @class
 * Add a map overview window to the map.
 * This class inherits from {@link deCarta.UI.MapControl}.
 *
 * @description Overview Map Control
 *
 * The OverviewControl map control provides a small window with a zoomed-out overview map as an overlay on the main map.
 * This class inherits from {@link deCarta.UI.MapControl}.
 * @param opt Options A list of options with which to initialize the OverviewControl.
 * Valid options are:
 * <ul>
 *   <li>(string) position: (Inherited from {@link deCarta.UI.MapControl}), which should
 *       be set to one of: 'topLeft', 'topRight', 'bottomLeft', 'bottomRight' (default='topLeft')</li>
 * </ul>
 * To style this control, edit the corresponding CSS file in the css/UI dir.
 * @see deCarta.UI.MapControl
 * @see deCarta.Core.Map 
 */
deCarta.UI.OverviewControl = function(opt){
    
    this.options = {
        cssClass : 'deCarta-control-overview',
        layout: function(width, height, existingControls){
            return {top: height - 124, left:  width - 124}
        }
    }
    
    this.options = deCarta.Utilities.extendObject(this.options, opt);
    
    deCarta.UI.MapControl.call(this, this.options);  
}


//Define methods to extend OverviewControl
deCarta.UI.OverviewControl.prototype = {

    /**
	 * @private
	 */
    ready: false,
	
    /**
	 * @private
	 */
    ZOOM_DIFF: 5,

    /**
	 * @private
	 */
    initElements: function(){   
        
        this.domElement = document.createElement('div');
        this.contentElement = document.createElement('div');
        this.domElement.style.position = 'absolute';
        this.contentElement.className = 'deCarta-control-overview';
        if(this.options.cssClass !== this.contentElement.className){
            this.contentElement.className = this.contentElement.className + ' ' + this.options.cssClass;
        }
        this.domElement.className = "domElement";
                
        // get the honest to goodness styles
        var w = parseInt(deCarta.Utilities.getComputedStyle(this.contentElement,"width"));
        var h = parseInt(deCarta.Utilities.getComputedStyle(this.contentElement,"height"));
        this.width = w ? w : 124;
        this.height = h ? h : 124;

        this.contentElement.style.width = this.width+'px';
        this.contentElement.style.height =  this.height+'px';

        this.mapControl = document.createElement('div');
        this.mapControl.id = 'mapOverviewWindow';
        this.mapControl.style.position="relative";
        this.mapControl.style.width = this.width+'px';
        this.mapControl.style.height = this.height+'px';
        this.contentElement.appendChild(this.mapControl);

        this.mapControlHider = document.createElement('div');
        this.mapControlHider.className = 'deCarta-control-overview-hide';
        this.contentElement.appendChild(this.mapControlHider);

        /*var hiderHeight = parseInt(deCarta.Utilities.getComputedStyle(this.mapControlHider,"height"));
        var hiderWidth = parseInt(deCarta.Utilities.getComputedStyle(this.mapControlHider,"width"));*/

        this.domElement.open=true;
        deCarta.Touch.attachListener('tap', this.contentElement, 
            function(){
                var t = parseInt(this.domElement.style.top);
                var l = parseInt(this.domElement.style.left);
                //moved to here because of IE 
                var hiderHeight = parseInt(deCarta.Utilities.getComputedStyle(this.mapControlHider,"height"));
                var hiderWidth = parseInt(deCarta.Utilities.getComputedStyle(this.mapControlHider,"width"));
                var w = parseInt(deCarta.Utilities.getComputedStyle(this.contentElement,"width"));
                var h = parseInt(deCarta.Utilities.getComputedStyle(this.contentElement,"height"));             
                if(this.domElement.open){              
                    this.height = hiderHeight;      
                    this.width = hiderWidth;      
                    this.domElement.style.top = (t+h-hiderHeight)+'px';
                    this.domElement.style.left = (l+w-hiderWidth)+'px';
                    this.domElement.open=false;
                    this.mapControlHider.className = this.mapControlHider.className+' deCarta-control-overview-show';
                } else {
                    this.height = h;      
                    this.width = w;      
                    this.domElement.style.top = (t-h+hiderHeight)+'px';
                    this.domElement.style.left = (l-w+hiderWidth)+'px';
                    this.domElement.open=true;
                    this.mapControlHider.className = 'deCarta-control-overview-hide';
                }
            }.bind(this), true);
        this.ready = true;         
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
        //console.log("render ovrMap",this.ready, this.tinyMap)
        if (!this.ready) {
            this.initElements();    
            this.domElement.appendChild( this.contentElement );
            container.appendChild( this.domElement );                
        }
        
        if (!this.tinyMap) {
            var p = new deCarta.Core.Position(this.options.map.center.getLat(), this.options.map.center.getLon());
            
            this.tinyMap = new deCarta.Core.Map({
                id: this.mapControl.id,
                skipBindingToServer: true,
                skipResources: true,
                resizeable: false,
                draggable: this.options.style == 'mobile',
                doubleTapZoom: false,
                digitalZoom: false,
                easing: false,                
                center:  p,
                zoom: Math.max(1, this.options.map.zoom - this.ZOOM_DIFF),
                
                onReady: function(){
                    
                    this.tinyMap.addOverlay(this.areaOverlay);
                    this.areaOverlay.addObject(this.area);  

                    var listener = this.sync.bind(this);        

                    this.options.map.onmoveend(listener);
                    this.options.map.onmove(listener);
                    this.options.map.onzoomend(listener);                    

                }.bind(this)
            });
            
            this.areaOverlay = new deCarta.Core.MapOverlay({name : 'view'});
            this.area = new deCarta.Core.Polygon({
                vertices: this.options.map.getVisibleRect(),
                draggable: !(this.options.style == 'mobile'),
                scroll: this.tinyMap,
                onDrop: function(p){
                    this.preventRecenter = true;
                    this.options.map.centerOn(p);
                    this.tinyMap.centerOn(p);
                }.bind(this)
            });            

        }        
    },
    
    /**
	 * @private
	 */
    sync: function(param){
                
        if (param.map != this.tinyMap){
            this.area.setVertices(this.options.map.getVisibleRect());
            
            if (this.recenterFromMain) {
                this.recenterFromMain = false;
                return;
            }                        
            if (param.zoom) this.tinyMap.zoomTo(Math.max(1, param.zoom - this.ZOOM_DIFF),null,true);
            if (param.center) this.tinyMap.centerOn(param.center, {animated: false});
        
        }
        this.tinyMap.render();
    }
	
	
}; //end OverviewControl prototype

//Extend the MapControl with the additional methods for OverviewControl
deCarta.UI.OverviewControl.prototype = deCarta.Utilities.inherit(deCarta.UI.OverviewControl.prototype, deCarta.UI.MapControl.prototype);
