/**
 * @class
 * Add a scale control to the map.
 * This class inherits from {@link deCarta.UI.MapControl}.
 *
 * @description Scale Map Control
 *
 * The ScaleControl provides a control to indicate measure of distance.
 * This class inherits from {@link deCarta.UI.MapControl}.
 * @param opt Options A list of options with which to initialize the ScaleControl.
 * Valid options are:
 * <ul>
 *   <li>(string) position: (Inherited from {@link deCarta.UI.MapControl}), which should
 *       be set to one of: 'topLeft', 'topRight', 'bottomLeft', 'bottomRight'
 *       (default='bottomRight')</li>
 * </ul>
 * To style this control, edit the corresponding CSS file in the css/UI dir.
 * @see deCarta.UI.MapControl
 * @see deCarta.Core.Map
 */
deCarta.UI.ScaleControl = function(opt){
    this.options = {
        layout: function(width, height, existingControls){
            return {top: height - this.height, left:  width - this.width};
        },
        position: "bottomRight"
    }
    
    this.options = deCarta.Utilities.extendObject(this.options, opt);
    deCarta.UI.MapControl.call(this, this.options);  
};

//Define methods to extend CopyrightControl
deCarta.UI.ScaleControl.prototype = {
	
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
        this.contentElement.className = 'deCarta-control-scale';
        if(this.options.cssClass !== this.contentElement.className){
            this.contentElement.className = this.contentElement.className + ' ' + this.options.cssClass;
        }
            this.domElement.className = "domElement";

        this.textImperial = document.createElement("div");
        this.scaleImperial = document.createElement("div");
        this.scaleImperial.className = "scaleImperial";
    
        this.textMetric = document.createElement("div");
        this.scaleMetric = document.createElement("div");
        this.scaleMetric.className = "scaleMetric";
        
        this.contentElement.appendChild(this.textImperial);
        this.contentElement.appendChild(this.scaleImperial);
        this.contentElement.appendChild(this.scaleMetric);
        this.contentElement.appendChild(this.textMetric);

        this.setScale({
            center: this.options.map.center,
            zoom: this.options.map.zoom
        });

        this.ready = true; 
        
        this.options.map.onzoomend(this.setScale.bind(this));
        this.options.map.onmoveend(this.setScale.bind(this));
        
    },

    setScale: function(params){
        if(!this.domElement) return;
        var scale = this.calculate(params.center, params.zoom);
        this.textImperial.innerHTML=scale.feetDisp;
        this.scaleImperial.style.width=scale.widthFeet + "px";
        this.scaleMetric.style.width=scale.widthMeter + "px";
        this.textMetric.innerHTML=scale.meterDisp;

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
    },
    
    calculate: function(center, z){
        var normz = 20-deCarta.Utilities.normalizeZoom(z);
        var metersPerPixel = deCarta.Utilities.metersPerPixelAtZoom(center,z);
        
        var meterDisp=deCarta.ScaleControl_Params.Scale[normz].meterDisp;
        var feetDisp=deCarta.ScaleControl_Params.Scale[normz].feetDisp;
        var widthMeter=deCarta.ScaleControl_Params.Scale[normz].meter/metersPerPixel;
        var widthFeet=deCarta.ScaleControl_Params.Scale[normz].feet*deCarta.ScaleControl_Params.meterPerFeet/metersPerPixel;

        for(; normz > 0 && (widthMeter > this.width || widthFeet > this.width); ){
            normz--;
            meterDisp=deCarta.ScaleControl_Params.Scale[normz].meterDisp;
            feetDisp=deCarta.ScaleControl_Params.Scale[normz].feetDisp;
            widthMeter=deCarta.ScaleControl_Params.Scale[normz].meter/metersPerPixel;
            widthFeet=deCarta.ScaleControl_Params.Scale[normz].feet*deCarta.ScaleControl_Params.meterPerFeet/metersPerPixel;
        }

        if(widthMeter > this.width || widthFeet > this.width){
            var meters = metersPerPixel * this.width;
            var feet = meters / deCarta.ScaleControl_Params.meterPerFeet;
            feetDisp=  Math.round(feet*1000)/1000 + " ft";
            meterDisp= Math.round(meters*1000)/1000 + " m";
            widthFeet= this.width;
            widthMeter= this.width;
        }

        return {
            feetDisp: feetDisp,
            meterDisp: meterDisp,
            widthFeet: widthFeet,
            widthMeter: widthMeter
        };
      
    }

}; //end CopyrightControl prototype

deCarta.ScaleControl_Params = {
    Scale: [
        {
            feet: 25, //20
            feetDisp: "25 ft",
            meter: 10,
            meterDisp: "10 m"
            
        },
        {
            feet: 50, //19
            feetDisp: "50 ft",
            meter: 10,
            meterDisp: "10 m"
            
        },
        {
            feet: 100, //18
            feetDisp: "100 ft",
            meter: 25,
            meterDisp: "25 m"
            
        },
        {
            feet: 200, //17
            feetDisp: "200 ft",
            meter: 50,
            meterDisp: "50 m"
            
        },
        {
            feet: 500, //16
            feetDisp: "500 ft",
            meter: 100,
            meterDisp: "100 m"
            
        },
        {
            feet: 1000, //15
            feetDisp: "1000 ft",
            meter: 200,
            meterDisp: "200 m"
            
        },
        {
            feet: 2000, //14
            feetDisp: "2000 ft",
            meter: 500,
            meterDisp: "500 m"
            
        },
        {
            feet: 2000, //13
            feetDisp: "2000 ft",
            meter: 1000,
            meterDisp: "1 km"
            
        },
        {
            feet: 5280, //12
            feetDisp: "1 mi",
            meter: 2000,
            meterDisp: "2 km"
            
        },
        {
            feet: 10560, //11
            feetDisp: "2 mi",
            meter: 5000,
            meterDisp: "5 km"
            
        },
        {
            feet: 26400, //10
            feetDisp: "5 mi",
            meter: 10000,
            meterDisp: "10 km"
            
        },
        {
            feet: 52800, //9
            feetDisp: "10 mi",
            meter: 25000,
            meterDisp: "25 km"
            
        },
        {
            feet: 132000, //8
            feetDisp: "25 mi",
            meter: 50000,
            meterDisp: "50 km"
            
        },
        {
            feet: 264000, //7
            feetDisp: "50 mi",
            meter: 100000,
            meterDisp: "100 km"
            
        },
        {
            feet: 528000, //6
            feetDisp: "100 mi",
            meter: 200000,
            meterDisp: "200 km"
            
        },
        {
            feet: 1056000, //5
            feetDisp: "200 mi",
            meter: 300000,
            meterDisp: "300 km"
            
        },
        {
            feet: 1584000, //4
            feetDisp: "300 mi",
            meter: 500000,
            meterDisp: "500 km"
            
        },
        {
            feet: 2640000, //3
            feetDisp: "500 mi",
            meter: 600000,
            meterDisp: "600 km"
            
        },
        {
            feet: 5280000, //2
            feetDisp: "1000 mi",
            meter: 1000000,
            meterDisp: "1000 km"
            
        },
        {
            feet: 5280000, //1
            feetDisp: "1000 mi",
            meter: 1000000,
            meterDisp: "1000 km"
            
        },
        {
            feet: 5280000, //0
            feetDisp: "1000 mi",
            meter: 1000000,
            meterDisp: "1000 km"
            
        }
    ],
    meterPerFeet: 0.3048
};

//Extend the MapControl with the additional methods for CopyrightControl
deCarta.UI.ScaleControl.prototype = deCarta.Utilities.inherit(deCarta.UI.ScaleControl.prototype, deCarta.UI.MapControl.prototype);

