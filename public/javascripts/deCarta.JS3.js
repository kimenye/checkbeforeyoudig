/*
 *  deCarta Mobile API.
 *
 *
 *
 *
 *
 */
(function (window, undefined){  
    var document = window.document;
    var deCarta = {};
    deCarta.geId = function(elId) { return document.getElementById(elId);};
    deCarta.crEl = function(tag) { return document.createElement(tag);};
/**
 * @namespace
 * the deCarta namespace is the top level namespace for all deCarta libraries
 * @description deCarta Top-level Namespace
 */
if (!deCarta) var deCarta = {};

/**
 * @namespace
 * the deCarta.Core namespace contains the basic functionality for
 * an online mapping application.
 * @description deCarta Mobile JavaScript API Namespace
 */
deCarta.Core = {

    modules: [],
	
    /**
     * @private
     */
    loadModule: function(module, onLoad){
        
        if (this.modules[module]) onLoad();
        var sTag = document.createElement('script');
        sTag.onload = this.moduleLoaded.bind(this, module, onLoad);
        sTag.src = 'modules/' + module + '.js';
        document.body.appendChild(sTag);
    },

    /**
     * @private
     */
    moduleLoaded: function(module, onLoad){
        
        this.modules[module] = true;
        onLoad();
    }

}

deCarta.UI = {





}

//Aliasing within the lib
var _dC = deCarta.Core;
var _dU = deCarta.UI;

/**
 *
 * A collection of static functions used throughout the api for unit conversions,
 * url parsing and DOM manipulations.
 *
 * @description Utility Functions
 */
deCarta.Utilities = {
    
    setCookie: function (c_name,value,exdays) {
        var exdate=new Date();
        exdate.setDate(exdate.getDate() + exdays);
        var c_value=escape(value) + ((exdays==null) ? "" : "; expires="+exdate.toUTCString());
        document.cookie=c_name + "=" + c_value;
    }, 

    getCookie: function(c_name) {
        var i,x,y,ARRcookies=document.cookie.split(";");
        for (i=0;i<ARRcookies.length;i++)
        {
            x=ARRcookies[i].substr(0,ARRcookies[i].indexOf("="));
            y=ARRcookies[i].substr(ARRcookies[i].indexOf("=")+1);
            x=x.replace(/^\s+|\s+$/g,"");
            if (x==c_name)  {
                return unescape(y);
            }
        }
    },    
    /**
     * Returns true if the object passed as param is an array
	 * @return {bool}
     */
    isArray: function (array){
        return Object.prototype.toString.call(array) === '[object Array]';
    },
	
    /**
     * Returns an object wrapped in an array if it is not an array already
     **/
    makeArrayFix: function (obj){
        return deCarta.Utilities.isArray(obj) ? obj : [obj];
    },

    /**
	 * @private
     * Given a latitude and a zoom level, returns a pixel value
     * Starting from top left of the world. 
     **/
    lat2pix: function (lat, zoom){
        var f = deCarta.Utilities['lat2pix_' + deCarta.Core.Configuration.projection.replace(':','')];
        if (!f) {            
            throw('Bad projection in the config! This is extremely bad.');
        }
        return f(lat, zoom);
    },
    
    lat2pix_EPSG3395: function(lat, zoom){
        
        var radPerPix = 2*Math.PI / (deCarta.Utilities.tileSizeForZoom(zoom) * Math.pow(2, Math.floor(zoom)));

        var radLat = (parseFloat(lat) * (2 * Math.PI))/360;

        var ecc = 0.08181919084262157;

        var sinPhi = Math.sin(radLat);
        
        var eSinPhi = ecc * sinPhi;
        
        var retVal = Math.log(((1.0 + sinPhi) / (1.0 - sinPhi)) *
            Math.pow((1.0 - eSinPhi) / (1.0 + eSinPhi), ecc)) / 2.0;
        
        return (retVal / radPerPix);
        
    },
    
    lat2pix_EPSG3857 : function(lat, zoom){
        return deCarta.Utilities.forwardMercator(lat, 0, zoom).y;
    },
    
    lat2pix_Spherical: function(lat,zoom)  { 
        return deCarta.Utilities.forwardMercator(lat, 0, zoom).y;
    },
    
    forwardMercator: function(lat, lon, zoom) {       
        var wSize = (deCarta.Utilities.tileSizeForZoom(zoom) * Math.pow(2, Math.floor(zoom - 1))); 
         
        var x = lon * wSize / 180;
        var y = Math.log(Math.tan((90 + lat) * Math.PI / 360)) / (Math.PI / 180);

        y = y * wSize / 180;                       
        
        return {x: x, y:y};
    },
    
    inverseMercator: function(x, y, zoom) {

        var wSize = (deCarta.Utilities.tileSizeForZoom(zoom) * Math.pow(2, Math.floor(zoom - 1)));

        var lon = (x / wSize) * 180;
        var lat = (y / wSize) * 180;

        lat = 180/Math.PI * (2 * Math.atan(Math.exp(lat * Math.PI / 180)) - Math.PI / 2);
        
        return new deCarta.Core.Position(lat, lon);
    },

    /**
     * Given a longitude and a zoom level, returns a pixel value
     * Starting from top left of the world.
     **/
    lon2pix: function (lon, zoom){

        var radPerPix = 2 * Math.PI / (deCarta.Utilities.tileSizeForZoom(zoom) * Math.pow(2, Math.floor(zoom)));
        return ((lon / 180) * Math.PI) / radPerPix;
    },
    
    /*lon2pixOL: function(lon,zoom) { 
        return (lon+180)/360*Math.pow(2,zoom) * (deCarta.Utilities.tileSizeForZoom(zoom) * Math.pow(2, Math.floor(zoom))); 
    }, */    
    
    /**
     * Given a pixel value and a zoom level, returns the longitude
     */
    pix2lon: function (x, zoom) {
        var radPerPix = 2 * Math.PI / (deCarta.Utilities.tileSizeForZoom(zoom) * Math.pow(2, Math.floor(zoom)));
        return ((x * radPerPix) * 180 / Math.PI );
    },

    /**
     * Given a pixel value and a zoom level, returns the latitude
     */
    pix2lat: function (y, zoom) {
        var f = deCarta.Utilities['pix2lat_' + deCarta.Core.Configuration.projection.replace(':','')];
        if (!f) {            
            throw('Bad projection in the config! This is extremely bad.');
        }
        return f(y, zoom);        
    },
    
    pix2lat_EPSG3395 : function(y, zoom){        
        
        var radPerPix = 2*Math.PI / (deCarta.Utilities.tileSizeForZoom(zoom) * Math.pow(2, Math.floor(zoom)));

        var phiEpsilon = 1E-7;
        var phiMaxIter = 12;
        var t = Math.pow(Math.E, -y * radPerPix);
        var prevPhi = deCarta.Utilities.mercatorUnproject(t);
        var newPhi = deCarta.Utilities.findRadPhi(prevPhi, t);
        var iterCount = 0;
        while ( iterCount < phiMaxIter &&
            Math.abs(prevPhi - newPhi) > phiEpsilon) {
            prevPhi = newPhi;
            newPhi = deCarta.Utilities.findRadPhi(prevPhi, t);
            iterCount++;
        }
        return newPhi*180/Math.PI;
        
    },
    
    pix2lat_EPSG3857 : function(y, zoom){
        return deCarta.Utilities.inverseMercator(0, y, zoom).getLat();
    },    
    
    pix2lat_Spherical: function(y, zoom){
        return deCarta.Utilities.inverseMercator(0, y, zoom).getLat();
    },

    /**
     * Given a position and zoom level, get how many meters per pixels there are
     * @param {deCarta.Core.Position} p
     * @param {float} z the zoom level
     */
    metersPerPixelAtZoom: function(p, z){
        var C = 156543.04;
        var scale = C * Math.cos(p.lat * (Math.PI / 180)) / (Math.pow(2, z));
        return scale;
    },

    /**
	 * @private
	 */
    mercatorUnproject: function (t) {
        return (Math.PI / 2) - 2 * Math.atan(t);
    },

    /**
	 * @private
	 */
    findRadPhi: function (phi, t) {
        var ecc = 0.08181919084262157;
        //var ecc = 0.998434489;
        var eSinPhi = ecc * Math.sin(phi);
        return 	(Math.PI / 2) -
        (2 * Math.atan (t * Math.pow((1 - eSinPhi) / (1 + eSinPhi), ecc / 2)));
    },

    /**
	 * @private
	 */
    deCartaToGXZoomLevel: function (zoomLevel) {
        // The following is the definition of a "gxZoom"
        var gxZoom = Math.abs(21 - parseInt(deCarta.Utilities.normalizeZoom(zoomLevel), 10));
        return gxZoom;
    },

    /**
     * Returns the tile size for a zoom level
     * @param {float} zoom
     * @param {int} tile size
     * @return int
     */
    tileSizeForZoom: function(zoom, tileSize){
        if (!this._dpr ) this._dpr = deCarta.Window.getDpr();
        var dpr =this._dpr;//(window.devicePixelRatio) ? window.devicePixelRatio : 1;
        if (!tileSize) tileSize = deCarta.Core.Constants.TILE_SIZE / dpr ;
        var base = tileSize;        
        var zoomInc = zoom - Math.floor(zoom);        
        /*if (zoomInc < 0) {        
            return (base * (1 + (1 -Math.abs(zoomInc)))) / 2;
        } else {        
            return base * (1 + zoomInc);
        }*/
        return base*Math.pow(2,zoomInc);
    },

    /**
     * Get the tile position in lat lng from the e,n,z triple
     */
    getTilePosition: function(e, n, z){
        try {
            var llsize = deCarta.Core.Constants._ll_LUT[deCarta.Core.Configuration.projection][Math.floor(z)].split(',');

            var lng = (e) * llsize[1];

            //to get teh lat, i need to
            // find the # of pix from the equator. (tileSize * n)
            // find the lat with my handy utility func
            var latPx = deCarta.Utilities.tileSizeForZoom(z) * (n + 1);
            var lat = deCarta.Utilities.pix2lat(latPx, z);

            return new deCarta.Core.Position(lat, lng);

        }catch (ex) {
            console.log('GetTilePos', ex);
        }
    },

    /**
     * Get distance between two positions
     * @param {Position} Point1
     * @param {Position} Point2
     * @return distance in kilometers
     */
    getPointDistance: function(Point1, Point2){

        var lat1 = Point1.getLat();
        var lat2 = Point2.getLat();
        var lon1 = Point1.getLon();
        var lon2 = Point2.getLon();

        var R = 6378.137; // km - THIS IS THE RADIUS OF THE CURRENT PLANET! (Earth).

        var dLat = (lat2 - lat1).toRad();
        var dLon = (lon2 - lon1).toRad();
        var a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(lat1.toRad()) * Math.cos(lat2.toRad()) *
                Math.sin(dLon/2) * Math.sin(dLon/2);
        var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        var d = R * c;

        return d;
    },
    /**
     * Returns the angle between the segment connecting Position 1 and Position 2
     * and the X axis.
     * @param {deCarta.Core.Position} Position1
     * @param {deCarta.Core.Position} Position2
     * @param {boolean} rad (optional) rturns angle in degrees
     *
     *
     */
    getAngle: function(Position1, Position2, rad){

        var x1 = Position1.getX(21);
        var y1 = Position1.getY(21);
        var x2 = Position2.getX(21);
        var y2 = Position2.getY(21);

        var r = Math.atan2(y2 - y1, x2 - x1);
        if (rad) return r;
        return ((r * 180 / Math.PI) + 360) % 360; //deg

    },
    
    getAnglePx: function(p1, p2, rad){
        
        var x1 = p1.x;
        var y1 = p1.y;
        var x2 = p2.x;
        var y2 = p2.y;

        var r = Math.atan2(y2 - y1, x2 - x1);
        if (rad) return r;
        return ((r * 180 / Math.PI) + 360) % 360; //deg
        
    },
    

    /**
     * Given the current center, zoom level, new zoom level and a fixed position
     * return the value for a new center that will keep the fixed position
     * in the same spot.
     *
     */
    getCenterToFixPositionAtNewZoom: function(fixedPosition, currentCenter, originalZoom, newZoom){

        var center = new deCarta.Core.Position();

        var currentCenterX = currentCenter.getX(originalZoom);
        var currentCenterY = currentCenter.getY(originalZoom);

        var currentFpX = fixedPosition.getX(originalZoom);
        var currentFpY = fixedPosition.getY(originalZoom);

        var deltaX = currentFpX - currentCenterX;
        var deltaY = currentFpY - currentCenterY;

        center.setXY(fixedPosition.getX(newZoom) - deltaX, fixedPosition.getY(newZoom) - deltaY , newZoom);

        return center;

    },
	
    bestZoomForBB: function(map, topLeft, btmRight){
        for (var z = 20; z > 0; z --){

            var x1 = topLeft.getX(z);
            var y1 = topLeft.getY(z);
            var x2 = btmRight.getX(z);
            var y2 = btmRight.getY(z);

            var dX = Math.abs(x2 - x1);
            var dY = Math.abs(y2 - y1);

            if (dX <= map.width && dY <= map.height){
                return z;             
            }
        }
        return z;
    },

    /**
	 * @private
	 */
    getTileKey: function(x, y, z){
        return deCarta.Utilities.normalizeZoom(z) + '_' + x + '_' + y;
    },

    /**
	 * @private
	 */
    splitTileKey: function(key){
        var split = key.split('_');
        return {x: parseFloat(split[1]), y: parseFloat(split[2]), z:parseFloat(split[0])};
    },

    /**
     * Given an X, Y and Z tile triple returns the corresponding
     * quadkey as defined in the Navteq documentation.
     */
    tripleToQuadKey: function (x, y, z){
        var key = '';
        for (var mask = (1 << (z-1)); mask > 0; mask = mask >> 1){
            var dg = 0;
            if ((x & mask) != 0) dg += 1;

            if ((y & mask) != 0) dg += 2;
            key += dg;
        }
        return key;
    },

    /**
	 * @private
	 */
    normalizeZoom: function(z){
        return Math.floor(z);
    },

    normalizeKey: function(key){
        
        var split = deCarta.Utilities.splitTileKey(key);
        var worldSize = Math.pow(deCarta.Utilities.normalizeZoom(split.z), 2);
        if (split.x < 0) split.x += worldSize;
        split.x = parseFloat(split.x) % worldSize;                    
        return deCarta.Utilities.getTileKey(split.x, split.y, split.z);
    },

    /**
	 * @private
	 */
    getRequestId: function(){
        return Math.floor(Math.random()*10000000);
    },

    /**
	 * @private
	 */
    urlParse: function (urlString){

        var result = {};
        var split = urlString.split('#')[0].split('?');
        result.baseUrl = split[0];
        result.queryParameters = {};

        var params = {};
        try {
            var queryParameters = split[1].split('&');
            for (var i = 0; i < queryParameters.length; i++){
                var val = queryParameters[i].split('=');
                params[val[0]] = val[1];
            }
        } catch (e) {}
        result.queryParameters = params;
        
        try {
            split = result.baseUrl.split('://');
            result.proto = split[0];
            var hp = split[1].split('/');
            
            result.host = hp[0];
            hp[0]='';
            result.path = hp.join('/');
        } catch (e) {
            result.proto = 'unknown';
        }
        
        return result;
    },

    /**
	 * @private
	 */
    urlCompose: function (urlObj){

        var resultUrl = urlObj.baseUrl + '?';
        var first = true;
        var params = urlObj.queryParameters;

        for (var param in params){
            if (!first) {
                resultUrl += '&';
            } else {
                first = false
            }
            resultUrl += param + '=' + params[param];
        }

        return resultUrl;
    },

    /**
	 * @private
	 */
    removeElementToReinsert: function (element){

        var parentNode = element.parentNode;
        var nextSibling = element.nextSibling;
        
        parentNode.removeChild(element);
        return function domRestoration() {
            if (nextSibling) {
                parentNode.insertBefore(element, nextSibling);
            } else {
                parentNode.appendChild(element);
            }
        };
    },
    
    /**
	 * @private
	 */
    setOpacity: function(elem, opacity){
        
        var xop = (opacity / 100);    
        var object = elem.style;
        object.opacity = xop;
        object.MozOpacity = (opacity / 100);
        object.KhtmlOpacity = (opacity / 100);
        object.filter = "alpha(opacity=" + opacity + ")";

        return true;       

    },

    makeRGBA: function(color, opacity){
        
        var r = parseInt(color.substring(1,3), 16);
        var g = parseInt(color.substring(3,5), 16);
        var b = parseInt(color.substring(5), 16);
        
        return 'rgba(' + r + ',' + g + ',' + b + ',' + opacity + ')';

    },

    /**
	 * @private
	 */
    extendObject: function(dst, src){                
        for (var elem in src){
            try {
                dst[elem] = src[elem];
            } catch (e) {}
        }
    
        return dst;
    },
    
	/**
	 * Used for implementing class inheritance
	 */
    inherit: function(dst, src){        
        for (var elem in src){
            if (!dst[elem]){
                if (typeof dst[elem] == 'Array' || typeof dst[elem] == 'Object'){
                    dst[elem] = deCarta.Utilities.inherit(dst[elem], src[elem]);
                }
                dst[elem] = src[elem];
            }
        }
        return dst;
    },

    /**
    * @private
    */
    domPosition: function(obj){
        var curleft = 0;
        var curtop = 0;
        if (obj.offsetParent) {
            do {
                curleft += obj.offsetLeft;
                curtop += obj.offsetTop;
            } while (obj = obj.offsetParent);
        }
        return {top: curtop, left: curleft};
    },

    /**
	 * @private
	 */
    extendStyle: function(dst, src){        
        for (var elem in src){
            try {
                dst[elem] = src[elem];
            } catch (e){             
            }
        }
        return dst;
    },
    
    /**
	 * @private
	 */
    fixEvent: function(e){
        var posx = 0;
        var posy = 0;
        if (!e) var e = window.event;
        if (e.pageX || e.pageY) {
          posx = e.pageX;
          posy = e.pageY;
        }
        else if (e.clientX || e.clientY) {
          e.pageX = posx = e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
          e.pageY = posy = e.clientY + document.body.scrollTop + document.documentElement.scrollTop;
        }
        return e;
    },       

    /**
	 * @private
	 */
    getClassName: function(obj){
        // get classname abstracted from
        // constructor property
        var c = obj.constructor.toString();
        var start = c.indexOf('function ') + 9;
        var stop = c.indexOf('(');
        c = c.substring(start, stop);
        return c;
    },

    addClass: function(domEl, name){
        var classes = domEl.className.split(' ');
        for (var i = 0; i < classes.length; i++){
            if (classes[i] == name) return;
        }
        domEl.className += ' ' + name;
    },

    removeClass: function(domEl, name){
        var classes = domEl.className.split(' ');
        var newName = [];
        for (var i = 0; i < classes.length; i++){
            if (classes[i] != name) newName.push(classes[i]);            
        }
        domEl.className = newName.join(' ');
    },

    /* This is like the function below, but different*/
    getComputedStyle : function(element,style) {
        return this.getStyle(element, style);
        var func = null;
        if (document.defaultView && document.defaultView.getComputedStyle) {
            func = document.defaultView.getComputedStyle;
        } else if (typeof(document.body.currentStyle) !== "undefined") {
            func = function(element, anything) {
                return element["currentStyle"];
            };
        }
        alert(element + ' ' +  style);
        return func(element, null)[style];
    },

    /* This is like the function above, but different. */
    getStyle: function(oElm, sCssRule)
    {
      var sValue = "";
      if (document.defaultView && document.defaultView.getComputedStyle)
      {
        
        sValue = document.defaultView.getComputedStyle(oElm, "").getPropertyValue(sCssRule);
      }
      else if (oElm.currentStyle)
      {
        sCssRule = sCssRule.replace(/\-(\w)/g, function(sMatch, p1){ return p1.toUpperCase(); } );
        sValue = oElm.currentStyle[sCssRule];
      }
      return sValue;
    },

    getStyleFromCssName: function(name){

        if (name.charAt(0) != '.') name = '.' + name;

        for (var i = 0; i < document.styleSheets.length; i ++){
            if (document.styleSheets[i]){
                
                var rules = document.styleSheets[i].cssRules || document.styleSheets[i].rules;
                console.log(rules, document.styleSheets[i]);
                if (rules)
                for (j = 0; j < rules.length; j++){
                    //console.log(rules[j]);
                    if (rules[j].selectorText && (rules[j].selectorText.toLowerCase() == name.toLowerCase())){
                        return rules[j];
                    }
                }
            }
        }

        return {};
    },

    /**
	 * @private
	 */
    getObjectPosition: function(obj){

        var o = obj;

        var curleft = 0;
        if(obj.offsetParent)
            while(1)
            {
              curleft += obj.offsetLeft;
              if (obj.style) {
                var bd = parseFloat(this.getStyle(obj, 'border-left-width'));
                if (bd)                
                    curleft += bd;
              }
              if(!obj.offsetParent)
                break;
              obj = obj.offsetParent;
            }
        else if(obj.x)
            curleft += obj.x;

        obj = o;
        var curtop = 0;
        if(obj.offsetParent)
            while(1)
            {
              curtop += obj.offsetTop;
              if (obj.style) {
                var bd = parseFloat(this.getStyle(obj, 'border-top-width'));
                if (bd) 
                    curtop += bd;
              }
              if(!obj.offsetParent)
                break;
              obj = obj.offsetParent;
            }
        else if(obj.y)
            curtop += obj.y;


        return {x: curleft, y: curtop};
    },

    /**
	 * @private
	 */
    domRemove: function (el){
        el.parentNode.removeChild( el );
    },
    
    isChild: function(element, hopefulParent, safe){
        if (!safe) safe = 0;
        if (safe > 10) return false;
        if (!element) return false;
        
        if (element.parentNode == hopefulParent) return true;
        if (element.parentNode == document.body) return false;
        return deCarta.Utilities.isChild(element.parentNode, hopefulParent, safe + 1);
    },

    /**
	 * @private
	 */
    pixelDistance: function(p1, p2){
        return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
    },

    /**
     * @private
     */
    positionPixelDistance: function(p1, p2, z){
        return Math.sqrt(Math.pow(p1.getX(z) - p2.getX(z), 2) + Math.pow(p1.getY(z) - p2.getY(z), 2));
    },


    /**
     * Used to parse dates in the P0DT0H0M0S string format. These date strings are 
     * returned by the DDS Web Services. If calls are being made directly to the DDS
     * Web Services, this can be used to translate quickly translate the time format
     * into a useful description.
     * @param {String} pod - required
     * @return {String} The P0DT0H0M0S format written out as a single, human 
     * understandable string.
     * @see WSXMLTunnel
     */
    podParse : function(pod){
        var days    = parseInt(pod.substring(pod.indexOf('P')+1,pod.indexOf('D')));//days
        var hours   = parseInt(pod.substring(pod.indexOf('T')+1,pod.indexOf('H')));//hours
        var minutes = parseInt(pod.substring(pod.indexOf('H')+1,pod.indexOf('M')));//minutes
        var seconds = parseInt(pod.substring(pod.indexOf('M')+1,pod.indexOf('S')));//seconds
        if (days > 0)   
            return ((days*24)+hours) + ' hours ' + minutes + ' minutes ';
        else if (hours > 0)     
            return hours + ' hours ' + minutes + ' minutes ';
        else if (minutes > 0)   
            return  minutes + ' minutes ' + seconds + ' seconds ';
        else 
            return  seconds + ' seconds';
    },
    /**
     * returns object in format: {days:d,hours:h,minutes:m,seconds:s}.
     * @param {String} pod - required
     * @return {Object} returns object in format: {days:d,hours:h,minutes:m,seconds:s}.
     */
    podParseJSON : function(pod){
        var d    = parseInt(pod.substring(pod.indexOf('P')+1,pod.indexOf('D')));//days
        var h   = parseInt(pod.substring(pod.indexOf('T')+1,pod.indexOf('H')));//hours
        var m = parseInt(pod.substring(pod.indexOf('H')+1,pod.indexOf('M')));//minutes
        var s = parseInt(pod.substring(pod.indexOf('M')+1,pod.indexOf('S')));//seconds
        return {
            days:d,
            hours:h,
            minutes:m,
            seconds:s
        };
    },
    LatLonToMercator: function (lat, lon) {
        var rMajor = 6378137; //Equatorial Radius, WGS84
        var shift = Math.PI * rMajor;
        var x = lon * shift / 180;
        var y = Math.log(Math.tan((90 + lat) * Math.PI / 360)) / (Math.PI / 180);
        y = y * shift / 180;
        return { 'X': x, 'Y': y };
    },
    calcMercator_BBOX: function (x, y, zoom) {
        //bottomLeft to TopRight
        var BBOX = "";
        var p1 = this.getTilePosition(x, y, zoom);
        var x = p1.getX(zoom);
        var y = p1.getY(zoom);
        var p2 = new deCarta.Core.Position(0, 0);
        p2.setXY(x + 256, y - 256, zoom);

        var XY1 = this.LatLonToMercator(p1.getLat(), p1.getLon());
        var XY2 = this.LatLonToMercator(p2.getLat(), p2.getLon());
        //var trafBox = XY1.Y + "," + XY1.X + "," + XY2.Y + "," + XY2.X;
        //var trafBox = XY1.X + "," + XY2.Y + "," + XY2.X + "," + XY1.Y;
        var trafBox = XY1.X + "," + XY2.Y + "," + XY2.X + "," + XY1.Y;
        //BBOX = p1.getLon() + ',' + p2.getLat() + ',' + p2.getLon() + ',' + p1.getLat();
        return trafBox;
    }

};//utilities

/* JS POLLUTANTS SHIMS AND OTHER SUCH DEVILRIES */
if (!Function.prototype.bind) {
    
	Function.prototype.bind = function(context){

		var slice = Array.prototype.slice;

		function update(array, args) {
			var arrayLength = array.length, length = args.length;
			while (length--) array[arrayLength + length] = args[length];
			return array;
		}

		function merge(array, args) {
			array = slice.call(array, 0);
			return update(array, args);
		}

		if (arguments.length < 2 && (typeof arguments[0] === 'Undefined')) return this;
		var __method = this, args = slice.call(arguments, 1);
		return function() {
			var a = merge(args, arguments);
			return __method.apply(context, a);
		}
    }
}

/** Convert numeric degrees to radians */
if (typeof(String.prototype.toRad) === "undefined") {
  Number.prototype.toRad = function() {
    return this * Math.PI / 180;
  }
}

if (!Array.prototype.indexOf)
	{
	  Array.prototype.indexOf = function(elt /*, from*/)
	  {
		var len = this.length >>> 0;

		var from = Number(arguments[1]) || 0;
		from = (from < 0)
			 ? Math.ceil(from)
			 : Math.floor(from);
		if (from < 0)
		  from += len;

		for (; from < len; from++)
		{
		  if (from in this &&
			  this[from] === elt)
			return from;
		}
		return -1;
	  };
	}

/*http://paulirish.com/2011/requestanimationframe-for-smart-animating/*/
window.requestAnimFrame = (function(){
    return  window.requestAnimationFrame       || 
            window.webkitRequestAnimationFrame || 
            window.mozRequestAnimationFrame    || 
            window.oRequestAnimationFrame      || 
            window.msRequestAnimationFrame     || 
            function(/* function */ callback, /* DOMElement */ element, time){
            if (!time) time =  1000 / 30;
            window.setTimeout(callback,time);
            };
})();
/**
 * @class
 * Touch library used to abstract mouse / touch events and provide a
 * common input mechanism between desktop and mobile devices. 
 * Supported events:
 * <ul>
 *    <li>touchstart</li>
 *    <li>touchend</li>
 *    <li>touchmove</li>
 *    <li>touchout</li>
 *    <li>tap</li>
 *    <li>doubleTap</li>
 *    <li>longTouch</li>
 *    <li>altTap (rightclick, or ?)</li>
 * </ul>
 *
 * @description Abstracts mouse/touch events
 *
 * @see deCarta.Core.EventManager
 */

deCarta.Touch = {

    observedElements: [],        
    
    events: {
        'touchstart': 'touchstart',
        'touchend': 'touchend',
        'touchmove': 'touchmove',
        'touchout': 'touchout',
        'touchover': 'touchover',
        'tap': 'tap',
        'doubletap': 'doubletap',
        'alttap': 'alttap',
        'longtouch': 'longtouch',
                
        //click aliases
        'mousedown': 'touchstart',
        'mouseup': 'touchend',
        'mousemove': 'touchmove',
        'mouseout': 'touchout',
        'mouseover': 'touchover',  
        'hoveron': 'touchover',
        'hoveroff': 'touchout',          
        'click': 'tap',
        'doubleclick': 'doubletap',
        'rightclick': 'alttap',
        'longclick': 'longtouch',
        
        //press aliases
        'dragstart': 'touchstart',
        'dragend': 'touchend',
        'dragmove': 'touchmove',
        'dragout': 'dragout',
        'press': 'tap',
        'doublepress': 'doubletap',
        'altpress': 'alttap',
        'longpress': 'longtouch'
    },

    LONG_TAP_TIME: 1500,
    DOUBLE_TAP_TOLERANCE: 10,
    DOUBLE_TAP_TIME: 300,
    MAX_TAP_DISTANCE: 10,

    touchable: /webos|bada|android|blackberry|fennec|ip(hone|od|ad)|maemo|opera mob|Kindle Fire|Silk/i.test(navigator.userAgent || navigator.vendor || window.opera),

    withinDistance: function(p1,p2,dist){
        return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2)) <= dist;
    },

    /**
     * Attach a listener to a DOM element.
     * @param {string} event the name of the event to listen for
     * @param {HTMLDOMElement} the element that will be observed
     * @param {function} listener the callback function that will be invoked when the event is triggered
     * @param {boolean} preventDefault if set to true, the default action for the event will be
     * prevented from happening (For example, setting it on an &lt;a%gt; tag will prevent the link
     * from being clickable. <b>NOTE: </b> setting this flag on ANY listener will prevent the
     * default action for the element even if other listeners (attached to the same element / event)
     * don't explicitly prevent it. 
     *
     */
    attachListener: function(event, element, listener, preventDefault){
        //console.log('Attaching listener');
        var observed = this.getElement(element);
        observed.attachListener(event, listener, preventDefault);
    },

    /**
     * Remove a listener
     * @param {string} event
     * @param {HTMLDOMElement} element
     * @param {function} listener
     */
    removeListener: function(event, element, listener){
        var observed = this.getElement(element);
        observed.removeListener(event, listener);
    },

    getElement: function(element){
        for (var i = 0; i < this.observedElements.length; i ++){
            if (this.observedElements[i].element == element){
                return this.observedElements[i];
            }
        }

        var observed = new deCarta.Touch.ObservedElement(element);

        this.observedElements.push(observed);
        return this.observedElements[i];
    },

    stopEvent: function(e){
        try {
            if (e.preventDefault) e.preventDefault();
            if (e.stopPropagation) e.stopPropagation();
            e.returnValue = false;
            e.cancelBubble = true;
        } catch (e){

        }
    }
}

/**
 * @private
 */
deCarta.Touch.ObservedElement = function(domElement){

    this.element = domElement;
    this.preventDefault = false;
    this.listeners = {};      

    var _Pt = function(x, y, t){
        this.x = x;
        this.y = y;
        this.t = t;
    }

    this.startPoint = null;
    this.endPoint = null;
    this.lastPoint = null;
    //this.moveTrail = [];

    this.longTouchListener = null;

    this.lastTapTime = 0;
    this.lastTapLocation = null;


    this.start = function(e){
        //console.log('Start', e.currentTarget);
        if (this.preventDefault){
                if (e){
                    if (e.preventDefault) e.preventDefault();                
                    e.returnValue = false;
                    e.cancelBubble = true;
                }
        }

        var ev = this.normalizeEvent(e);

        // code from opera sessions, opera mobile does not set the 
        // scale parameter, we calc from touch distance
        if (e.touches && e.touches.length == 2){
            this.startTouchDistance = deCarta.Utilities.pixelDistance({x:e.touches[0].pageX, y:e.touches[0].pageY},{x:e.touches[1].pageX, y:e.touches[1].pageY});
        }

        this.trigger('touchstart', ev, e);

        this.startPoint = new _Pt(ev.pageX, ev.pageY, new Date().getTime());
        this.lastPoint = this.startPoint;
        //start a long touch listener
        
        this.longTouchListener = setTimeout(this.longTouch.bind(this, ev), deCarta.Touch.LONG_TAP_TIME);
    }

    this.move = function(e){
       
        if (this.preventDefault){
                if (e){
                    if (e.preventDefault) e.preventDefault();                
                    e.returnValue = false;
                    e.cancelBubble = true;
                }
        }

        var ev = this.normalizeEvent(e);
        var scale = (e.scale || 1);
        ev.rotation = (e.rotation || 0);
        
        if (scale == 1 && e.touches && e.touches.length == 2 && (window.opera || window.PalmSystem)){
            
            var d = deCarta.Utilities.pixelDistance({x:e.touches[0].pageX, y:e.touches[0].pageY},{x:e.touches[1].pageX, y:e.touches[1].pageY});
            scale = d / this.startTouchDistance;
           // alert(scale + ' ' + d + ' ' + this.startTouchDistance);
        }
        
        if (scale) {
            
            ev.scale = scale;
            if (e.touches && e.touches.length > 1){
                this.preventDouble = true;
                
                var x = 0;
                var y = 0;
                for (var j = 0; j < e.touches.length; j++){
                    x += e.touches[j].pageX;
                    y += e.touches[j].pageY;
                }
                ev.centerX = x / e.touches.length;
                ev.centerY = y / e.touches.length;
            }            
        }

        if (deCarta.Window.isIe()){
            ev.pageX = (ev.clientX + document.documentElement.scrollLeft);
            ev.pageY = (ev.clientY + document.documentElement.scrollTop);
        }

        this.trigger('touchmove', ev, e);

        var p = new _Pt(ev.pageX, ev.pageY, new Date().getTime());
        this.lastPoint = p;        
        //this.moveTrail.push(p);
    }

    this.over = function(e){     
        
        var ev = this.normalizeEvent(e);
        this.trigger('touchover', ev, e); 
    }    

    this.out = function(e){     
        
        var ev = e;
        var e = e.relatedTarget || e.toElement || e.originalTarget;
        var legitimateChild = deCarta.Utilities.isChild(e, this.element);
        
        if (!legitimateChild){
            var ev = this.normalizeEvent(e);
            this.trigger('touchout', ev, e);            
        }
    }

    this.end = function(e){
        //console.log('End', e.currentTarget);
        if (this.preventDefault){
                if (e){
                    if (e.preventDefault) e.preventDefault();                
                    e.returnValue = false;
                    e.cancelBubble = true;
                }
        }
        
        var ev = this.normalizeEvent(e);
        this.trigger('touchend', ev, e);
     
        this.endPoint = new _Pt(ev.pageX, ev.pageY, new Date().getTime());

        //it is a double tap.

        if (this.preventDouble){
            setTimeout(function(){
                this.preventDouble = false;
            }.bind(this), deCarta.Touch.DOUBLE_TAP_TIME);
        }

        if (!this.preventDouble && this.lastTapLocation && (new Date().getTime()) - this.lastTapTime < deCarta.Touch.DOUBLE_TAP_TIME){
			
            var d = deCarta.Utilities.pixelDistance(this.startPoint, this.endPoint);

            if (d < deCarta.Touch.DOUBLE_TAP_TOLERANCE) {
                this.lastTapLocation = this.startPoint;
                var elPagePos = deCarta.Utilities.getObjectPosition(this.element);
                if (this.longTouchListener){
                    //remove it.
                    clearInterval(this.longTouchListener);
                    this.longTouchListener = null;
                }                

                this.trigger('doubletap', {
                    relativeX: this.startPoint.x - elPagePos.x,
                    relativeY: this.startPoint.y - elPagePos.y,
                    pageX: this.startPoint.x - elPagePos.x,
                    pageY: this.startPoint.y - elPagePos.y
                    },e);
                
                return;
            }
        }

        //it is a single tap
        if (this.longTouchListener){
            //remove it.
            clearInterval(this.longTouchListener);
            this.longTouchListener = null;

            //and fire tap.
            this.lastTapLocation = this.startPoint;
            this.lastTapTime = new Date().getTime();
            if (deCarta.Touch.withinDistance(this.startPoint, this.lastPoint, 3)){
                if (e.button && e.button == 2){
                    this.trigger('alttap', ev, e);
                } else {
                    this.trigger('tap', ev, e);
                }
            }                      
            
            return;
        }

    }

    this.longTouch = function(e){
        
        //make sure lastPoint is in radius of startPoint
        if (deCarta.Touch.withinDistance(this.startPoint, this.lastPoint, deCarta.Touch.MAX_TAP_DISTANCE)){

            if (this.longTouchListener != null){
                this.longTouchListener = null;
                var elPagePos = deCarta.Utilities.getObjectPosition(this.element);
                var o =  {
                    relativeX: this.startPoint.x - elPagePos.x,
                    relativeY: this.startPoint.y - elPagePos.y ,
                    pageX: this.startPoint.x - elPagePos.x,
                    pageY: this.startPoint.y - elPagePos.y
                    };
                
                this.trigger('longTouch',o,e);
            }            
        } else {
            this.longTouchListener = null;
        }
    }

    this.normalizeEvent = function (e){
        if (!e) return;
        var eObj = null;
        try {
            if (e.targetTouches && e.targetTouches[0]) {
                eObj = deCarta.Utilities.extendObject({}, e.targetTouches[0]);
            } else {
                eObj = deCarta.Utilities.extendObject({} , e);
            }
        } catch (ex){
            eObj = deCarta.Utilities.extendObject({}, e);
        }

 	 if ( eObj.type == 'touchend'){
		//touchend does not provide coords. Use the last ones we stored	
		eObj.pageX = this.lastPoint.x;
		eObj.pageY = this.lastPoint.y;
	 }

        var elPagePos = deCarta.Utilities.getObjectPosition(this.element);
        if (deCarta.Window.isIe()){ // TODO needs version testing
            eObj.pageX = (eObj.clientX + document.documentElement.scrollLeft);
            eObj.pageY = (eObj.clientY + document.documentElement.scrollTop);
            eObj.relativeY = eObj.pageY - elPagePos.y;
            eObj.relativeX = eObj.pageX - elPagePos.x;
        } else {            
            eObj.relativeY = eObj.pageY - elPagePos.y;
            eObj.relativeX = eObj.pageX - elPagePos.x;
        }
        return deCarta.Utilities.extendObject({}, eObj);
    }

    this.attachListener = function(event, listener, preventDefault){
        
        if (!deCarta.Touch.events[event.toLowerCase()]) {         
            throw('Unknown event : ' + event + '. What are you trying to do? Think carefully!');
        }
        //de-alias
        event = deCarta.Touch.events[event.toLowerCase()].toLowerCase();

        if (!this.preventDefault)
            this.preventDefault = preventDefault;

        if (!this.listeners[event]) this.listeners[event] = [];
        this.listeners[event].push({
            listener: listener,
            preventDefault: preventDefault
        });
    }

    this.removeListener = function(event, listener){
        if (!this.listeners[event]) return;
        for (var i =0; i< this.listeners[event].length; i++){
            if (this.listeners[event][i].listener == listener){
                this.listeners[event].splice(i, 1);
            }
        }
    }
	
    this.trigger = function(eventName, event, originalEvent){
        eventName = eventName.toLowerCase();        
        if (this.listeners[eventName]){
            for (var i = 0; i< this.listeners[eventName].length; i++){        
                this.listeners[eventName][i].listener(event, originalEvent);
            }
        }
    }

    this.attach = function(ev, fn, pd){
        if (deCarta.Window.isIe()){
            this.element.attachEvent('on'+ev, fn);
        } else {
            this.element.addEventListener(ev, fn, pd);
        }
    }

    //init stuff
    if (deCarta.Touch.touchable){
        this.attach('touchstart', this.start.bind(this), false);
        this.attach('touchend', this.end.bind(this), false);
        this.attach('touchmove', this.move.bind(this), false);        
    } else {
        //this.element.addEventListener('click', function (e) {this.trigger('touch', e)}.bind(this), false);        
        this.attach('mousedown', this.start.bind(this), false);
        this.attach('mouseup', this.end.bind(this), false);
        this.attach('mousemove', this.move.bind(this), false);        
    }   
    this.attach('mouseover', this.over.bind(this), false);        
    this.attach('mouseout', this.out.bind(this), false);

}
/**
 *
 * @class
 * Abstraction layer used to return useful information about the window
 *
 * @description Window abstraction layer
 */

deCarta.Window = {    

    /**
    * TRUE if the device responds to touch events. 
    */
    isTouchable: function(){
        return deCarta.Touch.touchable;
    },

    /**
     * Returns TRUE if this is a mobile device. 
     */
    isMobile: function(){
        return /bada|android|blackberry|fennec|ip(hone|od|ad)|maemo|opera mob/i.test(navigator.userAgent || navigator.vendor || window.opera);
    },

    /**
     * Returns TRUE if this is a bada device.
     */
    isBada: function(){
        return /bada/i.test(navigator.userAgent || navigator.vendor || window.opera);
    },

    /**
     * Returns true if this is an iOS device.
     **/
    isIOS: function(){
        return /ip(hone|od|ad)/i.test(navigator.userAgent || navigator.vendor || window.opera);
    },

    /**
     * Returns true if this is a safari device.
     **/
    isSafari: function(){
        return /Safari/i.test(navigator.userAgent || navigator.vendor || window.opera);
    },

    /**
     * Returns true if this is an Android device.
     */
    isAndroid: function(){
        return /deviceAndroid/i.test(navigator.userAgent || navigator.vendor || window.opera);
    },

    /**
     * Returns true if this is an IE Browser.
     */
    isIe: function(){
        if (document.all) return true;
    },

    /**
     * Returns true if this is an Chrome Browser.
     */
    isChrome: function(){
        return navigator.userAgent.toLowerCase().indexOf('chrome') > -1;
    },
    
    
    isFirefox: function(){
        return navigator.userAgent.indexOf("Firefox")!=-1;
    },

    /**
     * Should we be using CSS Transforms?
     */
    hasCSSTransforms: function(){
        return (deCarta.Window.isChrome() || deCarta.Window.isIOS());
    },
    
    hasSVG: function(){
        if (typeof this.svgSupport == "undefined"){
            this.svgSupport = document.implementation.hasFeature("http://www.w3.org/TR/SVG11/feature#BasicStructure", "1.1");
        }
        return this.svgSupport;
    },
    
    hasVML: function(){
        
        if (typeof this.vmlSupport == "undefined") { 
            var a = document.body.appendChild(document.createElement('div')); 
            a.innerHTML = '<v:shape id="vml_flag1" adj="1" />'; 
            var b = a.firstChild; 
            b.style.behavior = "url(#default#VML)"; 
            this.vmlSupport = b ? typeof b.adj == "object": true; 
            a.parentNode.removeChild(a); 
        } 
        return this.vmlSupport;
              
    },
    
    hasCanvas: function(){
        if (typeof this.canvasSupport == 'undefined'){
            var elem = document.createElement('canvas');
            this.canvasSupport = !!(elem.getContext && elem.getContext('2d'));
            /*if (!this.canvasSupport){
                //let's even try excanvas //no point in this, in fact it would break
                //the shouldProcessEvent since excanvas does not support getImageData
                //if you know what i mean, which you probably don't. Polyline,js shouldProcessEvent method. 
                try {
                    G_vmlCanvasManager.initElement(elem);
                } catch (e){                    
                    return false;
                }
                this.canvasSupport = !!(elem.getContext && elem.getContext('2d'));
            }*/
        }
        return this.canvasSupport;
    },
	
    /**
     * Returns the reported devicePixelRatio, or if the device does not report it
     * For example, Opera Mobile) it returns a best guesstimate
     */
    getDpr: function(){
        
        if (deCarta.Window.dpr) return deCarta.Window.dpr;
        
        if (this.isIe() || !this.isMobile()) {
            deCarta.Window.dpr = 1;
            return deCarta.Window.dpr;
        }

        if (/bada/i.test(navigator.userAgent || navigator.vendor || window.opera)){            
            deCarta.Window.dpr = window.outerWidth / window.innerWidth;
            return deCarta.Window.dpr;
        }

        if (window.devicePixelRatio){            
            deCarta.Window.dpr = window.devicePixelRatio
            return deCarta.Window.dpr;
        }
        
        if (document.documentElement.clientWidth != window.innerWidth){ 
            deCarta.Window.dpr = Math.floor((window.innerWidth / document.documentElement.clientWidth) * 100) / 100;
            return deCarta.Window.dpr;
        }
        
        if (document.documentElement.clientWidth < 480) deCarta.Window.dpr = 1;
        deCarta.Window.dpr = 1;
        return deCarta.Window.dpr;
    },

    /**
     * Get dimensions of the available viewport, in CSS pixels. 
     *
     */
    getViewport: function(){

        if (this.isIe()){
            return {width: document.body.clientWidth, height: document.body.clientHeight};
        }

        var dpr = this.getDpr();

        if (window.opera){
            return {width: window.innerWidth, height: Math.ceil(window.outerHeight / dpr)};
        }

        if (/bada/i.test(navigator.userAgent || navigator.vendor)){
             return {width: window.innerWidth, height: window.innerHeight};
        }

       /* if (/android/i.test(navigator.userAgent || navigator.vendor || window.opera)){
             return {width: window.outerWidth / dpr, height: (window.outerHeight / dpr) + 10};
        }*/

        //return {width: document.documentElement.clientWidth , height: document.documentElement.clientHeight};
        if (window.devicePixelRatio) return {width: window.innerWidth, height: window.innerHeight};
        return {width: window.innerWidth / dpr, height: window.innerHeight / dpr};
    }

}


/**
 * @class
 * the EventableObject class is a base class which can be extended to 
 * create objects which respond to user input. 
 * All OverlayObjects and the Map objet extend this class.
 * This class installs all necessary event listeners, and also creates all shortcut
 * event methods on the object (ex, object.onclick())
 * The class provides a set of standard methods for event handling, which
 * the subclass will have to override if it needs to provide specific
 * functionality.
 * 
 * @see deCarta.Core.OverlayObject
 * @see deCarta.Core.Map
 */
deCarta.Core.EventableObject = function(){
    this.objectId = 'dCObject-' + (Math.random() + "").replace(".", "");
    this.hovered = false;
    this.createEventHooks();
}

deCarta.Core.EventableObject.prototype = {
	
	createEventHooks: function(){
		var events = deCarta.Core.EventManager.eventNames;
        for (var event in events){

            var mapProp = 'on' + event;
            
            this[mapProp] = function(event, callback){
                var listenerId = deCarta.Core.EventManager.listen(event, callback, this);
                return function(){
                    deCarta.Core.EventManager.stopListeningByIdx(event, listenerId);
                }
            }.bind(this, event);
        }
	},

	on: function(eventList, callback){
		var events = eventList.split(' ');
		for (var i = 0; i < events.length; i++){

			var mapProp = 'on' + events[i];

			if (typeof this[mapProp] === 'function'){
				this[mapProp](callback);
			}
		}
	},

	trigger: function(event, params){
		deCarta.Core.EventManager.trigger(event, params, this);
	},

	addListeners: function(element, opaque){
		
	    deCarta.Touch.attachListener('touchstart', element, this.touchStart.bind(this), opaque);
        deCarta.Touch.attachListener('touchmove', this.owner.owner.canvas, this.touchMove.bind(this), opaque);
        deCarta.Touch.attachListener('touchend', this.owner.owner.canvas, this.touchEnd.bind(this), opaque);        
        deCarta.Touch.attachListener('touchout', element, this.touchOut.bind(this), opaque);
        deCarta.Touch.attachListener('touchover', element, this.touchOver.bind(this), opaque);
        deCarta.Touch.attachListener('doubleTap', element, this.doubleTap.bind(this), opaque);
        deCarta.Touch.attachListener('longTouch', element, this.longTouch.bind(this), opaque);
        deCarta.Touch.attachListener('tap', element, this.tap.bind(this), opaque);
        deCarta.Touch.attachListener('altTap', element, this.altTap.bind(this), opaque);
	},

	touchStart: function(e, oe){
		
	},

	touchMove: function(e, oe){		
		
	},

	touchEnd: function(e, oe){
		
	},

	touchOut: function(e, oe){				
		if (!this.hovered || this.dragging) return;		
		this.triggerEvent('hoveroff', e, oe, true);
		this.hovered = false;
	},

	touchOver: function(e, oe){	
		if (this.hovered || this.dragging) return;
		this.hovered = true;	
		this.triggerEvent('hoveron', e, oe);
	},

	shouldProcessEvent: function(position){
		return true;
	},
        
	doubleTap: function(e, oe){		                
        this.triggerEvent('doubleclick', e, oe);
	},

	longTouch: function(e, oe){			
		this.triggerEvent('longtouch', e, oe);
	},

	tap: function(e, oe){	
		this.triggerEvent('click', e, oe);
	},

	altTap: function(e, oe){		
		this.triggerEvent('rightclick', e, oe);
	},

    checkEvent: function(e, pos){

    	if (this.dragging) return true;
    	
        var mapPosition = deCarta.Utilities.domPosition(this.owner.owner.canvas);
        var x = e.pageX - mapPosition.left - this.domX;
        var y = e.pageY - mapPosition.top - this.domY;  
        return this.shouldProcessEvent(pos, x, y);
    },

    triggerEvent: function(which, e, oe, skipPositionCheck){ 

    	var mapPosition = deCarta.Utilities.domPosition(this.owner.owner.canvas);
        var x = e.pageX - mapPosition.left;
        var y = e.pageY - mapPosition.top;      	
		var eventPosition = this.owner.owner.positionFromXY(x, y);

        if (!skipPositionCheck) if (!this.checkEvent(e, eventPosition)) return;
        var event = new deCarta.Core.Event({
        	DOMevent: oe,
        	touchEvent: e,
        	position: eventPosition
        });        
		deCarta.Core.EventManager.trigger(which, event, this);
    }

}



/**
 * @class
 * Standard Event object that is passed to the listener callback from the EventManager.
 * @param opts: an object literal whose properties will be used to extend the event object. 
 */
deCarta.Core.Event = function(opts){
	/**	
	 * Object upon which the event was fired, eg Map, Pin, Shape, etc.
	 */
	this.object;
	/**	
	 * Type of event fired, eg click, moveend etc.
	 */
	this.eventType;
	/**	
	 * Reference to the actual DOM event fired.
	 */
	this.DOMEvent;
	/**	
	 * Position (eg lat, lon) of the event if applicable.
	 */
	this.position;
	/**
	 * Current center of the map (if applicable)
	 */
	this.center;
	/**
	 * Current zoom of the map (if applicable);
	 */
	this.zoom;
	/**
	 * Current size of the map (if applicable);
	 */
	 this.size;

	deCarta.Utilities.extendObject(this, opts);

}
/**
 * @class
 * The Map Class provides the necessary objects for a mobile online
 * mapping application: it provides the map display and interaction. In its
 * simplest form, Map objects provide a draggable map to the end user.
 * 
 * @description The master map object.
 *
 * @constructor
 * @param {object} options. An object containing some (or all) of the following
 * properties:
 * <ul>
 *   <li>{HTMLDOMElement} id: DOM id of the map element *required*</li>
 *   <li>(int) zoom: the starting zoom level, 20=maxzoom, 1=minzoom, default=3</li>
 *   <li>{@link deCarta.Core.Position} center: Geographic position where the map is initially centered</li>
 *   <li>(bool) easing: whether easing (smooth transitions between zoom levels) is enabled (default: true)</li>
 *   <li>(bool) digitalZoom: <em>true</em> enables animated zoom between levels, optional, default=true</li>
 *   <li>(bool) doubleTapZoom: <em>true</em> enables double click (tap) to zoom on position, optional, default=true</li>
 *   <li>(array of {@link deCarta.Core.MapLayer}) layers: set of tile layers which will be initialized with the map</li>
 *   <li>(array of {@link deCarta.UI.MapControl}) controls: set of map control objects to add to the map</li>
 *   <li>onReady: a callback function which will be invoked when the map has loaded</li>
 *   <li>(bool) draggable: If <em>true</em> allows map to be draggable. Optional, default="true"</li>
 *   <li>(bool) limitFPS: If <em>true</em>, limits the frames-per-second to
 *        the maxFPS value. Optional, default=true</li>
 *   <li>(int) maxFPS: Frames-per-second limit used if limitFPS=true. Optional,
 *       default=30</li>
 *   <li>(int) controlZ: css Z-index for map controls. Each new control created
 *       will have an increasing css z-index starting from this value, allowing
 *       the application to insert page elements above or below the map controls
 *       </li>
 *   <li>(bool) resizeable: If <em>true</em>, map is resizeable. Optional,
 *       default=true</li>
 *   <li>(int) maxZoom: Maximum zoom level (tighest zoom), in the range 1
 *       (min possible zoom) to 20 (max possible zoom). Optional, default=19.</li>
 *   <li>(int) minZoom: Minimum zoom level (widest zoom), in the range 1
 *       (min possible zoom) to 20 (max possible zoom). Optional, default=2.</li>
 *   <li>skipResources: Set to true to skip loading of resources. Optional, 
 *       default=false</li>
 *   <li>boundaries: Defines the latitude and longitude limits for the map. The
 *       map will not display tiles when outside of these bounds. This object has these fields:
 *     <ul>
 *       <li>(float) top: maximum latitude (up to 90), default: 87</li>
 *       <li>(float) bottom: minimum latitude (down to -90) , default: -87</li>
 *       <li>(float) left: leftmost longitude (-180 to 180), default: null</li>
 *       <li>(float) right: right longitude (-180 to 180), default: null</li>
 *     </ul>
 *   </li>
 *   <li>(bool) avoidEvents: If <em>true</em>, the Map does not respond to any input events. optional, default=false</li>
 * </ul>
 * 
 * Map Events
 * 
 * 
 * Your application can add listeners for specific map events. This can be done through the EventManager,
 * or through proxy methods available on the Map object. For example, to install a callback for a zoomStart event,
 * you can proceed in two ways:
 * 
 * map.zoomstart(function(){//your code});
 * 
 * or
 * 
 * deCarta.Core.EventManager.listen('zoomstart', function(){//your code});
 * 
 * 
 *
 * @throw {Exception} if the id option is not set, or invalid.
 */
deCarta.Core.Map = function(options){

    //made the map an eventableObject. This should be good. 
    deCarta.Core.EventableObject.call(this, options);

    /** These are our default options. */
    
    this.type = "map";
    this.options = {
        /**
         * @private
         * mode of the map : can render on regular HTML or a CANVAS
         */
        mode: 'html',
        /**  id of the map container */
        id: null,
        /**  starting zoom level */
        zoom: 3,
        /**  starting center location */
        center: new deCarta.Core.Position(37.689107,-122.427957),
        /**  callback, will execute when the map is fully ready (all resources, modules and so on have loaded) */
        onReady: null,
        /**  callback, will execute if there is an error */
        onError: null,
        /**  Bool, does the map have easing? */
        easing: true,
        /**  Bool, does the map smoothly transition between zoom levels */
        digitalZoom: true,
        /**  Array, can be passed in to initialize a set of layers on the map (also can use addLayer later) */
        layers: null,
        /**  Array, can be passed in with a set of MapControls to add to the map */
        controls: null,
        /**  Bool, true if doubletapping (or clicking) zooms the map */
        doubleTapZoom: true,
        /**  Bool, makes the map draggable */
        draggable: true,
        /** Int : z index for map controls.  */
        controlZ: 1000,
        /** is the map resizeable */
        resizeable: true,
        /** does the map auto resize when the container changes size ? */
        autoResize: true,
        /** if autoResize is set, this is a limit to how often the map will resize. (msec) It improves performance to have a low limit */
        minResizeInterval: 200,
        /** Max allowed zoom level*/
        maxZoom: 19,
        /** Min allowed zoom level */
        minZoom: 2,
		
        /** Is the scroll wheel enabled ?*/
        scrollWheelEnabled: true,
       
        /**
	     * @private
	     * Initial HTTP request callback, apps written against this API will fire an initial
         * request to the server's load balancer and be returned a host to which to bind,
         * this callback is excuted when this initial request returns, with:
         * {success : BOOLEAN, msg : STRING, exTime : NUMBER} */
        bindToServerCallback: undefined,
        /**
	     * @private
         * Skip the RUOK request to load balancer, set to true if not using load balancer
         */
        skipBindingToServer: false,

        /**
         * Set to true to skip loading of resources 
         */
        skipResources: false,
        /*
         * Setting this to true will force the resources to be loaded with a script tag request
         **/
        forceResourceSTAGRequest: false,

        /**
         * Pass an object with top (max latitude up to 90), bottom (min latitude
		 * down to -90, left (longitude from -180 to 180), right (longitude from
		 * -180 to 180) which defines the limits of the map. The map will not
		 * display tiles outside of these limits.
         **/
        boundaries: {
            top: 87,
            bottom: -87,
            left: null,
            right: null
        },
        
        zoomFramer: new deCarta.Core.ZoomFramer(),        

        /**
         * the map ignores all events. 
	     */
        avoidEvents: false
    }

    // Extend the passed options with the defaults.
    this.options = deCarta.Utilities.extendObject(this.options, options);

    //Check for the ONE required option: containerId
    this.containerElement = deCarta.geId(options.id);
    //this.containerElement.style.position = 'relative';
    this.containerElement.onselectstart = function(){return false};
    this.containerElement.oncontextmenu = function(){return false};
    this.containerElement.style.overflow = 'hidden';
    
    
    if (!this.options.id || !this.containerElement) {
        deCarta.Core.Exception.raise('Map creation failed: no DOM id set in the options, or it is invalid');
    }

    // Create and add the map element to the container
    /*if (this.options.mode == 'canvas'){
        this.canvas = deCarta.crEl('canvas');
    } else {*/
        this.canvas = deCarta.crEl('div');
        this.canvas.style.overflow = 'hidden';
    //}

    this.canvas.className = 'deCarta-Mobile-Map';
    this.canvas.style.position = 'absolute';
    this.canvas.style.top = 0;
    this.canvas.style.left = 0;
    this.canvas.style.cursor = 'url("'+deCarta.Core.Configuration.imgPath+'/openhand.cur"), auto';
    this.canvas.style.userSelect = 'none';
    this.canvas.style.mozUserSelect = 'none';
    this.canvas.style.webkitUserSelect = 'none';
    this.canvas.style.unselectable = 'on';
    this.canvas.style.onselectstart = function(){return false};
    //this.containerElement.style.position = 'relative';
    
    
    this.containerElement.appendChild(this.canvas);    
    //this.containerElement.appendChild(this.controlElement);

    // Initialize a bunch of variables. Are they all used? CHECK.
    this.topPosition = (this.options.boundaries.top) ? new deCarta.Core.Position(this.options.boundaries.top, 0) : null;
    this.btmPosition = (this.options.boundaries.bottom) ? new deCarta.Core.Position(this.options.boundaries.bottom, 0) : null;

    this.leftPosition = (this.options.boundaries.left) ? new deCarta.Core.Position(0, this.options.boundaries.left) : null;
    this.rightPosition = (this.options.boundaries.right) ? new deCarta.Core.Position(0, this.options.boundaries.right) : null;

    this.panVector = {
        x: 0,
        y: 0,
        v: 0
    };
    this.layers = [];
    this.controls = [];
    this.ofsX = this.ofsY = 0;
    this.zoom = this.options.zoom;
    this.targetZoom = this.options.zoom;
    this.maxZoom = (typeof this.options.maxZoom !== 'undefined') ? this.options.maxZoom : 20;
    this.minZoom = (typeof this.options.minZoom !== 'undefined') ? this.options.minZoom : 2;
    this.zooming = false;
    this.dragging = false;
    this.easing = false;
    this.dragStartX = this.dragStartY = 0;
    this.lastDragEvent = null;
    this.center = this.options.center;    
    this.targetCenter = this.center.clone();
    this.console = deCarta.geId('console');
    this.tileGrid = new deCarta.Core.TileGrid();
    this.owner = this;
    
    this.needsRender = true;
    this.debugInfo = {
        renderings: 0,
        totalRenderTime: 0,
        skippedRenders: 0,
        moveEvents: 0
    };

    //set to true when RUOK completes
    this.ready = false;

    //set the infowindow here
    this.infoWindow = new deCarta.Core.InfoWindow(this);    

    //set up a rendering listener on tile load
    deCarta.Core.EventManager.listen('tileLoad', function(ev){        
        this.render(true);
    }.bind(this), this);

    this.initControls();
    /**
     * if skipBindingToServer then we will skip the initial RUOK call to the load balancer.
     */
    if (this.options.skipBindingToServer){
        /**
         * break closure of contructor scope so map can initiate in the app w/ setTimeout
         */
        setTimeout(function(){
            this.init();
        }.bind(this), 1);

    } else {        
        // First things first : RUOK request
        // then, we load more stuff
        deCarta.Core.JSRequest.init(function (resp) {
            if (resp.success){                
                this.init();
            } else {
                if(this.options.onError)this.options.onError(resp.msg)
                // raise exception if the user has not provided their own mechanism
                if(!typeof this.options.bindToServerCallback === 'function'){
                    deCarta.Core.Exception.raise(resp.msg)
                }
            }
            if(typeof this.options.bindToServerCallback === 'function'){
                this.options.bindToServerCallback(resp);
            }
        }.bind(this));
    }
}


deCarta.Core.Map.prototype = {

    /**
     * @private
     * So this one here creates the various props that you can use to listen for map events.
     * It iterates thru the eventmanager and creates a proxy funtion for that event.
     * so we will have map.click, map.doubleclick and so on so forth. how neat! weeee    
     */

     //NOTE : this is now inherited from eventableobject

 /*   createListenProps: function(){
        var events = deCarta.Core.EventManager.eventNames;
        for (var event in events){
            //make the prop        
            var mapProp = 'on' + event;
            // }
            
            this[mapProp] = function(event, callback){                
                var listenerId = deCarta.Core.EventManager.listen(event, callback, this);
                return function(){
                    deCarta.Core.EventManager.stopListeningByIdx(event, listenerId);
                }
            }.bind(this, event)            
        }
    },*/
        
    /**
     * @private
     * new code
     */
    initControls: function(){
        
        if (this.ready){
            this.doneControls();
        } else {
            //try again.
            setTimeout(this.initControls.bind(this), 100);
        }
    },

    /**
	 * @private
	 */
    doneControls: function(){
        
        if (this.options.controls){
            for (var i = 0; i < this.options.controls.length; i++){
                this.addControl(this.options.controls[i], true);
            }
        }
        this.drawControls();
        this.resize();
        if (typeof this.options.onImagesLoaded === 'function') this.options.onImagesLoaded();
    },

    _getWidth: function(){
        
    },  
    
    _getHeight: function(){
        
    },
    
    /**
     * Resize the map according to the new size of the containing element.
     * The map will adapt to fill 100% of the containing element when this function
     * is called
     */        
    resize: function(){
        
        if (this._lastResize && !this.options.autoResize) {            
            return;
        }
        if (this._lastResize && this.options.autoResize && this.options.minResizeInterval){
            
            var now = new Date().getTime();
            if (now < (this._lastResize + this.options.minResizeInterval)){
                
                if (this._resizeTimeout) clearTimeout(this._resizeTimeout);
                this._resizeTimeout = setTimeout(this.resize.bind(this),this.options.minResizeInterval );
                return;
            }
        }        
        //if (!this.options.resizeable) return;
        //fix this
        var i = 0;
        
        /*if (this.options.mode == 'canvas'){
            this.width = this.canvas.width = parseFloat(this.containerElement.style.width);
            this.height = this.canvas.height = parseFloat(this.containerElement.style.height);
        } else {*/
        this.width = parseFloat(this.containerElement.style.width);
        this.height = parseFloat(this.containerElement.style.height);
        
        if (!this.width || !this.height){
            this.width = parseFloat(this.containerElement.clientWidth);
            this.height = parseFloat(this.containerElement.clientHeight);
        }           

        this.canvas.style.width = this.width + 'px';            
        this.canvas.style.height = this.height + 'px';
              
        //}                

        if (deCarta.Window.isIe()){
            window.attachEvent('onresize', this.resize.bind(this));
        } else {
            window.addEventListener('resize', this.resize.bind(this));
        }

        this.tileGrid.resize(this.width, this.height);

        for (i = 0; i < this.layers.length; i++){
            this.layers[i].resize(this.width, this.height);
        }

        this.triggerEvent('resize');
        this._lastResize = new Date().getTime();
        this.drawControls();
        this.render();
    },

    /**
     * Returns the highest css z-index used by the map and it's control and overlay
	 * layers. This allows the user to place page elements above the map and all
	 * its layers.
     * @return {int} The highest z-index used by the map
     */
    getHighestZ: function(){

        var max = 0;
        try {
            //find highest layer z
            for (var i = 0; i < this.layers.length; i++){
                if (this.layers[i].options.zIndex) {
                    if (this.layers[i].options.zIndex > max) max = this.layers[i].options.zIndex;
                }
            }
        }catch (e) {
        //error
        }

        return deCarta.Core.Configuration.baseOvlZ + max;
    },

    /** 
    * returns a reference to the InfoWindow object for this map
    * @see deCarta.Core.InfoWindow
    */
    getInfoWindow: function(){
        return this.infoWindow;
    },

    /**
	 * @private
     * Completes map initialization after all resources have loaded.
     */
    init: function(){        
        var i = 0;
        // Set up a few variables
        this.baseZoom = this.zoom;
        this.lastTouchTime = 0;

        this.streetLayer = new deCarta.Core.MapLayer({
            name: 'Map View',
            visible: true,
            tileStore: new deCarta.Core.StreetTileStore({
                precache: !deCarta.Window.isMobile()
            })
        });
        this.addLayer(this.streetLayer);

        this.satelliteLayer = new deCarta.Core.MapLayer({
            name: 'Satellite View',
            visible: false,
            tileStore: new deCarta.Core.SatelliteTileStore({
                precache: false
            })
        });
        this.addLayer(this.satelliteLayer);

        this.hybridLayer = new deCarta.Core.MapLayer({
            name: 'Hybrid View',
            visible: false,
            tileStore: new deCarta.Core.TransparentTileStore({
                precache: false
            })
        });
        this.addLayer(this.hybridLayer); 

        this.defaultOverlay = new deCarta.Core.MapOverlay({
            name: 'Map Data Overlay',
            visible: true
        });
        
        this.addOverlay(this.defaultOverlay);
        var div = deCarta.crEl('div');
        div.style.width = '1px';
        div.style.height = '1px';
        
        /*div.style.backgroundColor = 'black';        */
        this.infoWindowAnchor = new deCarta.Core.Pin({
            position: new deCarta.Core.Position(this.center.lat, this.center.lon),
            image: div
        })

        this.defaultOverlay.addObject(this.infoWindowAnchor);

        if (this.options.layers){
            for (i = 0; i < this.options.layers.length; i++){
                this.addLayer(this.options.layers[i]);
            }
        }
            
        if (!this.options.avoidEvents) {
            this.addListeners(this.canvas, true);
        }

        this.count = 0;

        this.triggerEvent('zoomEnd');
                
        this.resize();
 
        setTimeout(function(){
            if(!deCarta.Window.isMobile() && this.options.scrollWheelEnabled) {
                if (this.options.zoomFramer) {                        
                    this.options.zoomFramer.setOwner(this);
                }
            }
            this._ready()
        }.bind(this), 1);
    },

    /**
     * Add a layer (tile set) to the map. {@see deCarta.Core.MapLayer}
     * @param {deCarta.Core.MapLayer} layer The MapLayer object you wish to add.
     */
    addLayer: function(layer){

        if (!layer.render || !layer.resize){
            deCarta.Core.Exception.raise ('The layer you are trying to add does not support required methods "render" or "resize".');
        }

        layer.setOwner({
            owner: this,
            canvas: this.canvas
        });
        this.layers.push(layer);
        return layer;

    },
	
    /**
     * Removes a layer (tile set) from the map. {@see deCarta.Core.MapLayer}
     * @param: {deCarta.Core.MapLayer} layer The MapLayer object you wish to remove.
     */
    removeLayer: function(layer){
        for (var i = 0; i < this.layers.length; i++){
            if (this.layers[i] == layer) {
                this.layers.splice(i,1);
                return true;
            }
        }
        return false;
    },

    /**
	 * Adds a Map Overlay (which may contain things like Circles, Polylines, Images,
     * Pins, or Polygons) to the map
	 * {@link deCarta.Core.MapOverlay}
	 * {@link deCarta.Core.Circle}
	 * {@link deCarta.Core.Polyline}
	 * {@link deCarta.Core.Image}
	 * {@link deCarta.Core.Pin}
	 * {@link deCarta.Core.Polygon}
	 * @param {deCarta.Core.MapOverlay} overlay A Map Overlay to add
     */
    addOverlay: function(overlay){
        return this.addLayer(overlay);
    },

    /**
     * Removes a Map Overlay from the map.
	 * {@see deCarta.Core.MapOverlay}
	 * @param {deCarta.Core.MapOverlay} overlay A Map Overlay to remove
     */
    removeOverlay: function(overlay){
        return this.removeLayer(overlay);
    },

    /**
     * Sets the "draggable" attribute of the map
     * @param {boolean} value <em>true</em indicates that map is draggable
     */
    setDraggable: function(value){
        this.options.draggable = value;
    },
    /**
     * Sets the "Map Style" 
     * @param {string} value <em>true</em indicates map style
     */
    setMapStyle: function(value){
        deCarta.Core.Configuration.defaultConfig=value;
        deCarta.Core.Configuration.defaultHighResConfig=value;
        this.render();
    },
    /**
     * Show Traffic (requires a server)
     * @param {boolean} 
     */
    showTraffic: function(val){
        // CACHE BREAKER
        deCarta.Core.JSRequest.sessionId = Math.ceil((new Date().getTime()) * Math.random());
        // TOGGLE CONFIG
        deCarta.Core.Configuration.showTraffic = val;
        // CLEAR TILES
        this.tileGrid.tiles=[];
        // RENDER DEZ
        this.render();
    },

    /**
     * Show text in an info window 
     * @param {deCarta.Core.Position} position
     * @param {string} content
     * @param {object} [infoWinOptions] info window options    
     */
    showInfoWin: function(position, content, options){
        this.infoWindowAnchor.setPosition(position);
        this.infoWindowAnchor.options.text = content;
        if (options){
            options.content = content;
            this.infoWindowAnchor.options.infoWinOptions = deCarta.Utilities.extendObject(this.infoWindowAnchor.options.infoWinOptions, options);
        }
        
        this.infoWindowAnchor.showText();
    },

    /**
     * Hide the map infoWindow. (if shown)
     */
    hideInfoWin: function(){
        if (this.infoWindow.target)
            this.infoWindow.target.hideText();
    },

    /**
	 * Redraws/renders the map with the current map settings (such as center, size
	 * and zoom values), as well as any updated layers or overlays.     
     */
    render: function(){        
        this.needsRender = true;        
    },
    
    /**
    * @private. This is the real render function, not that other one.
    */
    frameRender: function(){
        
        if (this.needsRender) {
            this.checkBounds();

            this.tileGrid.prepare(this.center, this.zoom);            

            for (var i = 0; i < this.layers.length; i++){
                this.layers[i].render(this.tileGrid);
            }
            this.needsRender = false;
        }
        requestAnimFrame(this.frameRender.bind(this));        
    },
    /**
	 * Sets the map boundary using a {@link deCarta.Core.MapBoundary} object,
	 * which creates a polygon map boundary. The map will not display tiles outside
	 * of that polygon.
	 * @param {deCarta.Core.MapBoundary} bound An instance of a
	 * {@link deCarta.Core.MapBoundary} object that sets the map boundaries to
	 * an arbitrary polygon.
	 */
    setBoundary: function(bound){        
        this.boundary = bound;
    },

    /**
     * @private
     * Used while rendering, checks the bounds of the map
     **/
    checkBounds: function(){
        /* Check boundaries */
        /*if (!this.boundary)
            if (!this.leftPosition || !this.rightPosition || !this.btmPosition || !this.topPosition) return;*/
   
        if (this.boundary){
            
            if (!this.boundary.checkPosition(this.center)){
                var betterCenter = this.boundary.getClosestPosition(this.center);
                var positionWin = new deCarta.Core.Position(betterCenter.getLat(), betterCenter.getLon());

                this.center = positionWin;
            }

        } else {

            var left = (this.leftPosition) ? this.leftPosition.getX(this.zoom) : null;
            var right = (this.rightPosition) ? this.rightPosition.getX(this.zoom) : null;
            var btm = (this.btmPosition) ? this.btmPosition.getY(this.zoom) :  null;
            var top = (this.topPosition) ? this.topPosition.getY(this.zoom) : null;            

            if (this.options.boundaries.top){
                var topLimit = top - (this.height / 2);

                var centerY = this.center.getY(this.zoom);
                if (centerY > topLimit) centerY = topLimit;

                this.center.setXY(this.center.getX(this.zoom), centerY, this.zoom);
            }
            if (this.options.boundaries.bottom){
                var btmLimit = btm + (this.height / 2);

                var centerY = this.center.getY(this.zoom);
                if (centerY < btmLimit) centerY = btmLimit;

                this.center.setXY(this.center.getX(this.zoom), centerY, this.zoom);
            }
            if (this.options.boundaries.left){
                var leftLimit = left + (this.width / 2);

                var centerX = this.center.getX(this.zoom);
                if (centerX < leftLimit) centerX = leftLimit;

                this.center.setXY(centerX, this.center.getY(this.zoom), this.zoom);
            }
            if (this.options.boundaries.right){
                var rightLimit = right - (this.width / 2);

                var centerX = this.center.getX(this.zoom);
                if (centerX > rightLimit) centerX = rightLimit;

                this.center.setXY(centerX, this.center.getY(this.zoom), this.zoom);
            }
            if (this.options.boundaries.top && this.options.boundaries.bottom){

                var height = Math.abs(btm - top);

                if (height < this.height){
                    var centerY = (btm + top) / 2
                    this.center.setXY(this.center.getX(this.zoom), centerY, this.zoom);
                }
            }
            if (this.options.boundaries.left && this.options.boundaries.right){

                var width = Math.abs(right - left);

                if (width < this.width){
                    var centerX = (right + left) / 2;
                    this.center.setXY(centerX, this.center.getY(this.zoom), this.zoom);
                }
            }
        }

    },


    /**
    * Sets the map in Street mode
    */
    setStreetView: function(){

        this.streetLayer.show();
        this.satelliteLayer.hide();
        this.hybridLayer.hide();

        this.render();
        this.triggerEvent('viewchange',{view: 'street'});
    },

    /**
    * Sets the map in Satellite mode
    */
    setSatelliteView: function(){

        this.streetLayer.hide();
        this.satelliteLayer.show();
        this.hybridLayer.hide();

        this.render();
        this.triggerEvent('viewchange',{view: 'satellite'});
    },

    /**
    * Sets the map in Hybrid Mode
    */
    setHybridView: function(){
        
        this.streetLayer.hide();
        this.satelliteLayer.show();
        this.hybridLayer.show();

        this.render();
        this.triggerEvent('viewchange',{view: 'hybrid'});
    },

    /**
	 * @private
     */
    triggerEvent: function(event, extraParams){
        var params={            
            center: this.center,
            zoom: this.zoom,
            previousZoom: this.prevZoom,
            targetZoom: this.targetZoom,
            size: {
                width: this.width,
                height: this.height
            }
        };
        params = new deCarta.Core.Event(deCarta.Utilities.extendObject(params,extraParams));        
        deCarta.Core.EventManager.trigger(event, params, this);  
    },
    
    /**
     * @private
     */
    drawConsole: function(){
        if (!this.console) return;
        var s = '';
        for (var info in this.debugInfo){
            s += info + ' : ' + this.debugInfo[info] + ' <br />';
        }
        this.console.innerHTML = s;
    },
    
    altTap: function(e, oe){
        var position = this.positionFromXY(e.relativeX, e.relativeY);

        this.triggerEvent('rightclick',{            
            position: position,
            DOMEvent: e,
            touchEvent: oe
        });
    },
    
    tap: function(e, oe){

        var position = this.positionFromXY(e.relativeX, e.relativeY);
        this.triggerEvent('click',{
            position: position,
            DOMEvent: e,
            touchEvent: oe
        });
    },

    /**
	 * @private
     */
    doubleTap: function(e, oe){
        
        //if (this.zooming) return;
        if (!this.options.doubleTapZoom) return;
        var fixedPos = this.positionFromXY(e.relativeX, e.relativeY);

        this.triggerEvent('doubletap',{
            position: fixedPos,
            DOMEvent: e,
            touchEvent: oe
        });

        if(this.options.zoomFramer){
            this.options.zoomFramer.framing=true;
            try {
                this.options.zoomFramer.dom.style.top =  e.relativeY + "px";
                this.options.zoomFramer.dom.style.left =  e.relativeX + "px";
            } catch (ex) {
                // The exception has occurred. However don't feel so bad. 
                // Think about the steak at Kokkari.
                // mmmm... the steak. so delicious. forget about the exception.
                // there is no exception.                 
            }
        }

        this.zoomIn(1, fixedPos);
        //this.zoomIn(1);
    },

    /**
	 * @private
     */
    longTouch: function(e, oe){
        
        var pos =  this.positionFromXY(e.relativeX, e.relativeY);

        this.triggerEvent('longtouch',{
            position: pos,
            DOMEvent: e,
            touchEvent: oe
        });
    },

    /**
	 * @private
     */
    touchStart: function(e, oe){

        if (!this.options.draggable) return;
        
        this.canvas.style.cursor = 'url("'+deCarta.Core.Configuration.imgPath+'/closedhand.cur"), auto';
        var pos =  this.positionFromXY(e.relativeX, e.relativeY);

        this.dragging = true;
        this.dragged = false;

        this.panVector.v = 0;

        this.lastMoveX = e.pageX;
        this.lastMoveY = e.pageY;

        if (oe.preventDefault) oe.preventDefault();
        return false;
    },
    
    /**
	 * @private
     */
    touchOut: function(e, oe){
        this.touchEnd(e, oe);
    },

    /**
     * @private
     */
    touchEnd: function(e, oe){
        if (!this.dragging) return;
        this.dragging = false;        
        if (this.dragged){
            this.triggerEvent('moveend');
            if (this.startZoom == this.zoom || !this.startZoom) {
                this._ease();
            }
        }
        this.startZoom = null;

        if (oe && oe.preventDefault) oe.preventDefault();
        this.canvas.style.cursor = 'url("'+deCarta.Core.Configuration.imgPath+'/openhand.cur"), auto';
        return false;
    },

    /**
	 * @private
     */
    touchMove: function(e, oe){
        
        if (!this.dragging || !this.options.draggable) return false;

        this.debugInfo.tScale = e.scale;
        if (e.scale && e.scale != 1){

            if (!this.startZoom) this.startZoom = this.zoom;

            var curZoom = this.zoom;
            var tZoom = this.startZoom + ( (Math.log(e.scale)) / (Math.log(2)));

            var fixedPoint = this.positionFromXY(e.centerX, e.centerY);
            this.zoom = tZoom;

            this.center = deCarta.Utilities.getCenterToFixPositionAtNewZoom(
                fixedPoint,
                this.center,
                curZoom,
                this.zoom
                )
 
            this.triggerEvent('zoomChange',{
                position: fixedPoint,
                DOMEvent: e,
                touchEvent: oe
            });

        } else {
            
            var dX = e.pageX - this.lastMoveX;
            var dY = e.pageY - this.lastMoveY;        

            if (deCarta.Window.isIe() && window.msRequestAnimationFrame){
                /**
                This piece of code is a testament to the fantastic advances IE has made over the last decade.                 

                So what we do here is try and figure out the events that are completely off. This
                is done by calculating the angle between the last 2 events. If it's completely off, 
                we wait 4 completely off events before we decide that, yes, this is intentional. 
                This will probably cause *some* grief, but it eliminates the problem where the map
                will ease in THE DIRECTION OPPOSITE TO THE ONE WHERE IT WAS BEING DRAGGED, which was
                annoying (to say the least). 
                If this code later on causes huge problems, well, that is really too bad. 
                I have to go now.             
                */
                if (dX != 0 && dY!= 0) {                    
                    //this is when ie gives you the random mouse events.                     
                    this.ang = deCarta.Utilities.getAnglePx({x: 0, y: 0},{x: dX, y: dY});                    
                    if (!this.oldAng) {
                        //let's initialize the veriables necessary to the operation of the stupidity counter.  
                        this.badAngCount = 0;
                        this.oldAng = this.ang;
                    }
                    if (this.badAngCount > 4 || ((this.oldAng - 30 < this.ang) && (this.ang < this.oldAng + 30))){                        
                        //then ok, it's within 60, how can that be bad. 
                        this.panVector.x = dX;
                        this.panVector.y = dY;
                        this.panVector.v = 1;
                        this.oldAng = this.ang;
                        this.badAngCount = 0;
                    } else {
                        this.badAngCount ++;  
                        //if we are here, we should give up, forfeit, forego, abandon.
                        return;
                    }
                }                
            } else {
                /* This is the code for regular browsers. */
                this.panVector.x = dX;
                this.panVector.y = dY;
                this.panVector.v = 1;
            }

            var centerX = this.center.getX(this.zoom);
            var centerY = this.center.getY(this.zoom);

            this.center.setXY(centerX - dX, centerY + dY, this.zoom);            

            this.lastMoveX = e.pageX;
            this.lastMoveY = e.pageY;

            if (!this.dragged){
                this.triggerEvent('movestart',{
                    position: this.center,
                    DOMEvent: e,
                    touchEvent: oe
                });
                this.dragged = true;
            } else {
                this.triggerEvent('move',{
                    position: this.center,
                    DOMEvent: e,
                    touchEvent: oe
                });
            }
        }

        this.debugInfo.moveEvents ++;
        this.render();

        if (oe.preventDefault) oe.preventDefault();
        return false;
    },


    /**
     *  Zooms to a specific zoom level
     *  @param {int} z A valid zoom level (20=maxzoom, 1=minzoom)
     *  @param {deCarta.Core.Position} fixedPos A geographic position on the map 
     *  which should maintain the same position in the viewport when the zoom is
     *  complete.
     */
    zoomTo: function(z, fixedPos, instantaneous){
        if (z == this.zoom) return;
        if (z < this.minZoom) z = this.minZoom;
        if (z > this.maxZoom) z = this.maxZoom;
        if (Math.abs(z - this.zoom) < 4 && !instantaneous){
            
            this.targetZoom = z;
            if (!fixedPos) fixedPos = this.center;
            this._xzoom(this.targetZoom > this.zoom, fixedPos);
        } else {
            
            this.zoom = z;
            this.targetZoom = z;
 
            this.triggerEvent('zoomEnd',{
                position: fixedPos
            });

            this.render();
        }
    },

    /**
     *  Centers the map on a specific location.
     *  @param p (deCarta.Core.Position) new center position
     *  @param aniOptions (Object) animation options (Optional. Defaults: {animated: true, duration 500})
     */
    centerOn: function(p, aniOptions){
        
        if (!aniOptions)
            aniOptions = {
                animated: true,
                duration: 500
            };
        if (!aniOptions.duration)
            aniOptions.duration = 500;
        if (!aniOptions.onDraw)
            aniOptions.onDraw = null;                
        
        if (aniOptions.animated){
            this.targetCenter = new deCarta.Core.Position(p.getLat(), p.getLon());
            this.targetCenterTime = new Date().getTime() + aniOptions.duration;
            // if (typeof aniOptions.onComplete === 'function') 
            //     aniOptions.onComplete();
            this._pan(aniOptions.onDraw,aniOptions.onComplete);
        } else {
            delete this.center;
            this.center = new deCarta.Core.Position(p.getLat(), p.getLon());
            this.center.quantize(this.zoom);
            this.render();
            
            this.triggerEvent('moveend');
            if (typeof aniOptions.onComplete === 'function') setTimeout(function(){aniOptions.onComplete();}, 1);
        }
    },

    /**
     * Pan the map 
     * @param where {string} one of [north, south, east, west]
     * @param howMuch {int} distance to pan in pixels
     *
     */
    pan: function(where, howMuch){        
        
        var pxPos = this.center.getPixelPoint(this.zoom);
        switch (where){
            case 'north':
                if (!howMuch) var howMuch = this.height / 2;                
                pxPos.y += howMuch;
                break;
            case 'east':
                if (!howMuch) var howMuch = this.width / 2;                
                pxPos.x += howMuch;
                break;
            case 'south':
                if (!howMuch) var howMuch = this.height / 2;
                pxPos.y -= howMuch;
                break;
            case 'west':
                if (!howMuch) var howMuch = this.width / 2;
                pxPos.x -= howMuch;
                break;
        }
        var p = new deCarta.Core.Position(0,0);
        p.setXY(pxPos.x, pxPos.y, this.zoom);
        
        this.centerOn(p, {
            animated: true,
            duration: 200
        });
    },

    /**
     * Zooms in by a specified amount.
     * @param d (float) delta to be added to the current zoom
     * @param fixedPos (deCarta.Core.Position) a position which should maintain
     *  the same position in the viewport when the zoom is complete.
     */
    zoomIn: function (d, fixedPos){
        if (this.zooming) {
            
            return;
        }
        if (this.zoom == this.maxZoom) return;
        var snap = false;
        if (!d) {
            d = 1;
            snap = true;
        }
        if (!fixedPos) fixedPos = this.center;
        
        this.zooming = true;
        
        this.targetZoom = this.zoom + d;
        if (snap) this.targetZoom = Math.round(this.targetZoom);
        
        if (this.targetZoom > this.maxZoom) this.targetZoom = this.maxZoom;

        this._xzoom(true, fixedPos);
    },
    /**
     * Zooms out by a specified amount.
     * @param d (float) delta to be subtracted from the current zoom
     * @param fixedPos (deCarta.Core.Position) a position which should maintain
     *  the same position in the viewport when the zoom is complete.
     */
    zoomOut: function(d, fixedPos){
        if (this.zooming) return;
        if (this.zoom == this.minZoom) return;
        var snap = false;
        if (!d) {
            d = 1;
            snap = true;
        }
        if (!fixedPos) fixedPos = this.center;
        
        this.zooming = true;
        
        this.targetZoom = this.zoom - d;
        if (snap) this.targetZoom = Math.round(this.targetZoom);

        if (this.targetZoom < this.minZoom) this.targetZoom = this.minZoom;

        this._xzoom(false, fixedPos);
    },

    /**
     * @private Performs the animated zoom.
     *
     * Changed to be based on timecode rather than frames, for prettyness.
     *
     * @param direction: boolean (true: zoom in, false: zoom out)
     * @param fixedPos : Position
     */
    _xzoom: function(direction, fixedPos){
        this.prevZoom = this.zoom;
        this.zooming = true;
        this.triggerEvent('zoomStart');

        if (!this.options.digitalZoom){
            this.zoom = this.targetZoom;
            this.triggerEvent('zoomEnd');
            this.zooming = false;
            this.render();
            return;
        }

        var duration = 300;

        var startTime = new Date().getTime();

        var startZoom = this.zoom;

        var startCenter = this.center;

        var curZoom = this.zoom;
        
        var easingFn = deCarta.Easing('cubicinout');

        var zoomstep = function(){
            
            var now = new Date().getTime();
            if (now >= startTime + duration){
                curZoom = this.zoom;
                this.zoom = this.targetZoom;
                this.center = deCarta.Utilities.getCenterToFixPositionAtNewZoom(fixedPos, startCenter, startZoom, this.zoom);

                this.triggerEvent('zoomEnd');

                this.render();
                this.zooming = false;

                
                
            } else {
                
                curZoom = this.zoom;
                this.zoom = easingFn(now - startTime, startZoom, this.targetZoom - startZoom, duration);

                this.triggerEvent('zoomChange');
                this.center = deCarta.Utilities.getCenterToFixPositionAtNewZoom(fixedPos, this.center, curZoom, this.zoom);

                this.render();

                requestAnimFrame(zoomstep)
            }

        }.bind(this);

        zoomstep();
    },

    /**
     * @private Performs the easing animation.
     *
     * Change it to work with time, like zoom.
     *
     **/
    _ease: function(){
        
        if (!this.options.easing) {            
            return;
        }

        this.triggerEvent('movestart');

        this.easing = true;

        var fps = 33;
        var msPerFrame = 1000 / fps;

        var friction = 0.90;
        var easestep = function(){

            if (this.dragging) return;
            
            this.panVector.v *= friction;
            var dX = this.panVector.x * this.panVector.v;
            var dY = this.panVector.y * this.panVector.v;

            var centerX = this.center.getX(this.zoom);
            var centerY = this.center.getY(this.zoom);

            this.center.setXY(Math.round(centerX - dX), Math.round(centerY + dY), this.zoom);

            this.triggerEvent('move');

            this.render();

            if (this.panVector.v > 0.05) {
                //setTimeout(easestep, msPerFrame);
                requestAnimFrame(easestep, null, msPerFrame);
            } else {
                
                this.triggerEvent('moveend');
                this.easing = false;
            }
        }.bind(this);

        easestep();
    },

    _pan: function(onDraw,onComplete){
        //if (this.dragging) return;

        var centerX = this.center.getX(this.zoom);
        var centerY = this.center.getY(this.zoom);

        var tX = this.targetCenter.getX(this.zoom);
        var tY = this.targetCenter.getY(this.zoom);
        var timeLeft = this.targetCenterTime - new Date().getTime();
        var remainingFrames = Math.floor(timeLeft / (1000 / 20));
        
        if (remainingFrames > 0){

            /* var nX = Math.floor((centerX + tX) / 2);
            var nY = Math.floor((centerY + tY) / 2);*/

            var xStep = (tX - centerX) / remainingFrames;
            var yStep = (tY - centerY) / remainingFrames;
            var nX = centerX + xStep;
            var nY = centerY + yStep;

            this.center.setXY(nX, nY, this.zoom);
            if (onDraw) onDraw(this.center);

            this.render();
            
            requestAnimFrame(function(){
                this._pan(onDraw,onComplete)
            }.bind(this), null, 1000 / 20);
            
        } else {            
            this.center.setXY(tX, tY, this.zoom);
            if (onComplete && (typeof onComplete === 'function')){                
                setTimeout(function(){onComplete();}, 1);
            }             
            this.render();
        }
    },

    /**
     * @private Called when map is ready, everything is loaded and good to go
     */
    _ready: function(){
        this.frameRender();
        this.ready = true;
        if (typeof this.options.onReady === 'function'){
            this.options.onReady(this);
        }

    },

    /**
     * Returns a boolean value indicating if the map is currently animating
     * @return (bool)
     */
    animating: function(){
        return (/*this.dragging ||*/this.easing || this.zooming);
    },

    /**
     * Returns the current zoom level
     */
    getZoom: function (){
        return this.zoom;
    },
    
    /**
     * Returns the map's center position (deCarta.Core.Position)
     */
    getCenter: function(){
        return this.center;
    },

    /**
     * Get the radius of the visible portion of the map (deCarta.Core.Radius)
     */
    getRadius: function(){
        //get the viewable radius of the map
        var topLeft = new deCarta.Core.Position(0,0);

        var x = this.center.getX(this.zoom) - (this.width / 2);
        var y = this.center.getY(this.zoom) - (this.height / 2);

        topLeft.setXY(x, y, this.zoom);

        var km = deCarta.Utilities.getPointDistance(this.center, topLeft);

        return new deCarta.Core.Radius(km, 'KM');
    },

    /**
     * Returns the deCarta.Core.Position that corresponds to x,y pixels from the viewport's top left
     */
    positionFromXY: function(x,y){

        var centerX = this.center.getX(this.zoom);
        var centerY = this.center.getY(this.zoom);

        var fixedPos = new deCarta.Core.Position(0,0);

        var fpOfsX = (x -  (this.width / 2));
        var fpOfsY = (y -  (this.height / 2))

        fixedPos.setXY(centerX + fpOfsX, centerY - fpOfsY, this.zoom);

        return fixedPos;
    },
    

    getViewHash: function(){
        //TODO
    },
    /**
     * Returns an array of positions describing the visible area of the map. 
     */
    getVisibleRect: function(){
        var topLeft = new deCarta.Core.Position(0,0);

        var x = this.center.getX(this.zoom) - (this.width / 2);
        var y = this.center.getY(this.zoom) - (this.height / 2);
        
        topLeft.setXY(x, y, this.zoom);

        var topRight = new deCarta.Core.Position(0,0);

        var x = this.center.getX(this.zoom) + (this.width / 2);
        var y = this.center.getY(this.zoom) - (this.height / 2);
        
        topRight.setXY(x, y, this.zoom);
        
        var btmLeft = new deCarta.Core.Position(0,0);

        var x = this.center.getX(this.zoom) - (this.width / 2);
        var y = this.center.getY(this.zoom) + (this.height / 2);

        btmLeft.setXY(x, y, this.zoom);

        var btmRight = new deCarta.Core.Position(0,0);

        var x = this.center.getX(this.zoom) + (this.width / 2);
        var y = this.center.getY(this.zoom) + (this.height / 2);
        
        btmRight.setXY(x, y, this.zoom);
        
        return [ btmLeft, btmRight, topRight, topLeft ];
    },

    /**
    * Returns a bounding box describing the visible area of the map    
    */
    getBoundingBox: function(){
        return new deCarta.Core.BoundingBox(this.getVisibleRect());
    },

    /**
     * Adds a deCarta.UI.MapControl object dynamically to the map
     * @param control (deCarta.UI.MapControl)
     */
    addControl: function(control, skipDraw){
        control.setOwner(this);
        this.controls.push(control);
        if (deCarta.UI && deCarta.UI.ControlPositioner)
                deCarta.UI.ControlPositioner.add(control);
        if (!skipDraw) this.drawControls();
    },

    /**
     * Adds a deCarta.UI.MapControl object dynamically to the map
     * @param control (deCarta.UI.MapControl)
     */
    removeControl: function(control, skipDraw){
        control.setOwner(this);
        this.controls.push(control);
        for(var i=0;i< this.controls.length; i++){
            
        }
        if (deCarta.UI && deCarta.UI.ControlPositioner)
                deCarta.UI.ControlPositioner.add(control);
        if (!skipDraw) this.drawControls();
    },

    /**
     * @private
     * Redraws the map controls if needed
     */
    drawControls: function(){
        var drawnControls = []; 
        for (var i = 0; i < this.controls.length; i++){     
            this.controls[i].setZ(this.options.controlZ);            
            this.controls[i].render(this.containerElement);
            this.controls[i].position(drawnControls, this.controls);        
            if(deCarta.Utilities.getComputedStyle(this.controls[i].domElement,"display") =="block")
                drawnControls.push(this.controls[i]);
        }
    },

    setTileSize: function(size){
        //constant, oh, so constant.
        deCarta.Core.Constants.TILE_SIZE = size;
    },

    suspendResizing: function(){
        this._wasResizeable = this.options.resizeable;
        this.options.resizeable = false;
    },

    resumeResizing: function(){
        if (typeof this._wasResizeable === 'undefined') return;
        this.options.resizeable = this._wasResizeable;
    },

    isResizeable: function(){
        return this.options.resizeable;
    },

    toJSON: function(){
        var mapJson = {
            center: this.center,
            zoom: this.zoom/*,
            /*options: this.options,
            layers: this.layers,
            controls: this.controls*/
        }      
       
        return JSON.stringify(mapJson);
    },
        getViewHash: function (pod) {
            function be(bg, bf) {
                while (bg.length < bf) {
                    bg = "0" + bg
                }
                return bg
            }
            var bc = this.zoom;
            var bd = this.center;
            var ba = be(this._n2s(Math.round((90 + bd.getLat()) * 10000)), 5);
            var bb = be(this._n2s(Math.round((180 + bd.getLon()) * 10000)), 5);
            var a9 = be(this._n2s(bc), 1);
            return a9 + ba + bb
        },

        restoreViewFromHash: function (pod) {

        },

        parseViewHash: function (bd) {
            try {
                var a9 = this._s2n(bd.substr(0, 1));
                var bc = (this._s2n(bd.substr(1, 5)) / 10000) - 90;
                var be = (this._s2n(bd.substr(6, 5)) / 10000) - 180;
                if (isNaN(a9) || isNaN(bc) || isNaN(be)) {
                    return false
                }
                var bb = new deCarta.Core.Position(bc, be)
            } catch (ba) {
                return false
            }
            return { zoom: a9, center: bb }
        },

        _n2s: function (a9) {
            var bb = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ-=";
            var ba = "";
            while (a9 > 0) {
                var bc = a9 % 64;
                a9 = a9 >> 6;
                ba = bb.charAt(bc) + ba
            }
            return ba
        },

        _s2n: function (bc) {
            var bb = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ-=";
            var ba = 0;
            for (var a9 = 0; a9 < bc.length; a9++) {
                var be = bc.charAt(a9);
                var bd = bb.indexOf(be);
                ba = (ba << 6) + bd
            }
            return ba
        }

}

deCarta.Core.Map.prototype = deCarta.Utilities.inherit(deCarta.Core.Map.prototype, deCarta.Core.EventableObject.prototype);
/**
 * @class
 * @ignore
 * @private
 * The Edge class defines a segment between two positions. 
 *
 * @see deCarta.Core.MapBoundary
 * @see deCarta.Core.Polyline
 */

deCarta.Core.Edge = function(a, b){

    this.scale = .000000011703344634137276992194;

    this.pos2point = function (pos){
        return {
            x: deCarta.Utilities.lon2pix(pos.getLon(), this.scale), 
            y: deCarta.Utilities.lat2pix(pos.getLat(), this.scale)
        };
    }

    this.a = this.pos2point(a);
    this.b = this.pos2point(b);

    /* Checks if the ray from P to RIGHT INFINITY OF THE INFINITE insterscts. */
    this.rayIntersect = function(p){
        var p = this.pos2point(p);
        var a = this.a;
        var b = this.b;
        
        //http://www.youtube.com/watch?v=eB5VXJXxnNU SCIENCE!
        var FAKE_INFINITY = 999999999999109999999899999910; 

        if(a.y > b.y){
            a = this.b;
            b = this.a;
        }

        //avoid POINT ON VERTEX, move it up just a bit
        if (p.y == a.y || p.y == b.y) p.y += 0.0000001;

        if (p.y < a.y || p.y > b.y) return 0;

        if (p.x > Math.max(a.x, b.x)) return 0;

        if (p.x < Math.min(a.x, b.x)) return 1;

        if (a.x != b.x){
            var a1 = (b.y - a.y) / (b.x - a.x);
        } else {
            var a1 = FAKE_INFINITY;
        }

        if (a.x != p.x){
            var a2 = (p.y - a.y) / (p.x - a.x)
        } else {
            var a2 = FAKE_INFINITY;
        }

        return (a2 >= a1) ? 1 : 0;
    };
    
    this.pointDistance = function(p){
        
        var p = this.pos2point(p);
        
        var x0 = this.a.x;
        var y0 = this.a.y;
        var x1 = this.b.x;
        var y1 = this.b.y;
        var x = p.x;
        var y = p.y;

        //http://softsurfer.com/Archive/algorithm_0102/algorithm_0102.htm#Distance to 2-Point Line
        var d = Math.abs((((y0 - y1 ) * x) + ((x1 - x0) * y)  + ((x0 * y1) - (x1 * y0))) /
                    Math.sqrt(Math.pow(x1 - x0, 2) + Math.pow(y1 - y0, 2)));

        var slope = (y1 - y0) / (x1 - x0);

        //lame slope fix :
        if (slope > 99999999999999999999999999) slope = 99999999999999999999999999;
        if (slope == 0) slope = .000000000000000001;

        var orthoSlope = - ( 1 / slope);

        var b = (y1 - slope * x1);
        var c = y - (orthoSlope * x);

        var ix = (c - b) / (slope - orthoSlope) ;
        var iy = (orthoSlope * ix) + c;

        //is it within?

        var ly = Math.min(y0, y1);
        var hy = Math.max(y0, y1);
        var lx = Math.min(x0, x1);
        var hx = Math.max(x0, x1);

        if ( ly <= iy && iy <= hy && lx <= ix && ix <= hx) {
            //very well. 
        } else {                
            //find the nearest end of the segment, use it
            var p0d = Math.sqrt(Math.pow(x - x0, 2) + Math.pow(y - y0, 2));
            var p1d = Math.sqrt(Math.pow(x - x1, 2) + Math.pow(y - y1, 2));
            
            if (p0d < p1d){
                d = p0d;
                iy = y0;
                ix = x0;
            } else {
                d = p1d;
                iy = y1;
                ix = x1;
            }
        }

        var ipos = new deCarta.Core.Position(deCarta.Utilities.pix2lat(iy, this.scale), deCarta.Utilities.pix2lon(ix, this.scale));
        
        return {distance : d, position: ipos};
    };
    

}
deCarta.Core.GeoHash = {	

	DICT: "0123456789bcdefghjkmnpqrstuvwxyz",

	encode: function(lat, lon, precision){

		if (!precision) precision = 12;
		var res = '';

		var bounds = {
			bottom: -90.0,
			top: 90.0,
			left: -180,
			right: 180 
		};

		var ch = 0;
		var bit = 0;		

		while (res.length < precision){
			
			if (bit  % 2 ==0){
				var mid = (bounds.left + bounds.right) / 2;
				if (lon > mid) {					
					ch |= 16 >> (bit % 5);
					bounds.left = mid;					
				} else {
					bounds.right = mid;					
				}
			} else {
				var mid = (bounds.top + bounds.bottom) / 2;
				if (lat > mid) {					
					ch |= 16 >> (bit % 5);
					bounds.bottom = mid;					
				} else {
					bounds.top = mid;					
				}
			}

			bit ++;
			if (bit % 5 == 0){
				res += this.DICT[ch];
				ch = 0;
			}
		}

		return res;
	},
	
	decode: function(hash){		

		var bounds = {
			bottom: -90.0,
			top: 90.0,
			left: -180,
			right: 180 
		};

		var bit = 0;
		
		for (var i = 0, l = hash.length; i < l; i++){
			var ch = this.DICT.indexOf(hash[i]);
			for (var j = 0; j < 5; j++){
				if (bit % 2 == 0){
					var mid = (bounds.left + bounds.right) / 2;
					if (ch  & (16 >> (bit % 5))){
						bounds.left = mid;
					} else {
						bounds.right = mid;
					}
				} else {
					var mid = (bounds.top + bounds.bottom) / 2;
					if (ch  & (16 >> (bit % 5))){
						bounds.bottom = mid;
					} else {
						bounds.top = mid;
					}
				}

				bit ++;
			}
		}

		return {lat: (bounds.top + bounds.bottom) / 2, lon: (bounds.left + bounds.right) / 2}
	}
}
/**
 * @class
 * A MapControl is a base class upon which to build custom map controls
 * This base class should be extended to provide the desired functionality
 * in your control.
 *
 * Some the following for some already-defined map controls:
 * {@link deCarta.UI.CopyrightControl}
 * {@link deCarta.UI.ZoomControl}
 *
 * @description Base Class for Map Controls
 *
 * @constructor
 * @param {object} options Options A list of options for the control, which will vary 
 * depending on the functionality the control offers. However, there is a set
 * of standard options every control should implement:
 * <ul>
 *  <li>(string) position: specifies how the control will be positioned on the map. can
 *  be one of 'topLeft', 'topRight', 'bottomLeft', 'bottomRight' or any other
 *  <li>(function) layout: You can also specify a layout function, given a map size (width, height) 
 * and a list of existing map controls returns 
 * an object in the format {top: int, left: int}, specifying where the control should be placed. 
 * If specified, the result of the layout function overrides the position attribute. </li>
 * </ul>
 *
 * @see deCarta.UI.CopyrightControl
 * @see deCarta.UI.ZoomControl
 * @see deCarta.Core.Map
 **/

deCarta.UI.MapControl = function(options){

    this.options = {
        position: null, //position on the map : topLeft, topRight, bottomLeft, bottomRight, center, custom.
        marginX: 0, //margins from edge of map
        marginY: 0,
        layout: function(){                                    
            return {top: 0, left: 0}
        }
    }

    this.options = deCarta.Utilities.extendObject(this.options, options);
    
    this.id = 'deCarta-control-' + Math.random().toString().replace('.','');
    
    this.domElement = null;
}


deCarta.UI.MapControl.prototype = {
    /**
	 * You need to implement the render method in every map control so that
     * it produces a single HTML Dom Element containing the whole GUI for the control.
     * The render function should return this DOM Element to the caller so that it can
     * be placed on the map.
     *
     * The dom element should be created with the following css attributes :
     * <ul>
     *  <li>Position: absolute</li>
     *  <li>top (bottom): appropriate for the position specified in the options</li>
     *  <li>left (right): appropriate for the position specified in the options</li>
     * </ul>
     *
     * @return HTMLDomElement
     */
    render: function(){
        throw('You are rendering a base MapControl. It does NOTHING!');
    },
    
    resize: function(){
        return;
    },
    
    show: function(){
        //console.log('show');
        this.domElement.style.display = 'block';
    },
    
    hide: function(){
        //console.log('hide');
        this.domElement.style.display = 'none';
    },
    remove: function(){
        this.domElement.parent.removeChild(this.domElement);
    },
    /**
     * Controls the positioning of the control over the map.
	 * You might need to implement the position function in controls inherited from the base
	 * MapControl.
     */
    position: function(existingControls, allControls){
        
        this.domElement.style.position = 'absolute';
        //this.domElement.style.display = "block";
        
        if (this.options.position) return this.quickPosition(existingControls);
        
        if (this.options.layout) var placement = this.options.layout.bind(this)(this.options.map.width, this.options.map.height, existingControls, allControls);
        
        this.domElement.style.left = placement.left + 'px';        
        this.domElement.style.top = placement.top + 'px';
        
    },
    
    /**
     *
     * @private 
     */
    quickPosition: function(existingControls){
        
        //you give this function a set of controls, positions you care about,
        //a property to check (frm the getPlacement() func) the value you 
        //check against and if it's a > or < check. it will get the 
        //value you need for you like a good function should. 
        function findControlLimit(controls, goodPositions, property, currentValue, bigger){
            //    console.log(controls.length)
            var prop = currentValue;
            for (var i = 0; i < controls.length; i++){
                var c  = controls[i];
                // if(c && c.domElement)
                //     console.log(c.domElement.style.display)
                // if(c.domElement.style.display=="none") {
                //     continue;
                // }
                if (goodPositions.indexOf(c.options.position) != -1){
                    var place = c.getPlacement();
                    
                    if (bigger){
                        if (place[property] > prop) prop = place[property];
                    } else {
                        if (place[property] < prop) prop = place[property];
                    }
                }
            }
            return prop;
        }
        
        switch (this.options.position){
            
            case 'topRight':                
                var right = findControlLimit(existingControls, ['topRight', 'rightTop'], 'left', this.options.map.width, false);
                
                this.domElement.style.left = right - this.width - this.options.marginX + 'px';                
                this.domElement.style.top = this.options.marginY + 'px';
                break;
                
            case 'rightTop':                
                var top = findControlLimit(existingControls, ['topRight', 'rightTop'], 'bottom', 0, true);
                
                this.domElement.style.top = top + this.options.marginY + 'px';
                this.domElement.style.left = this.options.map.width - this.width - this.options.marginX+ 'px';                
            break;
            
            case 'bottomLeft':
                var left = findControlLimit(existingControls, ['bottomLeft', 'leftBottom'], 'right', 0, true);
                
                this.domElement.style.left = left + this.options.marginX + 'px';
                this.domElement.style.top = this.options.map.height - this.height - this.options.marginY + 'px';          
                break;
                
            case 'leftBottom':                
                var top = findControlLimit(existingControls, ['bottomLeft', 'leftBottom'], 'top', this.options.map.height, false);
                
                this.domElement.style.left = this.options.marginX + 'px';                
                this.domElement.style.top = top - this.height -  this.options.marginY + 'px';      
                break;
                
            case 'bottomRight':
                var right = findControlLimit(existingControls, ['bottomRight', 'rightBottom'], 'left', this.options.map.width, false);
                
                this.domElement.style.left = right - this.width - this.options.marginX + 'px';                
                this.domElement.style.top = this.options.map.height - this.height - this.options.marginY + 'px';
                break;
                
            case 'rightBottom':                
                var top = findControlLimit(existingControls, ['bottomRight', 'rightBottom'], 'top',  this.options.map.height, false);
                
                this.domElement.style.top = top - this.height - this.options.marginY + 'px';
                this.domElement.style.left = this.options.map.width - this.width - this.options.marginX + 'px';                
            break;
            //CONTINUE
            case 'topLeft':
            default:
                var left = findControlLimit(existingControls, ['topLeft', 'leftTop'], 'right', 0, true);
                
                this.domElement.style.top = this.options.marginY + 'px';
                this.domElement.style.left = left + this.options.marginX + 'px';
                break;
           case 'leftTop':            
                var top = findControlLimit(existingControls, ['topLeft', 'leftTop'], 'bottom', 0, true);
                
                this.domElement.style.top = top + this.options.marginY + 'px';
                this.domElement.style.left = this.options.marginX + 'px';
                break;
        }
    },

    /**
     * @private
     */
    setOwner: function(map){
        this.options.map = map;
        this.options.map.onresize(this.resize.bind(this));
    },

    /**
	 * @private
	 */
    setZ: function(z){        
        if (this.domElement){            
            this.domElement.style.zIndex = z;
        }
        this.z = z;
    },

    /**
	 * @private
	 */
    toJSON: function(){
        
        var layerObj = {
            marginX: this.options.marginX,
            marginY: this.options.marginY,
            position: this.options.position
        };

        return layerObj;
    },
    
    getPlacement: function(){
        return {
            top: parseFloat(this.domElement.style.top),
            left: parseFloat(this.domElement.style.left),
            width: this.width,
            height: this.height,
            bottom: parseFloat(this.domElement.style.top) + this.height,
            right: parseFloat(this.domElement.style.left) + this.width
        };              
    }


}
/**
 *  @class
 *  A MapLayer represents a tile set that can be displayed on the map.
 *  Tiles are addressed by their North, East and Zoom parameters.
 *  Map layers can be customized by setting a specific tile store to get the
 *  tiles from (a street view tile, a satellite tile, whatever you come up with)
 *
 *  There is no limit, other than performance, to the number of layers that can be
 *  added to a map.
 *
 *  @description A tile set that can be displayed on the map
 *
 *  @constructor
 *  @param {object} options
 *  Each layer is initilized with a set of options.
 *
 *  options:
 *  <pre>
 *  {
 *      tileStore : the tile store that will provide tiles for this layer. defaults to street.
 *      name: the layer's name
 *      visible: visibility attribute for the layer
 *  }
 *  </pre>
 *
 *  @see deCarta.Core.MapOverlay
 */
deCarta.Core.MapLayer = function MapLayer(options){
    
    this.options = {
        canvas: null,
        owner: null,
        name: 'Unnamed Layer',
        id: 'deCarta-layer-' + Math.random().toString().replace('.',''),
        visible: true,
        tileStore: new deCarta.Core.StreetTileStore()
    }
    this.options = deCarta.Utilities.extendObject(this.options, options);    

    this.ready = false;
}

deCarta.Core.MapLayer.prototype = {

    /**
     *  @private. Completes initialization.
     *
     */
    _initialize: function(){
        if (!this.options.canvas || !this.options.owner){
            deCarta.Core.Exception.raise('MapLayer requires a canvas and an owner for instantiation.');
        }
        
        this.visibleTiles = {};

        this.owner = this.options.owner;
        this.canvas = this.options.canvas;
        this.name = this.options.name;
        this.visible = this.options.visible;
        
        this.options.tileStore.setOwner(this.owner);
        this.options.tileStore.startPrecaching();
        //console.log('', this.owner.options.mode)
        /*if (this.owner.options.mode == 'WebGL' && deCarta.Core.WebGLRenderer && THREE){
            this.renderer = new deCarta.Core.WebGLRenderer(this.canvas);
        } else */
        if (this.owner.options.mode == 'canvas' && deCarta.Core.CanvasRenderer){
            this.renderer = new deCarta.Core.CanvasRenderer(this.canvas);
        } else if (deCarta.Core.Configuration.useHardwareAcceleration && deCarta.Window.hasCSSTransforms()){
            this.renderer = new deCarta.Core.CSS3Renderer(this.canvas);
        } else {            
            this.renderer = new deCarta.Core.HTMLRenderer(this.canvas);
        }        

        this.resize();

        this.tileStore = this.options.tileStore;
        this.ready = true;
    },
    
    /**
    * Renders the map.
    * Should not be called directly. Renderings are controlled by the Map object.
    * @param: (deCarta.Core.TileGrid) grid
    */
    render: function(tileGrid){
        
        if (!this.visible) return;               
        
        var renderingQueue = [];
        var tileSet = {};

        var grid = tileGrid.getGrid();
        var gridTiles = grid.tiles;
        
        var time = new Date().getTime();

        for (var x = 0; x < gridTiles.length; x++){
            
            var tile = gridTiles[x];
            
            var tileImg = this.tileStore.getTile(tile.E,tile.N,tile.Z);
            
            if (!tileSet[tileImg.name]){

                var drawEntry = {
                    img : tileImg.img,
                    x: tile.dX + (tileImg.ofsX * tile.size),
                    y: tile.dY + (tileImg.ofsY * tile.size),
                    size: tile.size * tileImg.scale,
                    time: (this.visibleTiles[tileImg.name]) ? this.visibleTiles[tileImg.name] : time,
                    scale: tileImg.scale
                }

                if (!(drawEntry.x >= this.width || drawEntry.y  >= this.height || drawEntry.x + drawEntry.size < 0 || drawEntry.y + drawEntry.size < 0)) {
                    renderingQueue.push(drawEntry);
                }
                tileSet[tileImg.name] = true;                
            }
			
        }
        
        //now merge tileSet to the visibleTiles
        for (var prop in this.visibleTiles){
            if (!tileSet[prop]) delete this.visibleTiles[prop];
        }
        for (var prop in tileSet){
            if (!this.visibleTiles[prop]) this.visibleTiles[prop] = new Date().getTime();
        }

        this.tileStore.purgeLoadRequests(grid.centerTile, grid.zoom, Math.max(grid.width, grid.height));

        renderingQueue.sort(function (a, b){
            return b.size - a.size;
        });

        this.renderer.render(renderingQueue);

    },

    /**
     * @private
     * Registers an owner for this layer.
     * It should be a map. 
     */
    setOwner: function(ownerOpts){
        this.options.owner = ownerOpts.owner;
        this.options.canvas = ownerOpts.canvas;
        this._initialize();
    },

    /**
	 * @private
     * Notifies the layer of a map resize.
     * Should not be called directly. This is handled by the Map object. 
     * @param width (float)
     * @param height (float)
     */
    resize: function(width, height){
                   
        this.width = width;
        this.height = height;

        this.renderer.resize(width, height);
    },

    /**
     * Sets the layer as visible.
     */
    show: function(){
        this.visible = true;
        this.renderer.show();
    },

    /**
     * Hides the layer from view. 
     */
    hide: function(){
        this.visible = false;
        this.renderer.hide();
    },

    toggle: function(){
        
        if (this.visible){
            this.hide();
        } else {
            this.show();
        }
    },
    /**
	 * @private
	 */
    toJSON: function(){
        var layerObj = {
            name: this.options.name,
            visible: this.options.visible,
            tileStore: this.options.tileStore
        };        

        return layerObj;
    }
    
}
/**
 * @class
 * MapOverlays are containers for objects that can be drawn over a map.
 * These include pins, shapes, polylines and so on.
 * You may instantiate several MapOverlays, with different names,
 * to group objects together and have the
 * ability to show or hide sets of objects with a single call.
 * MapOverlays index data internally into tiles, to speed up retreival of the
 * necessary objects for display.
 * A MapOverlay is used to create a container for a set of positioned
 * objects on a map. Objects that can be added to the overlay are:
 * <ul>
 *  <li>Pins {@link deCarta.Core.Pin}</li>
 *  <li>Polylines {@link deCarta.Core.Polyline}</li>
 *  <li>Circles {@link deCarta.Core.Circle}</li>
 *  <li>Images {@link deCarta.Core.Image}</li>
 *  <li>Polygons {@link deCarta.Core.Polygon}</li>
 * </ul>
 * <h3>Clustering</h3>
 * Pins can be set to "clustering" mode. In this mode, when pins are too close to
 * be reliably selected by the user, they will be displayed as a single pin
 * with a number overlay indicating how many pins have been merged in a group.
 * You can specify a callback function that will be invoked when the cluster is
 * clicked. The function will be passed a single parameter (array of Pin objects)
 * containing the pins that belong to the cluster. <br />
 *
 * @description Class for managing a map overlay layer of pins or other graphic features
 *
 * @constructor
 * @param {object} options The options object can contain one or more of the
 * following properties:
 * <ul>
 *  <li>name : The name that will be assigned to the layer - default name is 'Unnamed Layer'</li>
 *  <li>visible: Boolean value to set initial visibility value</li>
 *  <li>clustering: Boolean value, <em>true</em> enables pin clustering</li>
 *  <li>onClusterClick: callback function invoked when a cluster is tapped. </li>
 * </ul>
 */

deCarta.Core.MapOverlay = function(options){


    this.options = {
        canvas: null, //not documented, internal use only
        owner: null, //not documented, internal use only
        name: 'Unnamed Layer',
        visible: true,
        zIndex: 0, //not documented, internal use only
        clustering: false,
        clusteringThreshold: 50, //in pixels
        clusteringOptions:{},
        onClusterClick: function(cluster){}
    }

    this.options = deCarta.Utilities.extendObject(this.options, options);

}

/*
 * Object collection organization
 *
 * Objects in collections are organized somehow.
 * Specifically, they are organized in an objects by zoom structure
 * which has a level of keys for zoom levels, and a second level
 * of keys which reference object handles in a spatial manner.
 *
 * For example :
 *
 * this.objects = [
 *     3: [
 *         'tile key': objectHandle
 *     ]
 * ]
 *
 * Objects that span more than 1 tile will have references in all the spanned 
 * tiles. When rendering, a TileGrid will be passed in and objects in that tile
 * grid will be added to a rendering queue. 
 * After deduplication, each object's renderer will be called and the generated 
 * elements added to the overlay.
 *
 *
 */



/*
 * This has been deprecated.
 * SVG elements:
 *
 * The layer builds an svg container which is the size of the map
 * All elements, when added, are positioned at full zoom.
 *
 * The viewBox attribute is then set to the size of the map at the current zoom level
 * at every zoom. This should make the browser do all the clipping
 * and scaling - generally speaking, all the real work.
 *
 * We'll see if this works.
 *
 * so basically
 *
 * <svg width="WIDTHOFMAPpx" height="HEIGHTOF MAPpx" version="1.1" viewBox="top left width height" at top zoom>
 *
 * IT WORKS.
 * This has been deprecated.
 */
deCarta.Core.MapOverlay.prototype = {

    /**
     * @private
     * Initialization function called when an owner is registered
     */
    _initialize: function(){

        if (!this.options.canvas || !this.options.owner){
            deCarta.Core.Exception.raise('MapOverlay requires a canvas and an owner for instantiation.');
        }
        this.owner = this.options.owner;
        this.canvas = this.options.canvas;
        this.name = this.options.name;

        //main object set
        this.objects = {};

        //object collections
        this.pins = [];
        this.shapes = [];
        this.images = [];
        this.videos = [];
        this.sounds = [];
        this.clusters = [];

        //on screen stuff
        this.visiblePins = {};
        this.visibleShapes = {};
        
        this.visible = this.options.visible;

        this.domElement = deCarta.crEl('div');
        this.domElement.id = 'deCarta-Mob-Ovl-' + Math.floor(Math.random() * 10000);
        this.domElement.style.position = 'absolute';
        this.domElement.style.top = 0;
        this.domElement.style.left = 0;

        this.canvas.appendChild(this.domElement);

        this.width = this.owner.width;
        this.height = this.owner.height;

        this.baseHandle = 0;

        this.lastFullZoom = this.currentZoom = this.owner.zoom;

        //this.updateSvg();

        deCarta.Core.EventManager.listen('zoomEnd', this._setZoom.bind(this), this.owner);
        deCarta.Core.EventManager.listen('zoomChange', this._setZoom.bind(this), this.owner);
        deCarta.Core.EventManager.listen('zoomStart', this._setZoom.bind(this), this.owner);


        //attach events for dispatch
        if (!this.attachedEvents){            
            try {
                this.addListeners(this.domElement);
            } catch (e){
                
            }
            this.attachedEvents = true;
        }
        //deCarta.Core.EventManager.listen('move', this.updateSvg.bind(this));
    },

    /**
     * Adds an {@link deCarta.Core.OverlayObject} to the MapOverlay.
	 * Currently supported OverlayObjects are:
	 * {@link deCarta.Core.Pin}, {@link deCarta.Core.Polyline}, 
	 * {@link deCarta.Core.Circle}, and {@link deCarta.Core.Image}.
	 *
     * @param object: the {@link deCarta.Core.OverlayObject} to add
     * @return object handle
     */
    addObject: function(object){
        
        var type = object.type;

        object.setZIndex(deCarta.Core.Configuration.baseOvlZ + this.options.zIndex);

        var handle = this._genHandle();
        object.handle = handle;
        this.objects[handle] = object;

        switch (type.toLowerCase()){            
            case 'pin':            
                this.indexObject(this.pins, object, handle);
            break;
            case 'image':
            case 'shape':
                this.shapes.push(object);
            break;
            default:
                throw('Adding ' + type + ' to overlay is not yet supported. Also depending on what "' + type + '" is, it might never be');
            break;
        }
        object.registerOwner(this);
        this.owner.render();
        return handle;
    },

    /**
     * @private
     * Adds an object to the spatial index for this overlay.
     * @param index : the index we weant the object in
     * @param object: the object we are adding
     * @param handle: handle to the object.
     */
    indexObject: function(index, object, handle){        
        var nZ = deCarta.Utilities.normalizeZoom( this.currentZoom );

        if (!index[nZ]){
            index[nZ] = {};
        }
        if (this.options.clustering){            
            //check if this fits in a cluster
            //console.log('Clustering object :', object);
            //oh, wow ... Making special special STRONG codes.
            var added = false;
            for (var j = 0; j < this.clusters.length; j ++){
                if (this.clusters[j].addPin(object)){
                    added = true;
                    //console.log('Added to cluster : ', j, this.clusters[j]);
                    break;
                }
            }
            if (!added){
                var clusteringOptions = deCarta.Utilities.extendObject(this.options.clusteringOptions ,{
                    onClick: this.options.onClusterClick,
                    threshold: this.options.clusteringThreshold,
                    zoom: deCarta.Utilities.normalizeZoom(this.currentZoom)
                });
                var cluster = new deCarta.Core.ClusteredPin(clusteringOptions);

                

                cluster.addPin(object);
                this.clusters.push(cluster);
                    
                var tile = cluster.getPosition().getTileAtZoom(nZ);
                var key = deCarta.Utilities.normalizeKey(deCarta.Utilities.getTileKey(tile.E, tile.N, this.currentZoom));
                if (!index[nZ][key]) index[nZ][key] = [];
                
                var handle = this._genHandle();
                cluster.handle = handle;
                this.objects[handle] = cluster;

                index[nZ][key].push(handle);

                // register as the pins owner so it can notify us of any useful
                // thing that happens to it.
                //console.log('Created cluster');
                cluster.registerOwner(this);                
            }

        } else {
        
            var tile = object.getPosition().getTileAtZoom(nZ);

            var key = deCarta.Utilities.normalizeKey(deCarta.Utilities.getTileKey(tile.E, tile.N, this.currentZoom));
            if (!index[nZ][key]) index[nZ][key] = [];
            index[nZ][key].push(handle);

            // register as the pins owner so it can notify us of any useful
            // thing that happens to it.
            object.registerOwner(this);
        }
    },

    /**
     * @private
     * Private method used to rebuild the spatial index when zoom levels change.
     *
     */
    refreshObjects: function(){        
        /*
         * Very crude. Completely rebuilds the indexes - called when a position changes.
         * Considering the main bottleneck here is the rendering of the pins
         * this is not the end of the world, but it would be better to change it
         * into something *smart*.
         */
        this._deleteClusters(); //reset the clusters
        this.pins = [];
        this.shapes = [];
        for (var handle in this.objects){
            var object = this.objects[handle];
            if (object.type == 'pin') {
                this.indexObject(this.pins, object, handle);
            } else {
                this.shapes.push(object);
            }
        }
        
    },

    /**
     * @private
     * Removes an object by handle
     * @param objectHandle Handle to the object.
     * <b>Not currently implemented</b>
     */
    removeObjectHandle: function(objectHandle){
        if (this.objects[objectHandle]) delete this.objects[objectHandle];
    },

    /**
     * Removes an object.
	 * @param {object} object An OverlayObject object to remove from the MapOverlay
	 * @param {bool} dontRefresh Set to <em>true</em> to prevent refresh
     */
    removeObject: function(object, dontRefresh){        

        this.removeObjectHandle(object.handle);
        try {
            if (!dontRefresh){                
                this.refreshObjects();
            }
        } catch (e) {

        }
    },

    /**
     * Set this MapOverlay as visible
     */
    show: function(){
        this.visible = true;
        this.domElement.style.display = 'block';
    },

    /**
     * Set this MapOverlay as hidden
     */
    hide: function(){
        this.visible = false;
        this.domElement.style.display = 'none';
    },

    /**
	 * @private
     * Iterates through elements and figures out which need rendering
     * This should not be called directly, rendering of the overlay objects is 
	 * handled by the map object.
     * @param {deCarta.Core.TileGrid} tileGrid The current tile grid that requires rendering
     */
    render: function(tileGrid){
        
        //if (this.currentZoom != deCarta.Utilities.normalizeZoom(this.currentZoom)) return;

        if (!this.visible) return;    

        //let's try a dom element removal 
        var restore = deCarta.Utilities.removeElementToReinsert(this.domElement);                  

        var grid = tileGrid.getGrid();
        var tiles = grid.tiles;

        var gridX = grid.position.getX(this.currentZoom);
        var gridY = grid.position.getY(this.currentZoom);

        var screenX = gridX - grid.x;
        var screenY = gridY + grid.y;

        //var restore = deCarta.Utilities.removeElementToReinsert(this.domElement);

        //this.domElement.innerHTML = null;

        this.renderShapes(screenX, screenY, tiles);        
        this.renderPins(screenX, screenY, tiles); 

        restore();

    },

    /**
     * @private
     * Renders the various shapes (polylines)
     * shapes are also keyed by tile
     * */
    renderShapes: function(screenX, screenY, tiles){
        //ignore key for now, render all shapes.
        var keepList = {};
        /*this.boundary = new deCarta.Core.MapBoundary();
        this.boundary.setPositions(this.owner.getVisibleRect());*/
        var bb = new deCarta.Core.BoundingBox(this.owner.getVisibleRect());
        //console.log(this.boundary);
        //return this.boundary.checkPosition(pos);
        for (var i = 0; i < this.shapes.length; i++){
            try {
                var obj = this.shapes[i];

                var pos = obj.getPosition();

                var x = pos.getX(this.currentZoom) - screenX;
                var y = screenY - pos.getY(this.currentZoom);
                //clipping...
                if (bb.intersects(this.shapes[i].getBoundingBox())){
                    var elem = this.shapes[i].render(x, y, this.currentZoom, tiles);
                    if (elem) {
                        if (!elem.parentNode){
                            this.visibleShapes[elem.id] = elem;
                            keepList[elem.id] = true;
                            this.domElement.appendChild(elem);
                            // force render
                            this.shapes[i].render(x, y, this.currentZoom, tiles);
                        } else {
                            keepList[elem.id] = true;
                        }
                    }

                }
            }catch(e) {                
                console.log("Error rendering shape : ", obj, e.message);
            }
        }

        //remove old shapes
        for (var shapeId in this.visibleShapes){
            if (!keepList[shapeId]) {
                var shape = this.visibleShapes[shapeId];
                shape.parentNode.removeChild(shape);
                this.visibleShapes[shapeId] = null
                delete this.visibleShapes[shapeId];
            }
        }

    },

    /**
	 * @private
	 */
    renderPins: function(screenX, screenY, tiles){
        var keepList = {};
        var renderList = [];

        for (var i = 0; i < tiles.length; i ++){
            var key = deCarta.Utilities.getTileKey(tiles[i].E, tiles[i].N, tiles[i].Z);
            renderList = renderList.concat(this.renderTilePins(key, screenX, screenY));            
        }


        /* Sort the pins by y, then x*/
        renderList.sort(function(a, b){
            return (parseFloat(a.style.top) - parseFloat(b.style.top));
        });       

        for (i = 0; i < renderList.length; i++){
            if (!renderList[i].parentNode || renderList[i].parentNode.id !== 'undefined'){                
                this.visiblePins[renderList[i].id] = renderList[i];
                keepList[renderList[i].id] = true;
                this.domElement.appendChild(renderList[i]);            
            } else {                
                keepList[renderList[i].id] = true;
                
            }        
        }

        //remove unused
        for (var pinId in this.visiblePins){
            if (!keepList[pinId]) {
                var pin = this.visiblePins[pinId];
                pin.parentNode.removeChild(pin);
                this.visiblePins[pinId] = null
                delete this.visiblePins[pinId];
            }
        }

    },

    /**
     * @private
     * renders all pins that fit on the tile
     */
    renderTilePins: function(key, screenX, screenY){        
        var count = 0;
        var normalizedZoom = deCarta.Utilities.normalizeZoom(this.currentZoom);
        var appendList = [];
        var i = 0;
        
        var originalKey = key;
        key = deCarta.Utilities.normalizeKey(key);        

        if (this.pins[normalizedZoom]){
            if (this.pins[normalizedZoom][key]){
                for (i = 0; i < this.pins[normalizedZoom][key].length; i++){
                    
                    var elemKey = this.pins[normalizedZoom][key][i];
                    var obj = this.objects[elemKey];

                    var pos = obj.getPosition();

                    var x = pos.getX(this.currentZoom) - screenX;
                    var y = screenY - pos.getY(this.currentZoom);

                    var size = obj.getSize();
                    
                    if (x > this.owner.width || y > this.owner.height || x + size.width < 0 || y + size.height < 0) {
                    
                    } else {
                        
                        var elem = obj.render(x, y);                        
                        appendList.push(elem);
                        count ++;
                    }
                    
                }
            }
        }


        return appendList;
    },

    /**
	 * @private
     * Recalculates layer positions and renderings on resize
     * Not to be called directly, the Map object handles this. 
     */
    resize: function(width, height){

        this.width = width;
        this.height = height;

        this.domElement.style.width = width + 'px';
        this.domElement.style.height = height + 'px';
    },

    /**
     * @private
     * Forces a map refresh. called from the objects within. 
     */
    refresh: function(){
        this.owner.render();        
    },

    /**
	 * @private
     * Called by the Map object when the overlay is added to it, so final
     * properties can be set and initialization completed. 
     *
     */
    setOwner: function(ownerOpts){
        this.options.owner = ownerOpts.owner;
        this.options.canvas = ownerOpts.canvas;
        this._initialize();
    },

    /**
     * Clears all OverlayObjects from this MapOverlay
     */
    clear: function(){
        this._clear();
    },

    /**
     * @private 
     * clears the whole layer carefully removing all objects and reclaiming memory
     */
    _clear: function(){
        this.objects = {};
        this.pins = [];
        this.shapes = [];
        this.images = [];
        this.videos = [];
        this.sounds = [];
        this.clusters = [];
    },

    /**
     * @private
     * Generates a unique handle for an object.
     *
     */
    _genHandle: function(){
        return 'dcO_' + this.name.replace(' ', '_') + '_' + (this.baseHandle ++).toString(16);
    },

    _deleteClusters: function(){

        //console.log('Deleting the clusters');

        for (var i = 0; i < this.clusters.length; i++){
            this.objects[this.clusters[i].handle] = null;
            delete this.objects[this.clusters[i].handle];
        }
        this.clusters = [];
    },

    /**
     * @private
     * Changes zoom levels, and switches indexes if necessary. 
     */
    _setZoom: function(ev){
        
        if (ev.object != this.owner) return;
        this.currentZoom  = ev.zoom ;
        var nZ = deCarta.Utilities.normalizeZoom( ev.zoom );
        
        
        if (this.lastFullZoom != nZ){

            //
            // Changing here to use refreshObjects instead of migrate since they do more or less the same thing
            // Also this is more practical for clustering
        
            this.refreshObjects();
            this.lastFullZoom = nZ;
        }


        for (var i = 0; i < this.shapes.length; i++){
            this.shapes[i].setZoom(ev.zoom);
        }        

    },

    /**
	 * @private
	 */
    toJSON: function(){
        var ovlObj = {};

        return ovlObj;
    },



    //Dispatch to children
    touchStart: function(e, oe){
        this.callChildren('touchStart', e, oe);
    },

    touchMove: function(e, oe){     
        this.callChildren('touchMove', e, oe);
        this.callChildren('touchOver', e, oe, 'touchOut');      
    },

    touchEnd: function(e, oe){
        this.callChildren('touchEnd', e, oe);
    },

    touchOut: function(e, oe){          
        this.callChildren('touchOut', e, oe);
    },

    touchOver: function(e, oe){       
    },
        
    doubleTap: function(e, oe){                     
        this.callChildren('doubleTap', e, oe);
    },

    longTouch: function(e, oe){         
        this.callChildren('longTouch', e, oe);
    },

    tap: function(e, oe){   
        this.callChildren('tap', e, oe);
    },

    altTap: function(e, oe){        
        this.callChildren('altTap', e, oe);
    },

    //only dispatch to shapes for now 
    //pins are bad
    callChildren: function(event, e, oe, alternateEvent){
        //console.log('Passing event: ', event, ' to the kidz');
        var mapPosition = deCarta.Utilities.domPosition(this.owner.owner.canvas);
        var x = e.pageX - mapPosition.left;
        var y = e.pageY - mapPosition.top;            
        var eventPosition = this.owner.owner.positionFromXY(x, y);

        for (var i = 0; i < this.shapes.length; i++){
            //console.log(shapeId, this.objects[shapeId]);
            if (this.shapes[i].visible){
                if (this.shapes[i].checkEvent(e, eventPosition)){
                    this.shapes[i][event](e,oe);
                } else if (alternateEvent){                
                    this.shapes[i][alternateEvent](e,oe);
                }
            }
        }
    }


}

deCarta.Core.MapOverlay.prototype = deCarta.Utilities.inherit(deCarta.Core.MapOverlay.prototype, deCarta.Core.EventableObject.prototype);
/**
 * @class The BoundingBox class describes a bounding area. 
 * you may provide as many vertices as you wish to describe this 
 * area. 
 *
 * @param {array of deCarta.Core.Position} vertices of the bounding area
 * @see deCarta.Core.Position
 * @constructor
 */
deCarta.Core.BoundingBox = function(){
    
    var args = Array.prototype.slice.call(arguments);
    if (args.length == 1){
        var points = args[0];
    } else {
        var points = args.slice(0);
    }
    
    this.setPoints(points);
}

deCarta.Core.BoundingBox.prototype = {
    
    /**
    * Top left position of the bounding box.
    */
    topLeftPoint: null,

    /**
    * Bottom right position in the bounding box 
    */
    btmRightPoint: null,
    
    setPoints: function(points){
        
        this.points = [];

        for (var i = 0; i < points.length; i ++){
            
            if ((typeof points[i]).toLowerCase() === 'string'){
                this.points[i] = new deCarta.Core.Position(points[i]);
            } else {
                this.points[i] = points[i];
            }
        }
        
        this.findBounds();
        
        this.points = null; 
    },
    
    /**
     * Returns a {deCarta.Core.Position} with the center of the bounding box
     */
    getCenter: function(){
        var x = (this.topLeftPoint.getX(21) + this.btmRightPoint.getX(21)) / 2;
        var y = (this.topLeftPoint.getY(21) + this.btmRightPoint.getY(21)) / 2;

        var center = new deCarta.Core.Position();
        center.setXY(x, y, 21);

        return center;
    },
    
    /**
     * 
     * Does the bounding box contain this position? 
     * @param {deCarta.Core.Position} position
     */
    contains: function(pos){
        var minX = this.topLeftPoint.getX(21);
        var maxX = this.btmRightPoint.getX(21);
        var maxY = this.topLeftPoint.getY(21);
        var minY = this.btmRightPoint.getY(21);

        var x = pos.getX(21);
        var y = pos.getY(21);

        return (x >= minX && x <= maxX && y >=minY && y <= maxY);
    },
    
    /**
     * 
     * Returns a bounding box which is the intersection of this box and the 
     * one passed as a parameter
     */
    intersects: function(boundingBox){

        var left = this.topLeftPoint.getX(21);
        var right = this.btmRightPoint.getX(21);
        var bottom = this.topLeftPoint.getY(21);
        var top = this.btmRightPoint.getY(21);

        var left1 = boundingBox.topLeftPoint.getX(21);
        var right1 = boundingBox.btmRightPoint.getX(21);
        var bottom1 = boundingBox.topLeftPoint.getY(21);
        var top1 = boundingBox.btmRightPoint.getY(21);

        return !(left1 > right || right1 < left || top1 > bottom || bottom1 < top);
    },

    /**
     * find the right zoom level to fit this bounding box
     * the function needs to know the physical size of the 
     * viewport. You can either pass in the map or the height 
     * and width or even the DOM id for the map.  We will 
     * take care of figuring out the right zoom regardless.
     * getIdealCenterAndZoom(map)
     * getIdealCenterAndZoom(width, height)
     * getIdealCenterAndZoom(domID)
     * getIdealCenterAndZoom({width:w, height: h})
     */
    getIdealCenterAndZoom: function(map){
        //params :
        // - map
        // - width , height
        // - 1 string : dom ID
        // - object {w,h}
        var args = Array.prototype.slice.call(arguments);
        
        var width = 0;
        var height = 0;
        
        if (args.length == 2){
            //are they numberos?
            width = parseFloat(args[0]);
            height = parseFloat(args[1]);
            
        } else if (args.length == 1) {
            
            if (typeof args[0] == 'object'){
                width = args[0].width;
                height = args[0].height;
            } else if (typeof args[0] == 'string'){
                //dom id 
                var e = deCarta.geId(args[0]);
                width = e.offsetWidth;
                height = e.offsetHeight;
            } else {
                deCarta.Core.Exception.raise ('I have no idea what you might be trying to do. BoundingBox.getIdealCenterAndZoom can accept: aString, and Object {width: N, height: N}, a Map, or a DOM id. You are passing something weird.');
            }
            
        } else {
            deCarta.Core.Exception.raise('There are too many arguments in this call to the BoundingBox getIdealGenterAndZoom.')
        }
        
        var res = {
            zoom: null,
            center: null
        };
        //i use the bounds i already have.
        //i suppose. ... .. .. ..
        //i will get the pixel dx and dy for the box
        //then i will go through the zoom levels and get
        //the pixel bounding box for the map at that level
        //compare, find the right one - have zoom
        //if i worked at facebook, i would get my own blog post,
        //and maybe a badge or even a small flag 
        
        for (var z = 20; z > 0; z --){
            
            var x1 = this.topLeftPoint.getX(z);
            var y1 = this.topLeftPoint.getY(z);
            var x2 = this.btmRightPoint.getX(z);
            var y2 = this.btmRightPoint.getY(z);
            
            var dX = Math.abs(x2 - x1);
            var dY = Math.abs(y2 - y1);

            if (dX <= width && dY <= height){
                res.zoom = z; 
                break;
            }
        }
        //then find the center point for the box
        //convert to latlong, have center.
        var x = (this.topLeftPoint.getX(res.zoom) + this.btmRightPoint.getX(res.zoom)) / 2;
        var y = (this.topLeftPoint.getY(res.zoom) + this.btmRightPoint.getY(res.zoom)) / 2;

        var center = new deCarta.Core.Position();
        center.setXY(x, y, res.zoom);
        res.center = center;        
        
        return res;
    },
    
    /**
    * Get the size (in pixels) of the bounding box, for a given zoom
    * @param {float} zoom
    *
    */
    getSize: function(zoom){
        var top = this.topLeftPoint.getY(zoom);
        var left = this.topLeftPoint.getX(zoom);

        var bottom = this.btmRightPoint.getY(zoom);
        var right = this.btmRightPoint.getX(zoom);

        return {width: right - left ,height: top - bottom}
    },
    
    /**
     * @private
     *
     */
    findBounds: function(){

        this.topLeftPoint = null;
        this.btmRightPoint = null;

        var minX = null;
        var minY = null;
        var maxX = null;
        var maxY = null;

        for (var i = 0; i < this.points.length; i++){
            var pt = this.points[i];
            
            var ptX = pt.getX(18);
            var ptY = pt.getY(18);

            if (ptX < minX || !minX) minX = ptX;
            if (ptY < minY || !minY) minY = ptY;

            if (ptX > maxX || !maxX) maxX = ptX;
            if (ptY > maxY || !maxY) maxY = ptY;

            delete pt;
        }

        this.topLeftPoint = new deCarta.Core.Position(0,0);
        this.btmRightPoint = new deCarta.Core.Position(0,0);

        this.topLeftPoint.setXY(minX, maxY, 18);
        this.btmRightPoint.setXY(maxX, minY, 18);
    }    
        
}
/**
 * @class
 * The MapBoundary class defines an absolute boundary for the map {@link deCarta.Core.Map}.
 * As the user scrolls around the map, the map will not display tiles that
 * lie outside of this defined boundary.
 * The boundary is defined as a polygon, with the vertices set as an array of
 * {@link deCarta.Core.Position} objects.
 *
 * @description Object for defining the geographic boundary of the map.
 *
 * @see deCarta.Core.Map
 */

deCarta.Core.MapBoundary = function(){
    
    this.edges = [];    

}

deCarta.Core.MapBoundary.prototype = {

    /**
	 * Sets this MapBoundary's boundaries from a {@link deCarta.Core.Polygon}
	 * @param {deCarta.Core.Polygon} poly The polygon to use for the Map Boundary
	 */
    fromPoly: function(poly){
        this.setPositions(poly.options.vertices);
    },

    /**
	 * Sets the MapBoundary's boundaries to a polygon defined by an array
	 * of {@link deCarta.Core.Position} objects
	 * @param {array} positions An array of {@link deCarta.Core.Position} objects
	 */
    setPositions: function(positions){
        this.edges = [];

        //might as well check
        if (positions.length < 3)
            throw ('I believe you need at least 3 vertices to define a polygon, and a MapBoundary happens to be a polygon.');

        for (var i = 0; i < positions.length; i ++){
            if (positions[i+1]){
                this.edges.push(new deCarta.Core.Edge(positions[i], positions[i+1]));
            } else {
                this.edges.push(new deCarta.Core.Edge(positions[i], positions[0])); //loop around loop around
            }
        }
    },

    /**
	 * @private
	 * Checks a position to see if it is inside the MapBoundary.
	 */
    checkPosition: function(position){

        var sum = 0;

        for (var i = 0; i < this.edges.length; i++){
            var edge = this.edges[i];
            sum += edge.rayIntersect(position);
        }

        return (sum % 2 == 1);
    },

    /**
	 * @private
	 */
    getClosestPosition: function(position){
        //get closest edge
        var minDist = parseFloat('Infinity');
        var p = null;
        
        for (var i = 0; i < this.edges.length; i++){
            var edge = this.edges[i];            
            var res = this.edges[i].pointDistance(position);
            
            if (res.distance < minDist){
                minDist = res.distance;
                p = res.position;
            }
        }

        return p;
    }

}

/**
 * @private
 * The TileGrid class calculates the required tiles to cover an area of the map
 * given the center (a Position) the zoom level (float) and using the current
 * width and height of the map. 
 * The tiles are arranged in an array, ordered by the distance of each tile
 * from the center. 
 * The grid object is used by the Map and passed along to the Layers and Overlays
 * when a rendering is required.
 *
 * @description Class for calculating required tiles
 *
 */
deCarta.Core.TileGrid = function(){

    //the array of tiles
    this.tiles = [];

    this.zoom = 0;

    //width and eight of the grid
    this.width = this.height = 0;

}


deCarta.Core.TileGrid.prototype = {

    /**
     * Prepare a tile grid from the current width, height and the provided zoom and centerpoint.
     * @param {deCarta.Core.Position}center  the position around which we want to center the map
     * @param {float} zoom the current zoom level
     */
    prepare: function (center, zoom){

        this.zoom = zoom;

        var width = this.width;
        var height= this.height;        

        var centerX = Math.round(center.getX(zoom));
        var centerY = Math.round(center.getY(zoom));

        //how big are the tiles at this zoom level
        var tileSize = deCarta.Utilities.tileSizeForZoom(zoom);
        var worldSize = Math.pow(deCarta.Utilities.normalizeZoom(zoom), 2);        

        //N and E of center tile on this grid
        var cE = Math.floor(centerX / tileSize);
        var cN = Math.floor(centerY / tileSize);

        //offset of center in tile
        var ofsX = centerX % tileSize;
        var ofsY = centerY % tileSize;

        /* This is necessary because : 
            - when the map is in the negative, say at -256px 
            - the ofs is correct at 0
            - but the tile is wrong, at Floor(-256 / 256) = -1        
        */
        if (ofsX == 0 && cE < 0){
            cE -=1;
        }
        //not sure why it not happen in N i ask the question the suggestion to the him

        this.centerTile = {
            E: cE,
            N: cN,
            Z: zoom,
            lat: center.getLat(),
            lon: center.getLon()
        } 

        this.xTiles = Math.floor((width + (2 * tileSize)) / tileSize);
        this.yTiles = Math.floor((height + (2 * tileSize)) / tileSize);

        var centerTileGridX = Math.ceil(((width / 2) - ofsX - tileSize) / tileSize);
        var centerTileGridY = Math.ceil(((height / 2) + ofsY- tileSize) / tileSize);

        this.gridX = ((width / 2) - ofsX - tileSize) - (tileSize * centerTileGridX);
        this.gridY = ((height / 2) + ofsY- tileSize) - (tileSize * centerTileGridY);

        this.tiles = [];

        for (var x = 0; x < this.xTiles; x++){
            for (var y = 0; y < this.yTiles; y++){
                
                var tile = {}

                tile.size = tileSize;

                tile.E = (cE - (centerTileGridX - x)) ;
                tile.N = (cN + (centerTileGridY - y)) ;    

                tile.Z = zoom;
                
                if (cN < 0) tile.N += 1;
                if (cE >= 0) tile.E -= 1;

                tile.dX = this.gridX + (tileSize * x);
                tile.dY = this.gridY + (tileSize * y);

                if (y == 0 && x == 0){
                    //get the position for top left corner of grid
                    this.gridPosition = deCarta.Utilities.getTilePosition(tile.E, tile.N, tile.Z);
                }


                this.tiles.push(tile);
            }
        }

        //sort tiles by distance from ctr
        this.tiles.sort(function(a, b){
            var distAfromCtr = Math.sqrt(Math.pow(a.E - cE, 2)  + Math.pow(a.N - cN, 2));
            var distBfromCtr = Math.sqrt(Math.pow(b.E - cE, 2)  + Math.pow(b.N - cN, 2));

            return distAfromCtr - distBfromCtr;
        });

        return;
    },
    
    /**
     * Get all tiles in the grid as an array 
     * @return {object} The files are returned in an object with the
	 * following structure:
	 * <pre>
     * {
     *      <b>tiles</b>: array of tiles
     *      <b>x</b>: x offset of the grid from the top left corner of the map
     *      <b>y</b>: y offest of the grid from the top left corner of the map
     *      <b>position</b>: the grids position
     *      <b>centerTile</b>: the tile on which the center is located
     *      <b>zoom</b>: current zoom
     *      <b>width</b>: width of the grid (in # of tiles)
     *      <b>height</b>: height of the grid. 
     * }</pre>
     */
    getGrid: function(){
        return {
            tiles: this.tiles,
            x: this.gridX,
            y: this.gridY,
            position: this.gridPosition,
            centerTile: this.centerTile,
            zoom: this.zoom,
            width: this.xTiles,
            height: this.yTiles
            };
    },

    /**
	 * @private
     * Called by the map when it is resized.
     * This should not be used directly. 
     * @param {float} width new width
     * @param {float} height new height
     */
    resize: function(width, height){
        this.width = width;
        this.height = height;
    }

}
/**
 * @class
 * The EventManager is a global object which is used to receive / issue
 * notifications regarding the status of the map.
 *
 * Events that are currently supported are : <br />
                <table class="compatibilityTable">
                <tbody>
                    <tr><th>EVENTS</th>         <th>ALISASES</th>               <th>SUPPORTING OBJECTS  </th></tr>
                    <tr><td>click</td>          <td>tap, press</td>             <td> Map, Pin, Shape, Image </td></tr>
                    <tr><td>doubleclick</td>    <td>doubletap, doublepress</td> <td> Map, Pin, Shape, Image </td></tr>
                    <tr><td>rightclick</td>     <td>rightpress, alttap</td>     <td> Map, Pin, Shape, Image </td></tr>
                    <tr><td>longtouch</td>      <td>longclick, longpress</td>   <td> Map, Pin, Shape, Image </td></tr>

                    <tr><td>move</td>           <td></td>                       <td> Map, Pin, Shape, Image </td></tr>
                    <tr><td>moveend</td>        <td></td>                       <td> Map, Pin, Shape, Image </td></tr>
                    <tr><td>movestart</td>      <td></td>                       <td> Map, Pin, Shape, Image </td></tr>

                    <tr><td>resize</td>         <td></td>                       <td> Map </td></tr>
                    <tr><td>zoomchange</td>     <td></td>                       <td> Map </td></tr>
                    <tr><td>zoomend</td>        <td></td>                       <td> Map </td></tr>
                    <tr><td>zoomstart</td>      <td></td>                       <td> Map </td></tr>
                </tbody>
            </table>
 *
 * @description Implements Listen and Trigger methods for event notification.
 */
 
 //TODO : Add triggers to map for the new touch events. Document parameters that events receive from EventManager. 
deCarta.Core.EventManager = {

    /**
     * List of supported events
     */
    events: {
        'zoomstart': [],  //No event generated
        'zoomchange': [],
        'zoomend': [],
        'hoveron': [],
        'hoveroff': [],
        'movestart': [],
        'move': [],
        'moveend': [],
        'click': [],  //No event generated
        'hoveron': [],  
        'hoveroff': [], 
        'doubleclick': [],
        'rightclick': [],
        'resize': [],
        'showpintext': [],
        'hidepintext': [],
        'tileload': [],
        'longtouch': [],
        'viewchange': []
    },
    
    eventNames: {
        'zoomstart': 'zoomstart',
        'zoomchange' : 'zoomchange',
        'zoomend': 'zoomend',
        'movestart': 'movestart',
        'move': 'move',
        'moveend': 'moveend',
        'click': 'click',
        'mouseover': 'hoveron',
        'mouseout': 'hoveroff',
        'hoveron': 'hoveron',
        'hoveroff': 'hoveroff',        
        'tap': 'click',
        'press': 'click',
        'doubleclick': 'doubleclick',
        'doubletap': 'doubleclick',
        'doublepress': 'doubleclick',
        'rightclick': 'rightclick',
        'alttap': 'rightclick',
        'rightpress': 'rightclick',
        'resize': 'resize',
        'showpintext': 'showpintext',
        'hidepintext': 'hidepintext',
        'tileload': 'tileload',
        'longtouch': 'longtouch',
        'longclick': 'longtouch',
        'longpress': 'longtouch',
        'viewchange': 'viewchange'
    },

    /**
     * Registers a callback function with a specific event.
     * @param {string} event: the event you wish to listen for.
     * @param {function} callback: callback function that will be invoked when the event occurs
	 * When defining the callback function, the callback function takes a single deCarta.Core.Event
         * parameter.
         * @returns a handle to the listener , which can be used in the stopListening method.
     * @throw Unsupported event exception.
     */


     
    listen: function(event, callback, obj){
        //de-alias        
        
        event = this.eventNames[event.toLowerCase()];
                
        event = event.toLowerCase();
        var obj = obj;
        var adjustedCallback = function(params, generatingObj){
            
            if (obj && generatingObj) 
                if (obj != generatingObj) return;

            
            /*
            Here we call the callback. If it was installed as an object callback 
            (eg: pin.onclick() or (EventManagr.listen('click', fn, object) )
            we scope it to the obj
            */


            if (!obj) callback(params,generatingObj);
            else callback.call(obj, params, generatingObj);            
            
        }
        
        
        if (this.events[event]){
            for (var i = 0; i < this.events[event].length; i++){
                if (this.events[event][i] == null){
                    this.events[event][i] = adjustedCallback;
                    return i;
                }
            }
            this.events[event].push(adjustedCallback);
            return this.events[event].length - 1;
        } else {
            throw('Event ' + event + ' is not supported');
        }
    },

    /**
     * Triggers an event, executing all callbacks registered for it
     * @param {string} event: the event you wish to trigger.
     * @param {object} params: an object which will be passed to the registered
     * callback with event parameters.
     * @throw Unsupported event exception
     */
     
    trigger: function(event, params, obj){   
        
        event = this.eventNames[event.toLowerCase()];
        params.eventType = event;
        params.object = obj;

        if (!this.events[event]){
            throw('You are trying to trigger the event "' + event + '", but it does not exist.');
        }
        for (var i = 0; i < this.events[event].length; i ++){            
            if (this.events[event][i]){
                this.events[event][i](params, obj);   
            }
        }
    },
    
    stopListeningByIdx: function(event, i){
        event = this.eventNames[event.toLowerCase()];
        this.events[event][i] = null;
    },
       
    /**
     * Removes the listener from the event.
     * @param {string} event: the event name
     * @param {handle} handle: the listener handle returned by "listen"     
     */
    stopListening: function(event, handle){
        return (this.stopListeningByIdx(event, handle));
    }

};
/**
 * @class
 * API Configuration parameters. This static object must be edited to add your credentials (your DDS Key from
 * from the deCarta DevZone) to use the API.
 * 
 * @description API Configuration parameters.
 */

deCarta.Core.Configuration = {
    /** The client name you were provided from the deCarta DevZone 
     *  for API access (String) */
    clientName: null,
    /** The client password you were provided from the deCarta DevZone 
     *  for API access (String) */
    clientPassword: null,
    /** Url for DDS WebServices (String)*/
    url: "http://ws.decarta.com/openls/JSON",
    /** Localizer values */
    language: 'EN',
    /** Localizer values */
    country: 'US',
    /** Projection system, valid values are: EPSG:3857 (Spherical) or EPSG:3395 (ellipsoidal) */
    projection: 'EPSG:3857',//'EPSG:3395', 
    /** Path to image resources */
    imgPath : "img/",
    /** @ignore*/
    metric: false,
    /** This flag can be used for debugging. By setting to <em>true</em>,
     *  all exceptions will be also displayed as alerts.
     */
    vocalExceptions: false,
    /** Base z-index for overlays (int). Use this to control the base css index
     * for any map overlays that are created. */
    baseOvlZ: 100,
    /** Array of tile serving hosts (Array of String) */
    streetTileHosts: ["http://wsdds2-qa.sanjose.telcontar.com","http://wsdds2-qa.sanjose.telcontar.com","http://wsdds2-qa.sanjose.telcontar.com"],
    /** Tile config used for standard resolution devices (String)*/
    defaultConfig: 'global-decarta',
    /** enable traffic display if available */
    showTraffic : false,
    /** Tile config used for high res devices (String)*/

    defaultHighResConfig: 'global-decarta',
    /** Tile Config used in transparent tiles */
    defaultTransparentConfig: 'global-decarta-transparent',
    /** Resource base directory */
    resourceBase: 'resources/',
    /** Image packs to be loaded */
    baseImagePack: 'StdResImages.js',
    /** Hi res image packs to be loaded*/
    baseHiResImagePack: 'HiResImages.js',
    /** Additional Resources (Blocking) */
    additionalImagePacks: {
        hiRes: [],
        loRes: []
    },
    /** Resource timeout, milliseconds */
    resourceTimeout: 20000,
    /** Request timeout, milliseconds */
    requestTimeout: 15000,
    /** Key for digital globe access (String)*/
    digitalGlobeKey: null,
    /** Key for digital globe v3 access (v3, can only be used with spherical) */
    digitalGlobeConnectID: null,
    /** Digital Globe url version. If set to 2, the new url format will be used IF the projection is Spherical*/
    mapitImageryKey: null,
    /** MapIT Imagery key*/
    mapitImageryFromZoomLevel: null,
    /** The zoom level to start displaying the MapIT Imagery*/
    mapitImageryToZoomLevel: null,
    /** The zoom level to stop displaying the MapIT Imagery*/
    DGUrlVersion: 2,
    /** Array of hosts for DigitalGlobe satellite imagery (Array of String)*/
    digitalGlobeHosts: [
            'http://www1.globexplorer.com',
            'http://www2.globexplorer.com',
            'http://www3.globexplorer.com'
        ],
    /** When <em>true</em>, the map will use hardware acceleration, if available */
    useHardwareAcceleration: true,
    /** Build info */
    buildDate: '2013/01/10 16:18',
    /** Version number */
    version: '3.0.6.50',
    /* force  port on the tile urls if server does not return a port in the init call */
    imagePort : 0, /*8080*/
    /* if true, sets the  TILE image URL to 'image-cache', else just 'image'  */
    useCache : true,
    /* DDS dataset which goes into the TILE image URL */
    dataSet : "navteq-world",
    /* apiVersion used if server is in strict mode, else leave it null */
    apiVersion : null,    
    urlVersion: 'auto', //1,auto
    consolelogXML : false,
    /** Use precaching if the tilestore supports it */
    usePrecaching : false
}

deCarta.Core.ZoomFramer = function(options){
    this.map = null;
    this.dom;
    
    this.framing = false;
    this.options = {
        stepsPerScroll : 3, // zoom levels per mouse wheel tick
        min : 20, // min size of cirlce
        max : 120, // max size of cirlce
        borderColor: "#444",
        borderRadius: "100em",
        fillColor: "#999",
        opacity: 20
    }
    this.options = deCarta.Utilities.extendObject(this.options, options);
    
}

deCarta.Core.ZoomFramer.prototype = {
        
    setOwner: function(map){
        this.map = map;
        this.init();
    },
    /**
     * initializer called once from constructor
     */
    init : function(){

        // set up the dom
        this.dom = deCarta.crEl("div");
        this.map.containerElement.appendChild(this.dom);
        this.dom.style.zIndex = 1000;
        this.dom.style.backgroundColor = this.options.fillColor;
        this.dom.style.border = "1px solid "+this.options.borderColor; // hand coded as 1px        
        this.dom.style.borderRadius = this.options.borderRadius;
        this.dom.style.display = "block";
        this.dom.style.position = "absolute";

        deCarta.Utilities.setOpacity(this.dom, this.options.opacity);

        if (!this.map.options.avoidEvents){
            /** DOMMouseScroll is for mozilla. */
            if(this.map.containerElement.addEventListener)
                this.map.containerElement.addEventListener('DOMMouseScroll', this.scrollWheel.bind(this), false);

            /** IE/Opera. */
            this.map.containerElement.onmousewheel = this.scrollWheel.bind(this);
        }
        // set up listners for zoom events

        // zoom start
        this.map.onzoomstart(function(opts){
            if(!this.framing)return;
            this.steps=0;
            var size = (opts.zoom-opts.targetZoom<0) ? this.options.min : this.options.max;
            this.dom.style.height=size+"px";
            this.dom.style.width=size+"px";
            var t = parseFloat(this.dom.style.top);
            var l = parseFloat(this.dom.style.left);
            this.dom.style.top=t-(size/2)+"px";
            this.dom.style.left=l-(size/2)+"px";
            this.dom.style.display="block";

        }.bind(this));

        // zoom change
        this.map.onzoomchange(function(opts){
            if(!this.framing)return;
            this.steps++;
            var d = this.dom;
            var scale = (opts.zoom-opts.targetZoom<0) ? 1.2 : 0.6;
            var h = parseFloat(d.style.height);
            var w = parseFloat(d.style.width);
            var t = parseFloat(d.style.top)-1;
            var l = parseFloat(d.style.left)-1;
            var h1 = h*scale;
            var w1 = w*scale;
            d.style.height=h1+"px";
            d.style.width=w1+"px";
            d.style.top=t+((h-h1)/2)+"px";
            d.style.left=l+((w-w1)/2)+"px";
        }.bind(this));

        // zoom end
        this.map.onzoomend( function(){
            this.framing=false;
            //console.log(this.steps);
            this.dom.style.display="none";
        }.bind(this));

    },

    /**
     * event handler for the scroll wheel
     */
    scrollWheel: function(e){
        this.framing=true;
        e = e ? e : window.event;        
        try{
            if(e.stopPropagation)
                e.stopPropagation();
            if(e.preventDefault)
                e.preventDefault();
            e.cancelBubble = true;
            e.returnValue = false;            
        } catch(e) {}
        var wheelData = e.detail ? e.detail * -1 : e.wheelDelta / 40;
        
        var x = e.clientX - deCarta.Utilities.domPosition(this.map.containerElement).left;//this.map.containerElement.offsetLeft;
        var y = e.clientY - deCarta.Utilities.domPosition(this.map.containerElement).top;//this.map.containerElement.offsetTop;
        
        this.dom.style.top = y + "px";
        this.dom.style.left = x + "px";
        
        this.dom.style.height = "0px";
        this.dom.style.width = "0px";
        
        var fixed = this.map.positionFromXY(x, y);
        if(wheelData > 0)
            this.map.zoomIn(this.options.stepsPerScroll,fixed,true);
        else
            this.map.zoomOut(this.options.stepsPerScroll,fixed,true);

    }
}

/**
*
* @class
* the InfoWindow class is used to display a popup on the map. 
* Each Map object includes an instance of an InfoWindow. A reference to 
* the map's InfoWindow can be obtained by calling
* map.getInfoWindow().
* @see deCarta.Core.Map
*
* Pins automatically manage showing / hiding the infoWindow based on their
* constructor options. 
* @see deCarta.Core.Pin
*
*
* @constructor
* @param {deCarta.Core.Map} map 
*/
deCarta.Core.InfoWindow = function(map){
    this.map = map;
    this.visible = false;
    // Create a few elements
    this.domElement = deCarta.crEl('div');
    this.baseCssName = this.domElement.className = 'deCarta-InfoWindow';
    this.background = deCarta.crEl('div');
    this.background.className = 'deCarta-InfoWindow-Background';
    this.contentWrapper = deCarta.crEl('div');
    this.contentWrapper.className = 'deCarta-InfoWindow-Content-External';
    this.contentElement = deCarta.crEl('div');
    this.contentElement.className = 'deCarta-InfoWindow-Content';
    //add them 
    this.contentWrapper.appendChild(this.contentElement);
    this.domElement.appendChild(this.background);
    this.domElement.appendChild(this.contentWrapper);
    //prevent touch events from going thru the win
    deCarta.Touch.attachListener('touchstart', this.domElement, this.devNull.bind(this), true);
    deCarta.Touch.attachListener('touchend', this.domElement, this.devNull.bind(this), true);
    deCarta.Touch.attachListener('touchstart', this.domElement, this.devNull.bind(this), true);
    //and sroll wheel too
    /** DOMMouseScroll is for mozilla. */
    if(this.domElement.addEventListener)
        this.domElement.addEventListener('DOMMouseScroll', this.scrollWheel.bind(this), false);
    /** IE/Opera. */
    this.domElement.onmousewheel = this.scrollWheel.bind(this);    
}

deCarta.Core.InfoWindow.prototype = {

    onClose: null,

    /**
     * Show the infoWindow. 
     * @param {object} options 
     * The options parameter can contain: 
     * <ul>
     * <li>target: a Pin</li>
     * <li>onClose: a callback function </li>
     * <li>content: the content to display</li>
     * <li>autoReorient: the window will position itself automatically (def: true)</li>
     * </ul>
     */
    show: function(options){
        if (this.visible){
            this.hide();
        }
        if (typeof options.content == "string"){
            this.contentElement.innerHTML = options.content;
        } else {
            this.contentElement.innerHTML = '';
            this.contentElement.appendChild(options.content);
        }
        this.target = options.target;
        this.onClose = options.onClose;
        this.cssClass = options.cssClass;        
        this.autoReorient = (options.autoReorient || true);

        setTimeout(function(){this.position()}.bind(this), 0);
        this.visible = true;
        return this.domElement;
    },

    updateText: function(text){
        if (typeof text == "string"){
            this.contentElement.innerHTML = text;
        } else {
            this.contentElement.innerHTML = '';
            this.contentElement.appendChild(text);
        }

        setTimeout(function(){this.position()}.bind(this), 0);
    },


    /**
     * Hide the infoWindow. 
     * If a callback is registered, it will be invoked. 
     */
    hide: function(){
        this.domElement.style.display = 'none';
        this.visible = false;
        if (this.onClose) this.onClose();
    },


    /**
     * @private private
     * undocumented
     */
    getElement: function(){
        return this.domElement;
    },


    /**
     * @private private
     * undocumented
     */
    position: function(){
        this.domElement.style.display = 'block';

        var bounds = this.target.getBounds();
        var anchorPoints = this.target.getAnchorPositions();

        var mapWidth = this.map.width;
        var mapHeight = this.map.height;

        var width = this.domElement.offsetWidth;  
        var height = this.domElement.offsetHeight; 

        var dockY = 'bottom';
        var dockX = 'center';

        if (this.autoReorient) {
            //dock bottom only if not enough space on top (top and bottom mean the opposite of what you think)
            if (height > bounds.top ) dockY = 'top';
            //left and right, same thing
            if (width / 2 > bounds.left) dockX = 'right';
            else if (width / 2 > (mapWidth - bounds.right)) dockX = 'left';
        }
        //now set position
        var y = (dockY == 'bottom') ? anchorPoints.top - height : anchorPoints.bottom;
        this.domElement.style.top = y + 'px';

        var x = (dockX == 'center') ? (anchorPoints.right + anchorPoints.left - width)  / 2 : 
                (dockX == 'left') ? anchorPoints.right - (width) : anchorPoints.left;
        this.domElement.style.left = x + 'px';
        
        this.domElement.className = 'deCarta-InfoWindow ' + dockY + ' ' + dockX + ' ' + this.cssClass;
        //in case you are wondering about the next 3 lines,
        //aside from the fact that it is surprising that you are reading them
        //the reason for their existance 
        //is that chrome has problems, and this fixes the problems. 
        //the problems have to do with invalidating screen areas
        //this forces a full redraw of the element 
        //otherwise it could be clipped. 
        this.domElement.style.display='none';
        this.domElement.offsetHeight; // no need to store this anywhere, the reference is enough
        this.domElement.style.display='block';
    },

    /**
    * @private private
    * undocumented
    */
    scrollWheel: function(e){
        if (e.stopPropagation) e.stopPropagation();
        else e.cancelBubble = true;        
    },


    /**
    * @private private
    * undocumented
    */
    devNull: function(e,oe){
        deCarta.Touch.stopEvent(e);
    }

}
/* 
 * @private. Implements precaching for tiles. Useful for desktop onlehhh
 */


deCarta.Core.TilePrecacher = function(map, tileStore){
    this.maxRequests = 4;
    this.map = map;
    this.tileStore = tileStore;
    this.grid = new deCarta.Core.TileGrid();
    this.init();
    
}


deCarta.Core.TilePrecacher.prototype = {
    
    init: function(){
        //Start a precache poll
        this.precachePoll();                
    },
    
    precachePoll: function(){
        
        var skip = false;
        for (var p in this.tileStore.loadRequests){
            skip = true;
            break;
        }
        if (skip){
            //console.log('Load requests active, not caching', this.tileStore.loadRequests);            
        } else {
            var rCount = 0;
            this.grid.resize(this.map.width, this.map.height);
            //look at tiles we'd like to have. Load them. New poll for later. 
            //start at zoom level 0. repeat, on centerpoint, for every zoom level. 
            for (var z = 1; z < 21 && rCount < this.maxRequests; z+=5){
                //get a grid on the map center and at this zoom            
                this.grid.prepare(this.map.center, z);
                var grid = this.grid.getGrid();

                for (var i = 0; i < grid.tiles.length; i++){
                    var tile = grid.tiles[i];
                    var key = deCarta.Utilities.getTileKey(tile.E,tile.N,tile.Z);
                    //do we have it? 
                    if (!this.tileStore.availableTiles[key]){
                        this.tileStore.getTile(tile.E,tile.N,tile.Z);
                        rCount ++;
                    }
                }
            }        
        }
        setTimeout(this.precachePoll.bind(this), 500);
    }    
    
}
/** TileStore
 *
 * @class
 * This class provides a base-class for implementing advanced functionality for making
 * your own tile layers for tile storage and retrieval.
 *
 * To create a new TileStore, extend this class overriding the getTileUrl
 * method, providing your own url for the triple x, y, z. (easting, northing and zoom)
 * See {@link deCarta.Core.StreetTileStore} and {@link deCarta.Core.SatelliteTileStore} for examples.
 *
 * @description Base class for tile storage
 *
 * @constructor
 * @param {object] opts Options to be passed to the TileStore. The options will be defined by subclass that is implemented.
 *
 * @see deCarta.Core.StreetTileStore
 * @see deCarta.Core.SatelliteTileStore
 */
deCarta.Core.TileStore = function(opts){
	
    this.opts = {
        baseConfig: 'global-decarta',
        hiResConfig: null,
        precache: false
    }

    this.tileStoreId = 'dCTileStore-' + (Math.random() + "").replace(".", "");

    this.opts = deCarta.Utilities.extendObject(this.opts, opts);   

    this.tileTimeout = 10000;
    this.tileCacheSize = deCarta.Window.isMobile() ? 50 : 200;
    //this.browserCacheTiles = {};
    this.availableTiles = {};
    this.tileCount = 0;
    this.keyStack = [];
    this.loadingTiles = {};
    this.loadRequests = {};
    this.blankTiles = {};

    this.tileTimeouts = [];
    //data uri for blank tile img. 
    //this.blankTile = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAQAAAAEAEAIAAACDgONyAAAACXBIWXMAAAsTAAALEwEAmpwYAAAKT2lDQ1BQaG90b3Nob3AgSUNDIHByb2ZpbGUAAHjanVNnVFPpFj333vRCS4iAlEtvUhUIIFJCi4AUkSYqIQkQSoghodkVUcERRUUEG8igiAOOjoCMFVEsDIoK2AfkIaKOg6OIisr74Xuja9a89+bN/rXXPues852zzwfACAyWSDNRNYAMqUIeEeCDx8TG4eQuQIEKJHAAEAizZCFz/SMBAPh+PDwrIsAHvgABeNMLCADATZvAMByH/w/qQplcAYCEAcB0kThLCIAUAEB6jkKmAEBGAYCdmCZTAKAEAGDLY2LjAFAtAGAnf+bTAICd+Jl7AQBblCEVAaCRACATZYhEAGg7AKzPVopFAFgwABRmS8Q5ANgtADBJV2ZIALC3AMDOEAuyAAgMADBRiIUpAAR7AGDIIyN4AISZABRG8lc88SuuEOcqAAB4mbI8uSQ5RYFbCC1xB1dXLh4ozkkXKxQ2YQJhmkAuwnmZGTKBNA/g88wAAKCRFRHgg/P9eM4Ors7ONo62Dl8t6r8G/yJiYuP+5c+rcEAAAOF0ftH+LC+zGoA7BoBt/qIl7gRoXgugdfeLZrIPQLUAoOnaV/Nw+H48PEWhkLnZ2eXk5NhKxEJbYcpXff5nwl/AV/1s+X48/Pf14L7iJIEyXYFHBPjgwsz0TKUcz5IJhGLc5o9H/LcL//wd0yLESWK5WCoU41EScY5EmozzMqUiiUKSKcUl0v9k4t8s+wM+3zUAsGo+AXuRLahdYwP2SycQWHTA4vcAAPK7b8HUKAgDgGiD4c93/+8//UegJQCAZkmScQAAXkQkLlTKsz/HCAAARKCBKrBBG/TBGCzABhzBBdzBC/xgNoRCJMTCQhBCCmSAHHJgKayCQiiGzbAdKmAv1EAdNMBRaIaTcA4uwlW4Dj1wD/phCJ7BKLyBCQRByAgTYSHaiAFiilgjjggXmYX4IcFIBBKLJCDJiBRRIkuRNUgxUopUIFVIHfI9cgI5h1xGupE7yAAygvyGvEcxlIGyUT3UDLVDuag3GoRGogvQZHQxmo8WoJvQcrQaPYw2oefQq2gP2o8+Q8cwwOgYBzPEbDAuxsNCsTgsCZNjy7EirAyrxhqwVqwDu4n1Y8+xdwQSgUXACTYEd0IgYR5BSFhMWE7YSKggHCQ0EdoJNwkDhFHCJyKTqEu0JroR+cQYYjIxh1hILCPWEo8TLxB7iEPENyQSiUMyJ7mQAkmxpFTSEtJG0m5SI+ksqZs0SBojk8naZGuyBzmULCAryIXkneTD5DPkG+Qh8lsKnWJAcaT4U+IoUspqShnlEOU05QZlmDJBVaOaUt2ooVQRNY9aQq2htlKvUYeoEzR1mjnNgxZJS6WtopXTGmgXaPdpr+h0uhHdlR5Ol9BX0svpR+iX6AP0dwwNhhWDx4hnKBmbGAcYZxl3GK+YTKYZ04sZx1QwNzHrmOeZD5lvVVgqtip8FZHKCpVKlSaVGyovVKmqpqreqgtV81XLVI+pXlN9rkZVM1PjqQnUlqtVqp1Q61MbU2epO6iHqmeob1Q/pH5Z/YkGWcNMw09DpFGgsV/jvMYgC2MZs3gsIWsNq4Z1gTXEJrHN2Xx2KruY/R27iz2qqaE5QzNKM1ezUvOUZj8H45hx+Jx0TgnnKKeX836K3hTvKeIpG6Y0TLkxZVxrqpaXllirSKtRq0frvTau7aedpr1Fu1n7gQ5Bx0onXCdHZ4/OBZ3nU9lT3acKpxZNPTr1ri6qa6UbobtEd79up+6Ynr5egJ5Mb6feeb3n+hx9L/1U/W36p/VHDFgGswwkBtsMzhg8xTVxbzwdL8fb8VFDXcNAQ6VhlWGX4YSRudE8o9VGjUYPjGnGXOMk423GbcajJgYmISZLTepN7ppSTbmmKaY7TDtMx83MzaLN1pk1mz0x1zLnm+eb15vft2BaeFostqi2uGVJsuRaplnutrxuhVo5WaVYVVpds0atna0l1rutu6cRp7lOk06rntZnw7Dxtsm2qbcZsOXYBtuutm22fWFnYhdnt8Wuw+6TvZN9un2N/T0HDYfZDqsdWh1+c7RyFDpWOt6azpzuP33F9JbpL2dYzxDP2DPjthPLKcRpnVOb00dnF2e5c4PziIuJS4LLLpc+Lpsbxt3IveRKdPVxXeF60vWdm7Obwu2o26/uNu5p7ofcn8w0nymeWTNz0MPIQ+BR5dE/C5+VMGvfrH5PQ0+BZ7XnIy9jL5FXrdewt6V3qvdh7xc+9j5yn+M+4zw33jLeWV/MN8C3yLfLT8Nvnl+F30N/I/9k/3r/0QCngCUBZwOJgUGBWwL7+Hp8Ib+OPzrbZfay2e1BjKC5QRVBj4KtguXBrSFoyOyQrSH355jOkc5pDoVQfujW0Adh5mGLw34MJ4WHhVeGP45wiFga0TGXNXfR3ENz30T6RJZE3ptnMU85ry1KNSo+qi5qPNo3ujS6P8YuZlnM1VidWElsSxw5LiquNm5svt/87fOH4p3iC+N7F5gvyF1weaHOwvSFpxapLhIsOpZATIhOOJTwQRAqqBaMJfITdyWOCnnCHcJnIi/RNtGI2ENcKh5O8kgqTXqS7JG8NXkkxTOlLOW5hCepkLxMDUzdmzqeFpp2IG0yPTq9MYOSkZBxQqohTZO2Z+pn5mZ2y6xlhbL+xW6Lty8elQfJa7OQrAVZLQq2QqboVFoo1yoHsmdlV2a/zYnKOZarnivN7cyzytuQN5zvn//tEsIS4ZK2pYZLVy0dWOa9rGo5sjxxedsK4xUFK4ZWBqw8uIq2Km3VT6vtV5eufr0mek1rgV7ByoLBtQFr6wtVCuWFfevc1+1dT1gvWd+1YfqGnRs+FYmKrhTbF5cVf9go3HjlG4dvyr+Z3JS0qavEuWTPZtJm6ebeLZ5bDpaql+aXDm4N2dq0Dd9WtO319kXbL5fNKNu7g7ZDuaO/PLi8ZafJzs07P1SkVPRU+lQ27tLdtWHX+G7R7ht7vPY07NXbW7z3/T7JvttVAVVN1WbVZftJ+7P3P66Jqun4lvttXa1ObXHtxwPSA/0HIw6217nU1R3SPVRSj9Yr60cOxx++/p3vdy0NNg1VjZzG4iNwRHnk6fcJ3/ceDTradox7rOEH0x92HWcdL2pCmvKaRptTmvtbYlu6T8w+0dbq3nr8R9sfD5w0PFl5SvNUyWna6YLTk2fyz4ydlZ19fi753GDborZ752PO32oPb++6EHTh0kX/i+c7vDvOXPK4dPKy2+UTV7hXmq86X23qdOo8/pPTT8e7nLuarrlca7nuer21e2b36RueN87d9L158Rb/1tWeOT3dvfN6b/fF9/XfFt1+cif9zsu72Xcn7q28T7xf9EDtQdlD3YfVP1v+3Njv3H9qwHeg89HcR/cGhYPP/pH1jw9DBY+Zj8uGDYbrnjg+OTniP3L96fynQ89kzyaeF/6i/suuFxYvfvjV69fO0ZjRoZfyl5O/bXyl/erA6xmv28bCxh6+yXgzMV70VvvtwXfcdx3vo98PT+R8IH8o/2j5sfVT0Kf7kxmTk/8EA5jz/GMzLdsAAAAgY0hSTQAAeiUAAICDAAD5/wAAgOkAAHUwAADqYAAAOpgAABdvkl/FRgAABABJREFUeNrt3bsJAkEARVHZhoxMrctABD+gbWmoiVakLYzZXvacYMOXXnYYmOn7p/f5eb0fx7/27du3b3+e+9MKgEUSAAABAEAAABAAAAQAAAEAIB+Az+V1e5zGv+v9Zrc9jH/t27dv3/489/0BADgCAkAAABAAAAQAAAEAQAAAaAbAvVr79u3bX+a+PwAAR0AACAAAAgCAAAAgAAAIAADNALhXa9++ffveAwDAERAAAgCAAAAgAAAIAAACAEAnAO7V2rdv3773AABwBASAAAAgAAAIAAACAIAAANAJgHu19u3bt+89AAAcAQEgAAAIAAACAIAAACAAAHQC4F6tffv27XsPAABHQAAIAAACAIAAACAAAAgAAJ0AuFdr3759+94DAMAREAACAIAAACAAAAgAAAIAQCcA7tXat2/fvvcAAHAEBIAAACAAAAgAAAIAgAAA0AmAe7X27du37z0AABwBASAAAAgAAAIAgAAAIAAAdALgXq19+/btew8AAEdAAAgAAAIAgAAAIAAACAAAnQC4V2vfvn373gMAwBEQAAIAgAAAIAAACAAAAgBAJwDu1dq3b9++9wAAcAQEgAAAIAAACAAAAgCAAADQCYB7tfbt27fvPQAAHAEBIAAACAAAAgCAAAAgAAB0AuBerX379u17DwAAR0AACAAAAgCAAAAgAAAIAACdALhXa9++ffveAwDAERAAAgCAAAAgAAAIAAACAEAnAO7V2rdv3773AABwBASAAAAgAAAIAAACAIAAANAJgHu19u3bt+89AAAcAQEgAAAIAAACAIAAACAAAHQC4F6tffv27XsPAABHQAAIAAACAIAAACAAAAgAAJ0AuFdr3759+94DAMAREAACAIAAACAAAAgAAAIAQCcA7tXat2/fvvcAAHAEBIAAACAAAAgAAAIAgAAA0AmAe7X27du37z0AABwBASAAAAgAAAIAgAAAIAAAdALgXq19+/btew8AAEdAAAgAAAIAgAAAIAAACAAAnQC4V2vfvn373gMAwBEQAAIAgAAAIAAACAAAAgBAJwDu1dq3b9++9wAAcAQEgAAAIAAACAAAAgCAAADQCYB7tfbt27fvPQAAHAEBIAAACAAAAgCAAAAgAAB0AuBerX379u17DwAAR0AACAAAAgCAAAAgAAAIAACdALhXa9++ffveAwDAERAAAgCAAAAgAAAIAAACAEAnAO7V2rdv3773AABwBASAAAAgAAAIAAACAIAAANAJgHu19u3bt+89AAAcAQEgAAAIAAACAIAAACAAAHQC4F6tffv27XsPAABHQAAIAAACAIAAACAAAAgAAJ0AuFdr3759+94DAMAREAACAIAAACAAAAgAAAIAQMYP9H33sLThVJQAAAAASUVORK5CYII=';
    //1px transparent gif. (saves space). We can then do stuff
    this.blankTile = 'data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==';
    this.blankTileImg = new Image();
    this.blankTileImg.src = this.blankTile;    
    
    deCarta.Core.EventManager.listen('zoomEnd', this.zoomEnd.bind(this));
}

deCarta.Core.TileStore.prototype  = {

    /**
	 * @private
	 */
    getKey : function(x,y,z){

        // added to key as uniquifier: config (image setting) and whether or not it is a traffic tile

        return deCarta.Utilities.getTileKey(x,y,z) + '-' + deCarta.Core.Configuration.defaultConfig+ 
        '-TDATA=' + deCarta.Core.Configuration.showTraffic;
    },

    /**
	 * @private
	 */
    getTile: function(x, y, z){       
   
        z = Math.floor(z);

        var key = this.getKey(x,y,z);
        /* This is when the tile is cached as a full dom element. we just pass that*/
        if (this.availableTiles[key] && this.availableTiles[key].img && this.availableTiles[key].img.src) {
            
            return this.availableTiles[key];
        }
        /* This is when the dom element has expired, but we have seen the tile before. 
         * In this case we reconstruct the image ( also add it to the availabletiles)*/
        /*if (this.browserCacheTiles[key]){
            var drawTile = {};
            var img = new Image();
            //img.crossOrigin = "anonymous";
            img.src = this.getTileUrl(x,y,z);             
            
            drawTile.name = key;
            drawTile.img = img;
            drawTile.scale = 1;
            drawTile.ofsX = 0;
            drawTile.ofsY = 0;
            
            this.availableTiles[key] = drawTile;

            return drawTile;                        
        }*/
        
        if (this.loadingTiles[key]) {
            return this.getNextBestTile(x,y,z);
        }
        this.loadingTiles[key] = true;

        var tile = new Image();
        //tile.crossOrigin = "anonymous"; //crashes the map if not in webgl mode, why?
        tile.key = key;        
        tile.tileStoreId = this.tileStoreId;
        tile.timeout = setTimeout(this.purgeRequest.bind(this, key), this.tileTimeout);
        tile.onload = function(t){
            if (this.tileStoreId != t.tileStoreId) {
                return;
            }
            clearTimeout(t.timeout);
            var now = new Date().getTime();
            t.loadTime = now;
            //this.availableTiles[key] = t;
            
            var drawTile = {};
            drawTile.name = key;
            drawTile.img = t;//this.availableTiles[key];
            drawTile.scale = 1;
            drawTile.ofsX = 0;
            drawTile.ofsY = 0;
            
            this.availableTiles[key] = drawTile;
            
            
            this.keyStack.push(key);
            this.tileCount ++;
            delete this.loadingTiles[key];
            delete this.loadRequests[key];
            this.removeBlankTile(key);
            t.onload = null;
            if (this.tileCount > this.tileCacheSize){
                var k = this.keyStack.shift(key);
                //this.browserCacheTiles[k] = true;
                delete this.availableTiles[k];
                this.tileCount --;                
            }	
            deCarta.Core.EventManager.trigger('tileLoad', t);            
//            deCarta.Core.EventManager.trigger('tileLoad', {tileObj : t}, t);
        }.bind(this, tile);
        tile.onerror = function(e){            
            this.purgeRequest(this.key);           
        }.bind(this)
        this.loadRequests[key] = tile;        
        
        tile.src = this.getTileUrl(x,y,z);        
        
        return this.getNextBestTile(x,y,z);
       
    },

    /**
     * @private
     * purges the load queue based on a center and a zoom level
     * basically goes through the load list and purges tiles that are
     * on different zoom or that are far away from the position.
     * radius is IN TILES
     */
    purgeLoadRequests: function(centerTile, zoom, radius){
        
        zoom = deCarta.Utilities.normalizeZoom(zoom);        
        for (var key in this.loadRequests){
            var tInfo = deCarta.Utilities.splitTileKey(key);
            if (tInfo.z != zoom){
                continue;
             /*   console.log('Purging : ' + key + ' since zoom is ' + zoom);
                this.purgeRequest(key);*/
            }
            //now check the distance of the tile
            var d = Math.floor(Math.sqrt(Math.pow(centerTile.E - tInfo.x,2) + Math.pow(centerTile.N - tInfo.y,2)));            
            if (d > (radius / 2) +1){
               // console.log('Purging: ' + key + ' its out of radius. ', d, radius);
                this.purgeRequest(key);
            }
        }
    },

    /**
	 * @private
	 */
    purgeRequest: function(key){        
        if (this.loadRequests[key]) {
            this.loadRequests[key].onload = null;
            this.loadRequests[key].src = null;
            delete this.loadRequests[key];
        }
        if (this.loadingTiles[key]) delete this.loadingTiles[key];        
    },

    /**
	 * @private
	 */
    zoomEnd: function(ev){
        
        this.currentZoom = ev.zoom;
        //return; //this is buggy, fix it then renable it.
        for (var k in this.loadRequests){
            var info = deCarta.Utilities.splitTileKey(k);
            if (info.z != this.currentZoom){
                if (!this.availableTiles[k]){
                    this.purgeRequest(k);
                }
            }
        }
    },

    /**
	 * @private
	 */
    getTileUrl: function(){
        throw('This is a base class. Extend it and override this method. ');
    },

    /**
	 * @private
	 */
    getNextBestTile: function(x,y,z){
        //looks for the tile at a lower zoom level, returns it

        z = Math.round(z);
        for (var i = 1; i < 6; i++){
            var nz = z - i;

            var nx = x / Math.pow(2, i);
            var ny = y / Math.pow(2, i);

            if (nx < 0) nx = Math.floor(nx); else nx = Math.floor(nx);
            if (ny < 0) ny = Math.floor(ny); else ny = Math.floor(ny);

            var tx = nx * Math.pow(2, i);
            var ty = ny * Math.pow(2, i);

            var ox = tx - x;
            var oy = ty - y;

            var key = this.getKey (nx,ny,nz);
         
            if (this.availableTiles[key]) {

                var nTiles = Math.pow(2, i);
                oy = Math.abs(oy) - (nTiles - 1);// - oy;

                var drawTile = {};
                drawTile.name = key;
                drawTile.img = this.availableTiles[key].img;
                drawTile.scale = Math.pow(2, i); //if we went up 2 zoom levels, tile is x4 each side, and so on.
                drawTile.ofsX = ox; //likely wrong.
                drawTile.ofsY = oy;

                return drawTile;
            }
        }

        var key = this.getKey (x,y,z);
        drawTile = {};
        drawTile.name = 'empty_' + key;
        drawTile.img = this.getBlankTile(key);
        drawTile.img.empty = true;
        drawTile.scale = 1;
        drawTile.ofsX = 0;
        drawTile.ofsY = 0;

        return drawTile;
    },

    /**
	 * @private
	 */
    getBlankTile: function(k){
        if (this.blankTiles[k]) return this.blankTiles[k];
        this.blankTiles[k] = this.blankTileImg.cloneNode(true);
        this.blankTiles[k].id = 'empty_' + k;
        this.blankTiles[k].key = 'empty_' + k;
        return this.blankTiles[k];
    },

    /**
	 * @private
	 */
    removeBlankTile: function(k){
        if (this.blankTiles[k]){
            delete this.blankTiles[k];
        }
    },
    
    setOwner: function(owner){
        //console.log('Setting store owner;);');
        this.owner = owner;
    },
    
    startPrecaching: function(){
        //console.log('Starting to precache', this.opts.precache);
        if (!deCarta.Core.Configuration.usePrecaching) return;
        if (!this.opts.precache) return;
        if (!this.precacher){               
            this.precacher = new deCarta.Core.TilePrecacher(this.owner, this);            
        }        
    },

    /**
	 * @private
	 */
    toJSON: function(){
        var obj = {
            opts: this.opts
        }

        return obj;
    }
}
/**
 * @class
 * StreetTileStore extends the base TileStore to provide a standard street
 * map.
 * The getTileUrl method is overridden to generate url that are address tiles
 * by using deCarta WS urls.
 *
 * @description Provides standard street view imagery
 *
 * @constructor
 * @param {object} opts Options (not currently used, for future expansion only)
 */

deCarta.Core.StreetTileStore = function(opt){
    deCarta.Core.TileStore.call(this, opt);
    //a look up table providing the correct LLMAX values per zoom level.
    this._ll_LUT = deCarta.Core.Constants._ll_LUT;
    this.hostIdx = 0;
}

//Define methods to extend StreetTileStore
deCarta.Core.StreetTileStore.prototype = {
	
    /**
	 * @private
     * Overrides the standard getTileUrl to provide deCarta Street Tiles. 
     */
    getTileUrl: function(x,y,z){
        
        var dpr =  deCarta.Window.getDpr(); //(window.devicePixelRatio) ? window.devicePixelRatio : 1;
        //var dpr = 1; //we are now flipping it over and
        // doing dpr in the size of the html elem in hopes of good luck.

        var config = (dpr > 1) ? deCarta.Core.Configuration.defaultHighResConfig : deCarta.Core.Configuration.defaultConfig;

        //console.log('dpr : ', dpr, config, deCarta.Core.Configuration);
        var port = deCarta.Core.Configuration.imagePort ? ":"+deCarta.Core.Configuration.imagePort : "";
        var cache = deCarta.Core.Configuration.imageCache ? "image-cache" : "image";
        var dataSet = deCarta.Core.Configuration.dataSet ? deCarta.Core.Configuration.dataSet : "navteq-world";
        
        if (deCarta.Core.Configuration.urlVersion == 2) {
            var url = deCarta.Core.Configuration.streetTileHosts[this.hostIdx] +port+ '/openls/'+cache+'/TILE' +
                    '/' + x + '/' + y + '/' + z + '?' + 
                    'CLIENTNAME=' + deCarta.Core.Configuration.clientName +
                    '&SESSIONID=' + deCarta.Core.JSRequest.sessionId +
                    '&CONFIG=' + config +
                    '&P=' + deCarta.Core.Configuration.projection;

            return url;
        }
        
        var url = deCarta.Core.Configuration.streetTileHosts[this.hostIdx] +port+ '/openls/'+cache+'/TILE?' +
                   'LLMIN=0.0,0.0' +
                   '&LLMAX=' + this._ll_LUT[deCarta.Core.Configuration.projection][Math.round(z)] +
                   '&CACHEABLE=true' + 
                   '&DS=' + dataSet +
                   '&WIDTH=' + (256 /* * dpr*/) +
                   '&HEIGHT=' + (256 /* * dpr*/) + (deCarta.Core.Configuration.showTraffic ? "&TDATA=true" : "&TDATA=false") + // traffic rendering
                   '&CLIENTNAME=' + deCarta.Core.Configuration.clientName +
                   '&SESSIONID=' + deCarta.Core.JSRequest.sessionId +
                   '&FORMAT=PNG' +
                   '&CONFIG=' + config +
                   '&N=' + y +
                   '&E=' + x + 
                   '&P=' + deCarta.Core.Configuration.projection;
        
        this.hostIdx = (this.hostIdx + 1) % deCarta.Core.Configuration.streetTileHosts.length;

        return url;
	}

}; //end StreetTileStore prototype

//Extend the TileStore with the additional methods for StreetTileStore
deCarta.Core.StreetTileStore.prototype = deCarta.Utilities.inherit(deCarta.Core.StreetTileStore.prototype, deCarta.Core.TileStore.prototype);

/**
 * @class
 * SatelliteTileStore extends the base TileStore to provide a DigitalGlobe satellite imagery. 
 * The getTileUrl method is overridden to generate urls that to DigitalGlobe tiles
 * You need to provide a DigitalGlobe key in the Configuration to use this. 
 *
 * @description Provides DigitalGlobe statellite imagery
 *
 * @constructor
 * @param {object} opts Options (not currently used, for future expansion only)
 */

deCarta.Core.SatelliteTileStore = function(opt){
    
    deCarta.Core.TileStore.call(this, opt);    
    //this.baseUrl = deCarta.Utilities.urlParse("http://www3.globexplorer.com/tiles/decarta?key=2hq3AwyaQsMahDA5vYh1iBTaCMlFojTxLtCuzcIT2Ip7dY5d04VLPJEZvSSQd8u9&LL=37.774053,-122.421398&ZOOM=15&CACHEABLE=true&DS=navteq&WIDTH=256&HEIGHT=256&FORMAT=PNG&CLIENTNAME=map-sample-app&SESSIONID=9809958&CONFIG=transparent-tile&N=1&E=0");
    this.hosts = deCarta.Core.Configuration.digitalGlobeHosts;
    this.hostIdx = 0;
}

//Define methods to extend SatelliteTileStore
deCarta.Core.SatelliteTileStore.prototype = {
	

    getKey : function(x,y,z){
        //console.log(deCarta.Utilities.getTileKey(x,y,z) + deCarta.Core.Configuration.defaultConfig, this);
        return deCarta.Utilities.getTileKey(x,y,z) + '-DG-' + deCarta.Core.Configuration.DGUrlVersion;
    },  
    /**
	 * @private
     * Overridden getTileUrl function
     */
    getTileUrl: function(x, y, z){

        /* get a fixed url LL and go from there, for example, let's use greenwich!*/

        //var dpr =  (window.devicePixelRatio) ? window.devicePixelRatio : 1;
        var dpr = 1; //unused remove me

        var pos = deCarta.Utilities.getTilePosition(x, y, z);

        var lat = pos.getLat() % 180;
        var lon = pos.getLon() % 360;

        if (lon < -180) lon = 360 + lon;
        
        if (lon > 180) lon = lon - 360;
        
        if (deCarta.Core.Configuration.DGUrlVersion == 2 && (deCarta.Core.Configuration.projection == 'EPSG:3857')) {
            if (deCarta.Core.Configuration.mapitImageryKey && z >= deCarta.Core.Configuration.mapitImageryFromZoomLevel && z <= deCarta.Core.Configuration.mapitImageryToZoomLevel) {
                var params = 'key=' + deCarta.Core.Configuration.mapitImageryKey +
                               '&LAYERS=sm.imagery' +
                               '&STYLES=' +
                               '&BGCOLOR=0xFFFFFF' +
                               '&FORMAT=image/jpg' +
                               '&SERVICE=WMS' +
                               '&TRANSPARENT=TRUE' +
                               '&VERSION=1.1.1' +
                               '&REQUEST=GetMap' +
                               '&SRS=EPSG:3857' +
                               '&WIDTH=' + (256 /* * dpr*/) +
                               '&HEIGHT=' + (256 /* * dpr*/);
                var l = "http://www.streetmaps.co.za/WMS/?" + params;
                var url = l + '&BBOX=' + deCarta.Utilities.calcMercator_BBOX(x, y, z);
                l = url;
                return l;
            }
            else if (deCarta.Core.Configuration.digitalGlobeConnectID) {
                var bound = Math.pow(2, z);

                y++;
                x = (x + (bound / 2)) % bound;
                y = (-y + (bound / 2)) % bound;
                if (x < 0) x = bound + x;
                if (y < 0) y = bound + y;


                var url = 'https://services.digitalglobe.com/earthservice/wmtsaccess?' +
                          'CONNECTID=' + deCarta.Core.Configuration.digitalGlobeConnectID +
                          '&Service=WMTS' +
                          '&REQUEST=GetTile' +
                          '&Version=1.0.0' +
                          '&Layer=DigitalGlobe:ImageryTileService' +
                          '&TileMatrixSet=' + deCarta.Core.Configuration.projection +
                          '&TileMatrix=' + deCarta.Core.Configuration.projection + ':' + z +
                          '&Format=image/jpeg' +
                          '&TileRow=' + y +
                          '&TileCol=' + x;

                return url;
            }
        }


        var url = this.hosts[this.hostIdx] + '/tiles/decarta' +
                  '?key=' + deCarta.Core.Configuration.digitalGlobeKey +
                  '&LL=' + lat + ',' + lon  +
                  '&ZOOM=' + z + 
                  '&CACHEABLE=true' +
                  '&DS=' + 'navteq' +
                  '&WIDTH=' + 256 +
                  '&HEIGHT=' + 256 +
                  '&FORMAT=PNG' +
                  '&CLIENTNAME=' + deCarta.Core.Configuration.clientName +
                  '&SESSIONID=9809958' +
                  '&CONFIG=transparent-tile' + 
                  '&N=0' +
                  '&E=0'

        return url;
		//return deCarta.Utilities.urlCompose(this.baseUrl);
	}

}; //end SatelliteTileStore prototype

//Extend the TileStore with the additional methods for SatelliteTileStore
deCarta.Core.SatelliteTileStore.prototype = deCarta.Utilities.inherit(deCarta.Core.SatelliteTileStore.prototype, deCarta.Core.TileStore.prototype);

/**
 * @class
 * StreetTileStore extends the base TileStore to provide a standard street
 * map.
 * The getTileUrl method is overridden to generate url that are address tiles
 * by using deCarta WS urls.
 *
 * @description Provides standard street view imagery
 *
 * @constructor
 * @param {object} opts Options (not currently used, for future expansion only)
 */

deCarta.Core.TransparentTileStore = function(opt){
    deCarta.Core.TileStore.call(this, opt);
    //a look up table providing the correct LLMAX values per zoom level.
    this._ll_LUT = deCarta.Core.Constants._ll_LUT;
    this.hostIdx = 0;
}

//Define methods to extend TransparentTileStore
deCarta.Core.TransparentTileStore.prototype = {
	

    getKey : function(x,y,z){
        //console.log(deCarta.Utilities.getTileKey(x,y,z) + deCarta.Core.Configuration.defaultConfig, this);
        return deCarta.Utilities.getTileKey(x,y,z) + '-' + deCarta.Core.Configuration.defaultTransparentConfig;
    },

    /**
	 * @private
     * Overrides the standard getTileUrl to provide deCarta Street Tiles. 
     */
    getTileUrl: function(x,y,z){
        
        var dpr =  deCarta.Window.getDpr(); //(window.devicePixelRatio) ? window.devicePixelRatio : 1;
        //var dpr = 1; //we are now flipping it over and
        // doing dpr in the size of the html elem in hopes of good luck.

        var config = deCarta.Core.Configuration.defaultTransparentConfig;

        //console.log('dpr : ', dpr, config, deCarta.Core.Configuration);
        var port = deCarta.Core.Configuration.imagePort ? ":"+deCarta.Core.Configuration.imagePort : "";
        var cache = deCarta.Core.Configuration.imageCache ? "image-cache" : "image";
        var dataSet = deCarta.Core.Configuration.dataSet ? deCarta.Core.Configuration.dataSet : "navteq-world";
        
        if (deCarta.Core.Configuration.urlVersion == 2) {
            var url = deCarta.Core.Configuration.streetTileHosts[this.hostIdx] +port+ '/openls/'+cache+'/TILE' +
                    '/' + x + '/' + y + '/' + z + '?' + 
                    'CLIENTNAME=' + deCarta.Core.Configuration.clientName +
                    '&SESSIONID=' + deCarta.Core.JSRequest.sessionId + 'T' +
                    '&CONFIG=' + config +
                    '&P=' + deCarta.Core.Configuration.projection;

            return url;
        }
        
        var url = deCarta.Core.Configuration.streetTileHosts[this.hostIdx] +port+ '/openls/'+cache+'/TILE?' +
                   'LLMIN=0.0,0.0' +
                   '&LLMAX=' + this._ll_LUT[deCarta.Core.Configuration.projection][Math.round(z)] +
                   '&CACHEABLE=true' + 
                   '&DS=' + dataSet +
                   '&WIDTH=' + (256 /* * dpr*/) +
                   '&HEIGHT=' + (256 /* * dpr*/) +
                   '&CLIENTNAME=' + deCarta.Core.Configuration.clientName +
                   '&SESSIONID=' + deCarta.Core.JSRequest.sessionId +
                   '&FORMAT=PNG' +
                   '&CONFIG=' + config +
                   '&N=' + y +
                   '&E=' + x + 
                   '&P=' + deCarta.Core.Configuration.projection;
        
        this.hostIdx = (this.hostIdx + 1) % deCarta.Core.Configuration.streetTileHosts.length;

        return url;
	}

}; //end TransparentTileStore prototype

//Extend the TileStore with the additional methods for TransparentTileStore
deCarta.Core.TransparentTileStore.prototype = deCarta.Utilities.inherit(deCarta.Core.TransparentTileStore.prototype, deCarta.Core.TileStore.prototype);

/**
 * @class
 * OverlayObject is a base class that can be extended to create objects
 * suitable for display on a {@link deCarta.Core.MapOverlay}.
 * Pins {@link deCarta.Core.Pin}, Polylines {@link deCarta.Core.Polyline},
 * Circles {@link deCarta.Core.Circle}, Images {@link deCarta.Core.Image}, Polygons {@link deCarta.Core.Polygon} all extend this class.
 *
 * @description Base class for Map Overlay Objects
 *
 * @constructor
 * @param {options} opts Options are to be defined by the subclass.
 *
 * @see deCarta.Core.MapOverlay
 * @see deCarta.Core.Pin
 * @see deCarta.Core.Polyline
 * @see deCarta.Core.Circle
 * @see deCarta.Core.Image
 * @see deCarta.Core.Polygon
 */

deCarta.Core.OverlayObject = function(opts){
    
    deCarta.Core.EventableObject.call(this, opts);

    this.useCSSTransforms = (deCarta.Core.Configuration.useHardwareAcceleration && deCarta.Window.hasCSSTransforms());
    this.renderingMode = 'none';

    this.zIndex = 100;
    
    var doc = document;
    // create xmlns
    
    if (deCarta.Window.hasSVG() && !deCarta.Window.isFirefox()){ //firefox is teh suck with SVG
        this.renderingMode = 'SVG';
    } else if (deCarta.Window.hasCanvas()){ //so canvas is our second choice
        this.renderingMode = 'canvas';
    } else if (deCarta.Window.hasVML()){ //and lastly, it will be VML woho
        this.renderingMode = 'VML';
    } 

    if (this.renderingMode == 'VML' && doc.namespaces){
        if (!doc.namespaces['v']) {
            doc.namespaces.add('v', 'urn:schemas-microsoft-com:vml', "#default#VML");
        }

        if (!doc.styleSheets['deCarta_VML_Shapes']) {
            var ss = doc.createStyleSheet();
            ss.owningElement.id = 'deCarta_VML_Shapes';
            ss.cssText = 'v\\: * { behavior:url(#default#VML); display:inline-block }' 
        }
    }
}


deCarta.Core.OverlayObject.prototype = {

    /**
     * Returns the object's position
     * @return deCarta.Core.Position
     */
    getPosition: function(){
        return this.options.position;
    },

    /**
     * Sets the css z-index of this overlay object. This allows the user to place
     * page elements above or below this overlay.
     * @param {int} z The css z-index
     */
    setZIndex: function(z){
        this.zIndex = z;
    },

    /**
     * Returns the size of the pin
     * @return object <pre>{width: int, height: int}</pre>
     */
    getSize: function(z){
        if (this.boundingBox) return this.boundingBox.getSize(z);
        if (!this.domElement) return {width: 0, height: 0};        
        return {width: parseFloat(this.domElement.style.width), height: parseFloat(this.domElement.style.height)};
    },
    
    getIdealCenterAndZoom: function(map){
        if (!this.boundingBox) deCarta.Core.Exception.raise('No bounding box!');
        return this.boundingBox.getIdealCenterAndZoom(map);
    },

    getBoundingBox: function(){
        if (!this.boundingBox) deCarta.Core.Exception.raise('No bounding box!');
        return this.boundingBox;
    },

    /**
     * Changes the position of the object. If the OverlayObject (or Pin)
	 * is registered with an overlay
     * it will also take care of having the MapOverlay update its spatial
     * indexes
     * @param {deCarta.Core.Position} position The new position.
     */
    setPosition: function(position){
        this.options.position = new deCarta.Core.Position(position.lat, position.lon);
        if (this.setBB) this.setBB();
        if (this.owner && this.owner.refreshObjects) this.owner.refreshObjects();
        if(this.owner && this.owner.owner) this.owner.owner.render();
    },

    /**
     * Called by the subclass. Takes the domElement and positions it
     * either with regular css or css3 transforms based on the settings.
     */
    domPosition: function(x, y, element){   
        this.domX = x;
        this.domY = y;
        if (!element) element = this.domElement;
        x = Math.floor(x);
        y = Math.floor(y);

        if (!this.useCSSTransforms){
            element.style.top = y  + 'px';
            element.style.left = x  + 'px';
        } else {
            element.style.top = '0px';
            element.style.left = '0px';
            element.style.webkitTransformOrigin = " 0 0 ";
            element.style.MozTransformOrigin = " 0 0 ";
            element.style.OTransformOrigin = " 0 0 ";            
            element.style.msTransformOrigin = " 0 0 ";         
            element.style.TransformOrigin = " 0 0 ";
            element.style.webkitTransform = "translate3d("+x+"px, "+y+"px, 0)";
            element.style.msTransform = "translate3d("+x+"px, "+y+"px, 0)";
            element.style.MozTransform = "translate3d("+x+"px, "+y+"px, 0)";
            element.style.OTransform = "translate3d("+x+"px, "+y+"px, 0)";
            element.style.Transform = "translate3d("+x+"px, "+y+"px, 0)";
        }
    },
    
    /**
     * Called by the containing MapOverlay when a pin is added to it
     * Allows the overlay to be notified when a pin's position is changed
     * so it can rebuild its indexes.
     */
    registerOwner: function(owner){
        this.owner = owner;
    },

    /**
	 * @private
	 */
    setZoom: function(z){
        
    },

    /**
	 * Makes this OverlayObject visible
	 */
    show: function(){
        this.visible = true;
        this.owner.refresh();
    },

    /**
	 * Makes this OverlayObject hidden
	 */
    hide: function(){
        this.visible = false;
        this.owner.refresh();
    },  

    /**
     * Toggles the visible state of the shape
     */
    toggle: function(){
        this.visible = !this.visible;
        this.owner.refresh();
    },

    /**
     * @private 
     */
    touchStart: function(ev, oe){

        if (this.options.opaque){            
            deCarta.Touch.stopEvent(oe);
        }

        if (!this.options.draggable) return;
        this.dragging = true;        
        this.dragged = false;

        this.startDragX = ev.screenX;
        this.startDragY = ev.screenY;
        
        if (this.options.onDrag) this.options.onDrag.call(this, this.getCenter());
        var eventPosition = this.owner.owner.positionFromXY(ev.pageX, ev.pageY);        
        deCarta.Touch.stopEvent(oe);
    },
    
    /**
     * @private 
     */
    touchEnd: function(ev, oe){

        if (this.options.opaque){            
            deCarta.Touch.stopEvent(oe);
        }

        if (!this.options.draggable) return;
        if (!this.dragging) return;

        this.dragging = false;
        if (this.options.onDrop) this.options.onDrop.call(this, this.getCenter());
        var eventPosition = this.owner.owner.positionFromXY(ev.screenX, ev.screenY);
        
        if (this.dragged)
            deCarta.Core.EventManager.trigger('moveend',{object: this, event: ev, originalEvent: oe, eventPosition: eventPosition}, this);        
        
        deCarta.Touch.stopEvent(oe);
    },
    
    /**
     * @private 
     */
    touchMove: function(ev, oe){

        
        if (!this.dragging) return;
        if (!this.dragged) {
            deCarta.Core.EventManager.trigger('movestart',{object: this, event: ev, originalEvent: oe, eventPosition: eventPosition}, this);
            this.dragged = true;
        }
        
        var deltaX = ev.screenX - this.startDragX;
        var deltaY = ev.screenY - this.startDragY;

        this.startDragX = ev.screenX;
        this.startDragY = ev.screenY;        

        
        var posPx = this.getPosition().getPixelPoint(this.owner.owner.zoom)
        //find new position 

        posPx.x += deltaX;
        posPx.y -= deltaY;
        var p = new deCarta.Core.Position(0,0);
        p.setXY(posPx.x, posPx.y, this.owner.owner.zoom);

        this.setPosition(p);
        this.owner.owner.render();
        //this.startDragPos = this.getPosition();
        var eventPosition = this.owner.owner.positionFromXY(ev.pageX, ev.pageY);
        deCarta.Core.EventManager.trigger('move',{object: this, event: ev, originalEvent: oe, eventPosition: eventPosition}, this);                    
        deCarta.Touch.stopEvent(oe);
        
    }
}

deCarta.Core.OverlayObject.prototype = deCarta.Utilities.inherit(deCarta.Core.OverlayObject.prototype, deCarta.Core.EventableObject.prototype);
/**
 * @class
 * A Pin is used to graphically represent a position on the map.
 * It can have a custom image, and when clicked it can display some sort of custom text.
 * Add the pin to a map overlay using the {@link deCarta.Core.MapOverlay}:addObject()
 * method.
 * Pin extends {@link deCarta.Core.OverlayObject}.
 * 
 * @description An OverlayObject used to display a pin on a MapOverlay
 *
 * @constructor
 * @param options Options. May contain one or more of the following:
 * <ul>
 *  <li>(string) text: text diplayed on the pin info window - optional, default=''</li>
 *  <li>{HTMLDOMElement} textElement: if this option is set, this will be an element that overrides the standard pin label</li>
 *  <li>{@link deCarta.Core.Position} position: the geographic position at which to place the pin, required</li>
 *  <li>(HTMLDOMElement) image: a DOM image element representing the pin</li>
 *  <li>(string) imageSrc: a string containing either the URI to an image or a base64 representation of the image</li>
 *  <li>(int) xOffset: Number of pixels to shift the pin to the left (set to half of the image width to center the image over the position on the map), optional, default=0</li>
 *  <li>(int) yOffset: Number of pixels to shift the pin up (set to the full height of the image to place the image above the position on the map), optional, default=0</li>
 *  <li>(function) onClick: a callback function that will be notified if the pin is clicked</li>
 *  <li>(function) onLabelClick: a callback that will be notified if the label is clicked</li>
 *  <li>(boolean) textVisible: Controls visibility of pin text. Default=false
 *      (click pin to toggle to true)</li>
 *  <li>(boolean) opaque: events will stop at the pin, and not propagate down to the map</li>
 * </ul>
 *
 * @see deCarta.Core.OverlayObject
 * @see deCarta.Core.MapOverlay
 */

deCarta.Core.Pin = function(opts){
    deCarta.Core.OverlayObject.call(this, opts);

    /* Default option set b
     */
    this.options = {
        text: '',
        //textElement: null,
        position: null,
        image: null,
        imageSrc: null,
        xOffset: 0,
        yOffset: 0,
        onClick: null,
        onLabelClick: null,
        onShowText: null,
        onHideText: null,
        cssClass: '',
        label: '',
        opaque: false,
        infoWinOptions:{
            autoReorient: true
        }
    }

    this.zIndex = 1;

    /* This is because ExtendObject only goes ONE LEVEL DEEP */
    if (opts.defaultPinOptions){
        this.options.defaultPinOptions = deCarta.Utilities.extendObject(this.options.defaultPinOptions, opts.defaultPinOptions);
        delete opts.defaultPinOptions;
    }
    if (opts.infoWinOptions){
        this.options.infoWinOptions = deCarta.Utilities.extendObject(this.options.infoWinOptions, opts.infoWinOptions);
        delete opts.infoWinOptions;
    } 

    this.options = deCarta.Utilities.extendObject(this.options, opts);

    this.type = 'pin';
    
    this.domElement = null; 

    this.textEnabled = true;

    this.visible = true;
}

//Define methods to extend Pin
deCarta.Core.Pin.prototype = {

    /**
     * Sets the image element that will be used for the pin
     * @param {Image} image the image
     * @param {int} xOffset Number of pixels to shift the image to the left of the pin position (use half the image width to center on position) (Optional, default=0)
     * @param {int} yOffset Number of pixels to shift the image upward (use the full image height to place image above position) (Optional, default=0)
     */
    setImage: function(image, xOffset, yOffset){
        this.options.image = image;
        if (xOffset) this.options.xOffset = xOffset;
        if (yOffset) this.options.yOffset = yOffset;
        if (this.domElement)
            this._render(parseFloat(this.domElement.style.left), parseFloat(this.domElement.style.top), true );
    },

    /**
     * Sets a src value for the pin's image
     * @param {HTMLDOMElement} imageSrc Source of the image (you can use imageSrc to convert from a URI or base64 string)
     * @param {int} xOffset The NEW Number of pixels to shift the image to the left of the pin position (use half the image width to center on position) (Optional, default=0)
     * @param {int} yOffset The NEW Number of pixels to shift the image upward (use the full image height to place image above position) (Optional, default=0)
     */
    setImageSrc: function(imageSrc, xOffset, yOffset){
        this.options.imageSrc = imageSrc;
        if (xOffset) this.options.xOffset = xOffset;
        if (yOffset) this.options.yOffset = yOffset;
        if (this.domElement)
            this._render(parseFloat(this.domElement.style.left), parseFloat(this.domElement.style.top), true );
    },

    /**
     * Returns the current image for the pin
     * @return {HTMLDOMElement} The HTML DOM Element of the image for the pin
     */
    getImage: function(){

        return (this.options.image || this.options.imageSrc);
    },

    /** Sets the text to be displayed above the pin (when the pin is selected)
     * @param {string} text String to associate with pin
     */
    setText: function(text){
        this.options.text = text;
        //this._render();
    },
    
    /** Sets the rotation angle of the pin
     * @param {float} angle Angle to rotate the pin, counter-clockwise
     */
    setRotation: function(angle){
                
        this.pinImage.style.MozTransform = 'rotate(-'+Math.round(angle)+'deg)';
        this.pinImage.style.webkitTransform = 'rotate(-'+Math.round(angle)+'deg)';
        this.pinImage.style.WebkitTransform = 'rotate(-'+Math.round(angle)+'deg)';
        this.pinImage.style.oTransform = 'rotate(-'+Math.round(angle)+'deg)';
        this.pinImage.style.OTransform = 'rotate(-'+Math.round(angle)+'deg)';        
    },

    hide: function(){
        if (this.domElement)
            this.domElement.style.display = 'none';

        this.visible = false;
    },

    show: function(){
        if (this.domElement)
            this.domElement.style.display = 'block';

        this.visible = true;
    },
    /**
     * @private
     * Generates the necessary dom elements.
     * Returns the main element to the caller for insertion in the DOM.
     * @return HTMLDomElement
     */
    render: function(x, y){
        
        if (!this.domElement) this.domElement = this._render();
        this.domPosition(x, y);

        if(this.textVisible)
            this.showText();

        return this.domElement;
    },

    /**
     * @private
     * Actual internal rendering. This *really* creates the elements. 
     */
    _render: function(x, y, skipListeners){        
        if (typeof skipListeners === 'undefined') skipListeners = false;
        //get the x and y
        
        //create main element
        if (!this.domElement){
            this.domElement = deCarta.crEl('div');
            this.domElement.style.position = 'absolute';
            this.domElement.className = 'deCarta-Pin ' + this.options.cssClass;
            this.domElement.style.zIndex = this.zIndex;
            this.domElement.pin = this;
            this.domElement.id = ("deCarta-pin-" + Math.random()).replace(".", "");
        }

        
        //create the image        
        if (this.options.imageSrc){
            if (this.pinImage) {
                deCarta.Utilities.domRemove(this.pinImage);
                delete this.pinImage;
            }
            
            this.pinImage = new Image();
            this.pinImage.style.display = 'none';
            this.pinImage.onload = function(){
                this.style.display = 'block'
                if(!this.style.height)this.style.height=this.height+"px";
                if(!this.style.width)this.style.width=this.width+"px";

            };
            
            this.pinImage.style.top = '-' + this.options.yOffset + 'px';
            this.pinImage.style.left = '-' + this.options.xOffset + 'px';

            this.pinImage.src = this.options.imageSrc;

        } else {
            if (this.options.image){                
                this.pinImage = this.options.image;
                this.pinImage.style.top = '-' + this.options.yOffset + 'px';
                this.pinImage.style.left = '-' + this.options.xOffset + 'px';                    
            } else {
                var div = deCarta.crEl("div"); 
                this.domElement.className="";
                div.className = 'deCarta-Pin-Default ' + this.options.cssClass;

                div.innerHTML = this.options.label;
                this.pinImage = div;
            }
        }       
        
        this.pinImage.style.position = 'absolute';

        if (!skipListeners){            
            this.addListeners(this.domElement/*, true*/); //WHY was this opaque? Is there a good reason?
        }

        //put image in main element,        
        this.domElement.appendChild(this.pinImage);

        deCarta.Core.EventManager.listen('moveend', function(){            
            if (this.textVisible 
                && this.owner.owner.infoWindow.domElement.style.display!='none') {
                this.owner.owner.infoWindow.position();
            }
        }.bind(this), this.owner.owner)
        if (!this.visible) this.hide();
        return this.domElement;    
    },

    tap: function(e, oe){
        
        this.triggerEvent('click', e, oe);

        if (this.options.text){ // only open window if there is something to show                        
            if (this.textVisible){                            
                this.hideText();
            } else {                            
                this.showText();
            }
        }
    },

    /**
     * Returns the bounding coordinates for the pin (in map pixel coords)
     **/
    getBounds: function(){
        var top = this.domY;
        var left = this.domX;

        var styleTop = parseFloat(deCarta.Utilities.getStyle(this.pinImage, 'top')) || 0;
        var styleLeft = parseFloat(deCarta.Utilities.getStyle(this.pinImage, 'left')) || 0;

        return {
            top: top + parseFloat(styleTop),
            left:  left + parseFloat(styleLeft),
            right: left + parseFloat(styleLeft) + this.pinImage.offsetWidth,
            bottom: top + parseFloat(styleTop) + this.pinImage.offsetHeight,
            offsetX: left,
            offsetY: top
        };
    },
    
    getAnchorPositions: function(){
        var top = this.domY;
        var left = this.domX;

        var styleTop = parseFloat(deCarta.Utilities.getStyle(this.pinImage, 'top')) || 0;
        var styleLeft = parseFloat(deCarta.Utilities.getStyle(this.pinImage, 'left')) || 0;

        return {
            left: (parseFloat(styleLeft) + parseFloat(this.pinImage.offsetWidth) / 2),            
            right: (parseFloat(styleLeft) + parseFloat(this.pinImage.offsetWidth) / 2),
            top: parseFloat(styleTop),
            bottom: parseFloat(styleTop) + parseFloat(this.pinImage.offsetHeight)            
        }
    },

    getCluster : function(){
        return (this.cluster ? (this.cluster.getList().length>1 ? this.cluster : null) : null);
    },

    /**
     * Hides the text for this pin
     */
    hideText: function(){
        
        if (!this.textVisible) return;        
        if (this.options.onHideText) this.options.onHideText(this);
        this.textVisible = false;
        this.domElement.style.zIndex = this.originalZ || 100;
        this.owner.owner.infoWindow.hide();
    },

    /**
     * Unhides the text for this pin
     */
    showText: function(){
        
        if  (!this.textEnabled) return;

        if (this.textVisible || !this.domElement) return;
        if (this.options.onShowText) this.options.onShowText(this);

        this.originalZ = this.domElement.style.zIndex;
        this.domElement.style.zIndex = parseFloat(this.domElement.style.zIndex) + 100;       
        
        var el = this.owner.owner.infoWindow.getElement();
        this.domElement.appendChild(el);
        this.owner.owner.infoWindow.show({
            target: this,
            content: this.options.text,
            autoReorient: this.options.infoWinOptions.autoReorient,
            cssClass: this.options.cssClass,
            onClose: function(){                
                this.domElement.style.zIndex = this.originalZ || 100;
                if (this.options.onHideText) this.options.onHideText(this);
                this.textVisible = false;
                this.domElement.style.zIndex = this.originalZ || 100;
            }.bind(this)
        });
        
        if (this.options.onTextShown) this.options.onTextShown(this);
        this.owner.owner.render();
        this.textVisible = true;        
    },

    /**
     * Disables the text for this pin
     * This both hides the text, and disables the text from appearing the 
     * next time the pin is clicked.
     */
    disableText: function(){
        this.hideText();
        this.textEnabled = false;
    },

    /**
     * Enables the text for this pin
     * If the text was disabled, it will not appear when the pin is clicked.
     * Enabling the text re-enables the appear-on-click functionality.
     */
    enableText: function(){
        this.textEnabled = true;
    },

    /**
     * Gets the center position for the pin
     * @returns {deCarta.Core.Position} 
     */
    getCenter: function(){
        return this.options.position;
    }

}; //end Pin prototype

//Extend the OverlayObject with the additional methods for Pin
deCarta.Core.Pin.prototype = deCarta.Utilities.inherit(deCarta.Core.Pin.prototype, deCarta.Core.OverlayObject.prototype);
/**
 * @class
 * Images (which are inherited from {@link deCarta.Core.OverlayObject}s can be added to map overlays
 * ({@link deCarta.Core.MapOverlay}). An Image defines two positions on the map: topLeft and bottomRight,
 * which indicate the corners of the image on the map.<br />
 * The image will scale when zoomed to maintain its position. <br />
 * You can also provide a range for valid zoom levels at which to display the image.<br />
 *
 * Example: 
 * <pre>
 *           
 *   var image = new deCarta.Core.Image({
 *       topLeft: new deCarta.Core.Position(37, -122),
 *       topRight: new deCarta.Core.Position(37.5, -122.5),
 *       minZoom: 10,
 *       maxZoom: 13,
 *       src: 'prettyImage.jpg'
 *   });
 *   
 *   //assuming mapOverlay is a mapOverlay object, attached to a map
 *   mapOverlay.addObject(image);
 *   
 *  </pre>
 *
 * @description An OverlayObject used to display an Image on a MapOverlay
 *
 * @constructor
 * @param {object} options Options. May contain one or more of the following:
 * <ul>
 *   <li>{@link deCarta.Core.Position} topLeft: Geographic position of the top-left of the image on the map - required</li>
 *   <li>{@link deCarta.Core.Position} btmRight: Geographic position of the bottom-right of the image on the map - required</li>
 *   <li>(int) minZoom: optional, default 1</li>
 *   <li>(int) maxZoom: optional, default 20</li>
 *   <li>(string) cssClass: css class that will be applied to the element</li>
 *   <li>(int) opacity: opacity of the image [0 (transparent) to 100 (opaque)]  default=75</li>
 *   <li>(string) src: the image src, can be a reference to an image file or a data URI</li>
 * </ul>
 *
 * @see deCarta.Core.MapOverlay
 * @see deCarta.Core.OverlayObject
 */

deCarta.Core.Image = function(opts){

    deCarta.Core.OverlayObject.call(this, opts);

    this.options = {        
        topLeft: null,
        btmRight: null,
        minZoom: 1,
        maxZoom: 21,
        width: 0,
        height: 0,
        cssClass: 'deCarta-Mob-ImgObj',
        opacity: 75
    }
    
    this.domElement = null;

    this.type = 'image';
    this.options = deCarta.Utilities.extendObject(this.options, opts);    
    this.boundingBox = new deCarta.Core.BoundingBox([this.options.topLeft, this.options.btmRight]);
    
}

//Define methods to extend Image
deCarta.Core.Image.prototype = {
	
	 /**
	  * @private
	  */
     render: function(x, y, z, tiles){
        if (z >= this.options.minZoom && z <= this.options.maxZoom){
            if (!this.domElement) {
                this.domElement = new Image();
                this.domElement.style.position = 'absolute';
                this.domElement.src = this.options.src;
                this.domElement.className = this.options.cssClass;
                deCarta.Utilities.setOpacity(this.domElement, this.options.opacity);
                
                this.addListeners(this.domElement);
            }
            this.domElement.style.display = 'block';
            
            this.domElement.style.top = y + 'px';
            this.domElement.style.left = x + 'px';
            
            //calc w and h            
            var width = deCarta.Utilities.lon2pix(this.options.btmRight.getLon(), z) - deCarta.Utilities.lon2pix(this.options.topLeft.getLon(), z);
            var height = deCarta.Utilities.lat2pix(this.options.topLeft.getLat(), z) - deCarta.Utilities.lat2pix(this.options.btmRight.getLat(), z);
            
            this.domElement.style.width = width + 'px';
            this.domElement.style.height = height + 'px';
            this.domElement.style.zIndex = 100;
            
            return this.domElement;
        } else {
            this.domElement.style.display = 'none';
        }
    },

    /** Retrieve the geographic position  of the top-left
	 * corner of the image.
	 * @return {deCarta.Core.Position} Geographic position of the top-left corner of the image
	 */
    getPosition: function(){
        return this.options.topLeft;
    },

    /** Retrieves the size of the image, in meters
	 * @return {width|height} A structure containing width and height
	 */
    getSize: function(z){
        return this.boundingBox.getSize(z);
    },

    /** Sets the geographic position of the top-left
	 * corner of the image.
	 * @param {deCarta.Core.Position} position Position of the top-left corner of the image
	 */
    setPosition: function(position){
        z = 21;
        var width = deCarta.Utilities.lon2pix(this.options.btmRight.getLon(), z) - deCarta.Utilities.lon2pix(this.options.topLeft.getLon(), z);
        var height = deCarta.Utilities.lat2pix(this.options.topLeft.getLat(), z) - deCarta.Utilities.lat2pix(this.options.btmRight.getLat(), z);        
        this.options.topLeft = new deCarta.Core.Position(position.lat, position.lon);
        var newBX = deCarta.Utilities.lon2pix(this.options.topLeft.getLon(), z) + width;
        var newBY = deCarta.Utilities.lat2pix(this.options.topLeft.getLat(), z) - height;
        this.options.btmRight.setXY(newBX, newBY, z);
        if (this.owner && this.owner.refreshObjects) this.owner.refreshObjects();
    }

}; //end Image prototype

//Extend the OverlayObject with the additional methods for image
deCarta.Core.Image.prototype = deCarta.Utilities.inherit(deCarta.Core.Image.prototype, deCarta.Core.OverlayObject.prototype);


/**
 * @private
 * Used by the MapOverlay to cluster pins together. Not an end-user class. 
 */
deCarta.Core.ClusteredPin = function(opts){

    deCarta.Core.OverlayObject.call(this, opts);

    this.options = {
        threshold: 50,
        zoom: null,
        image: null,
        imageSrc: null,
        xOffset: 0,
        yOffset :0,
        onClick: function(){}
    }

    this.options = deCarta.Utilities.extendObject(this.options, opts);

    if (!this.options.zoom)
        deCarta.Core.Exception.raise('You cannot instantiate a ClusteredPin without specifying the zoom');

    this.pin = null;
    this.cluster = null;
    this.point = null;
    this.threshold = this.options.threshold;
    this.domElement = null;

}

deCarta.Core.ClusteredPin.prototype = {

    /**
     * Attempts to add a pin to the cluster.
     * returns true if successful, false if pin is outside cluster
     */
    addPin: function(pin){
        if (!this.cluster) {
            this.cluster = [];
            this.cluster.push(pin);
            this.options.position = pin.getPosition();
            this.centerPoint = this.options.position.getPixelPoint(this.options.zoom);            
            pin.cluster = this;
            return true;
        } else {
            var newPoint = pin.getPosition().getPixelPoint(this.options.zoom);
            if (deCarta.Utilities.pixelDistance(this.centerPoint, newPoint) < this.options.threshold){
                this.cluster.push(pin);
                pin.cluster = this;
                return true;
            } else {
                return false;
            }
        }
    },

    getCount: function(){
        //console.log('get count for ', this);
        var count = 0;
        for (var i = 0 ;i < this.cluster.length; i++){
            if (this.cluster[i] && this.cluster[i].visible){
                count ++;
            }
        }
        //console.log('count', count);
        return count;
    },
    /**
     * if you have a pin that you would like to see, but it is inside a cluster, this function will 
     * take the pin and zoom the map down as far as needed to break the pin out of the cluster.
     * from the pin you can get the cluster with: <code>pin.getCluster()</code>.
     * @param pin {Pin}
     * @param {Function} callback called when zooming is complete
     * @param {Function} unbreakable called if pin cannot be broken out of cluster
     */
    zoomDownToBreakPinFromCluster : function(pin, callback, unbreakable){

        var nearest=null;
        var minDist = parseFloat("Infinity");

        for(var i=0;i<this.cluster.length;i++){
            if(pin.objectId!==this.cluster[i].objectId){
                var d = deCarta.Utilities.positionPixelDistance(pin.getPosition(),this.cluster[i].getPosition(),19);
                if (d<minDist){
                    nearest=this.cluster[i];
                    minDist = d;
                }
            }
        }
        if(minDist<=this.options.threshold){
            unbreakable();
            return;
        }
        var currZoom = pin.owner.owner.zoom;
        for(var z = currZoom; z<=19; z++){
            var d = deCarta.Utilities.positionPixelDistance(pin.getPosition(),nearest.getPosition(),z);
            if(d>this.options.threshold){
                var zEnd = function (e){
                    deCarta.Core.EventManager.stopListening('zoomend', this.handley); 
                    setTimeout(callback,100)
                }.bind(this)    
                this.handley = deCarta.Core.EventManager.listen('zoomend', zEnd, pin.owner.owner);   
                pin.owner.owner.centerOn(pin.getPosition(), {animated: false});
                pin.owner.owner.zoomTo(z);
                return;
            }
        }
    },

    getSingle: function(x,y){
        for (var i = 0; i < this.cluster.length; i++){
            if (this.cluster[i].visible) break;
        }
        return this.cluster[i].render(x, y);
    },

    render: function(x, y){
        var count = this.getCount();

        if (count == 1) return this.getSingle(x,y);

        var zIndex = this.cluster[0].zIndex;

        if (!this.domElement){
            this.domElement = deCarta.crEl('div');
            this.domElement.className = 'deCarta-Pin-Cluster';
            this.domElement.style.zIndex = zIndex;
            this.domElement.id = ("deCarta-pin-" + Math.random()).replace(".", "");
            
            this.domElement.style.position = 'absolute';
            this.imgElement = this.chooseIcon();
            this.imgElement.style.position = 'absolute;'            

            this.labelElement = deCarta.crEl('div');
            this.labelElement.className = 'deCarta-Pin-Cluster-label';
            



            this.domElement.appendChild(this.imgElement);
            this.domElement.appendChild(this.labelElement);

            deCarta.Touch.attachListener('tap', this.domElement, this.onClick.bind(this), false);
        }

        /*var img = deCarta.UI.ImagePack.get('pinDefaultImage');

        var iHeight = parseFloat(img.style.height);
        var iWidth = parseFloat(img.style.width);*/

        this.domPosition(x - this.options.xOffset, y - this.options.yOffset);

        /*this.domElement.style.top  = y - iHeight + 'px';
        this.domElement.style.left = x - (iWidth / 2)+ 'px';*/

        this.labelElement.innerHTML = count;
        
        this.domElement.style.display = (count > 0) ? 'block' : 'none';

        return this.domElement;
    },

    /**
     *@private
     */
    genericClusterIcon : function(pin){

        var div = deCarta.crEl("div"); 
        div.className = 'deCarta-Pin-Cluster-Default';
        return div;
    },

    chooseIcon: function(){
        
        if (this.options.image){
            return this.options.image;
        }
        
        if (this.options.imageSrc){
            var img = new Image();
            img.src = this.options.imageSrc;
            return img;            
        }

        var candidate = this.cluster[0].getImage();
        if(candidate){ // image based pin
            for (var i = 1 ;i < this.cluster.length; i++){
                if (typeof candidate !== 'string') {
                    if (this.cluster[i].getImage().src != candidate.src) {
                        return this.genericClusterIcon(this.cluster[i]);
                    }
                } else {
                    if (this.cluster[i].getImage() != candidate) {
                        return this.genericClusterIcon(this.cluster[i]);
                    }
                }
            }

            var img = new Image();
            if (typeof candidate === 'string') {
                img.src = candidate;            
            }
            else {
                img.src = candidate.src;
                img.style.width = candidate.style.width;
                img.style.height = candidate.style.height;
            }
            this.options.xOffset = this.cluster[0].options.xOffset;
            this.options.yOffset = this.cluster[0].options.yOffset;

        } else { // non image based pin
           return this.genericClusterIcon(this.cluster[i]);
        }
        return img;
    },

    onClick: function(){
        this.options.onClick(this.cluster);
    },

    getList: function(){
        return this.cluster;
    },

    //infowindow stuf for the cluster. 
    getBounds: function(){
        var top = this.domY;
        var left = this.domX;

        var styleTop = parseFloat(deCarta.Utilities.getStyle(this.imgElement, 'top')) || 0;
        var styleLeft = parseFloat(deCarta.Utilities.getStyle(this.imgElement, 'left')) || 0;

        return {
            top: top + parseFloat(styleTop),
            left:  left + parseFloat(styleLeft),
            right: left + parseFloat(styleLeft) + this.imgElement.offsetWidth,
            bottom: top + parseFloat(styleTop) + this.imgElement.offsetHeight,
            offsetX: left,
            offsetY: top
        };
    },
    
    getAnchorPositions: function(){
        var top = this.domY;
        var left = this.domX;

        var styleTop = parseFloat(deCarta.Utilities.getStyle(this.imgElement, 'top')) || 0;
        var styleLeft = parseFloat(deCarta.Utilities.getStyle(this.imgElement, 'left')) || 0;

        return {
            left: (parseFloat(styleLeft) + parseFloat(this.imgElement.offsetWidth) / 2),            
            right: (parseFloat(styleLeft) + parseFloat(this.imgElement.offsetWidth) / 2),
            top: parseFloat(styleTop),
            bottom: parseFloat(styleTop) + parseFloat(this.imgElement.offsetHeight)            
        }
    },

    showText: function(content, onClose, options){

        this.originalZ = this.domElement.style.zIndex;
        this.domElement.style.zIndex = parseFloat(this.domElement.style.zIndex) + 100;

        var el = this.owner.owner.infoWindow.getElement();
        this.domElement.appendChild(el);
        this.owner.owner.infoWindow.show({
            target: this,
            content: content,
            autoReorient: true,
            onClose: function(){                
                this.domElement.style.zIndex = this.originalZ || 100;
                if (onClose) onClose(this);
                this.textVisible = false;
                this.domElement.style.zIndex = this.originalZ || 100;
            }.bind(this)
        });
    },

    hideText: function(){
        this.domElement.style.zIndex = this.originalZ || 100;
        this.owner.owner.infoWindow.hide();
    }




}; //end ClusteredPin prototype

//Extend the OverlayObject with the additional methods for ClusteredPin
deCarta.Core.ClusteredPin.prototype = deCarta.Utilities.inherit(deCarta.Core.ClusteredPin.prototype, deCarta.Core.OverlayObject.prototype);

deCarta.Core.Shape = function(options){

	deCarta.Core.OverlayObject.call(this, options);

	this.options = {               
        strokeColor: '#0077D2',
        strokeWidth: 2,
        strokeOpacity: 0.7,
        fillColor: '#0077D2',
        fillOpacity: 0.4
    }

    this.options = deCarta.Utilities.extendObject(this.options, options);
    this.type = 'shape';    
    this.padding = 5;
    this.attachedEvents = false;

    this.visible = true;
}

deCarta.Core.Shape.prototype = {

	render: function(x, y, z, tiles){
        if (!this.visible) return;
        var el = null;

        switch (this.renderingMode){
            case 'canvas':
                el = this.renderCanvas(x, y, z, tiles);
                break;
            case 'SVG':
                el = this.renderSVG(x, y, z, tiles);
                break;
            case 'VML':
                el = this.renderVML(x, y, z, tiles);
                break;
        }        
        /*if (!this.attachedEvents){            
            try {
                this.addListeners(this.clickableElement || el);
            } catch (e){
                
            }
            this.attachedEvents = true;
        }*/
        return el;        
    }   
}

deCarta.Core.Shape.prototype = deCarta.Utilities.inherit(deCarta.Core.Shape.prototype, deCarta.Core.OverlayObject.prototype);
 /**
 * @class
 * Polyline is a map overlay object used to draw a complex line
 * (such as a route) on the map.
 * It extends {@link deCarta.Core.OverlayObject}.
 * Use the {@link deCarta.Core.MapOverlay}:addObject() method to add 
 * this object to a map overlay.
 * (for example a route).
 *
 * @constructor
 * @param {object} opts Options. May contain one or more of the following
 * <ul>
 *  <li>lineGeometry: Array of deCarta.Mobile.Position</li>
 *  <li>fillColor: A polyline has thickness, and therefore has a fill color
 *      - optional, default '#000'</li>
 *  <li>strokeColor: Color hat will be used to stroke the line
 *      - optional, default '#0000FF'</li>
 *  <li>strokeSize: Size of the line, in pixels - optional, default 6</li>
 *  <li>strokeOpacity: Opacity of the line (1.0 = opaque, 0.0 = transparent)
 *      - optional, default 0.6</li>
 * </ul>
 *
 * @see deCarta.Core.OverlayObject
 * @see deCarta.Core.MapOverlay
 */
 /*
 * <p><b>POINT INDEXES AND THINNING</b></p>
 * <p>
 * When a line is rendered, all the points are indexed by the tile they
 * fall on  to, given the zoom level. On zoom level changes, a new
 * index is built.  
 *</p>
 *<p>
 * Creating the index is a linear operation, we look at each point and assign it
 * to a tile key. The index structure is an object with properties named as
 * tile keys which contain an array of indexes referring to the list of
 * positions that make up the polyline.
 *</p>
 * For example :
 *<pre>
 * var index = [
 *      10: {
 *          '10_-347_113' : [0, 34]
 *      }
 * ]
 *</pre>
 *<p>
 * <b>NOTE:</b> the indexes refer to the genGeom array, which contains (by zoom lev)
 * the generalized geometry (contiguous points). These indexes contain indexes into
 * the real geometry.
 *</p>
 *<p>
 * This means we have an index built for level 10, and tile 10, -347, 133 contains
 * points 0 and 34 of our positions array.
 *</p>
 * Points in the index have already undergone thinning (in fact it is part of
 * the same linear operation that builds the index) so they can simply be taken
 * and drawn on screen. 
 *
 * @description An OverlayObject used to display a polyline on a MapOverlay
 *
*/

deCarta.Core.Polyline = function(options){
    opts = {
        lineGeometry: null,        
        strokeWidth: 6,
        granularity: 7 //not documented
    }

    options = deCarta.Utilities.extendObject(opts, options);

    deCarta.Core.Shape.call(this, options);
    //check if lineGeomtry is an array of pos
    if (!options.lineGeometry || options.lineGeometry.length == 0)
        deCarta.Core.Exception.raise('You need to provide a lineGeometry to instantiate a polyline');


    this.pointIndex = [];
    this.genGeom = []; //array of generalized geometry, per zoom level 

    this.positions = [];

    this.lastRenderedPointSet = null;
    
    
    if (typeof this.options.lineGeometry[0] == 'object' && this.options.lineGeometry[0].getLat){
        //these are positionS!!!

        this.positions = this.options.lineGeometry.slice();
        
    } else {
        for(var i = 0; i< this.options.lineGeometry.length; i++){
            var ll = this.options.lineGeometry[i].split(' ');
            var tPos = new deCarta.Core.Position(ll[0], ll[1]);
            this.positions.push(tPos);
        }
    }


    this.type = 'shape';

    
    this.padding = 5;

    this.findBounds();
    
    
    this.boundingBox = new deCarta.Core.BoundingBox(this.positions);
    
}


//Define methods to extend Polyline
deCarta.Core.Polyline.prototype = {
    /**
     * Overrides the standard {@link deCarta.Core.OverlayObject}:getPosition() method
     * @return {deCarta.Core.Position} Returns the top left geographic position of the polyline's bounding rectangle
     */
    getPosition: function(){
        return this.topLeftPoint;
    },

    setPosition: function(p){
        this.topLeftPoint = p;
    },
  
    /**
     * Returns size of the polyline's bounding box at a given zoom level
     * @param {int} z zoom level (20=maxzoom, 1=minzoom)
     * @return {width|height} Size of the geographic bounding box of the polyline
     * */
    getSize: function(z){
        
        return this.boundingBox.getSize(z);
    },

    /**
    * Returns a GML description of the shape. 
    * 
    *
    */    
    getGML: function(){
        var GML = '';
        GML += "<gml:LineString>";
        for ( i = 0; i < this.options.lineGeometry.length; i++ ) {
            GML += "<gml:pos>"+this.options.lineGeometry[i]+"</gml:pos>"
        }
        GML += "</gml:LineString>";
        return GML;
    },
    
    /**
     * Returns the best center (Position) and Zoom (int) to display this polyline
     * @param {deCarta.Core.Map} map The current map view
	 * @return {zoom|center} Ideal zoom level (1 to 20), and center position {@link deCarta.Core.Position}
     */
    getIdealCenterAndZoom: function(map){
        return this.boundingBox.getIdealCenterAndZoom(map);
    },

    /**
     * @private
     */
    renderVML: function(x, y, z, tiles){
        if (!this.container){
            this.findBounds();
            this.container = deCarta.crEl('div');
            this.container.id = ("deCarta-polyline-container-" + Math.random()).replace(".", "");            
                                        
            this.container.style.position = 'absolute';
            
            return this.container;
        }

        this.findBounds();  
        this.indexAndThinPoints(z);

        var nz = deCarta.Utilities.normalizeZoom(z);
        
        var pStr = '';
        var dX = this.topLeftPoint.getX(z);
        var dY = this.topLeftPoint.getY(z);
        
        var points = this.preparePoints(z, dX, dY, tiles);       

        for (var i = 0; i < points.length; i++){
            var p = points[i];
            pStr += Math.round(p.x) + ',' + Math.round(p.y) + ' ';
        }        

        var fillStr = '<v:fill opacity="0%" color="'+this.options.fillColor+'"/>'
        var strokeStr = '<v:stroke opacity="' + Math.round(this.options.strokeOpacity * 100) + '%" weight="'+ this.options.strokeWidth+'px" color="'+this.options.strokeColor+'" />';
        var vmlStr = '<v:polyline points="' + pStr + '">'+strokeStr+ fillStr +'</v:polyline>';
        this.container.style.zIndex = this.zIndex;   
        this.container.innerHTML = vmlStr;

        this.clickableElement = this.container.firstChild;

        this.domPosition((x - 5),(y - 5), this.container);
        return this.container;
    },

    /**
     * @private
     */
    renderSVG: function(x, y, z, tiles){

        if (!this.svgElement) {

            this.findBounds();
            this.svgElement = document.createElementNS("http://www.w3.org/2000/svg", "svg");
            this.svgElement.setAttribute("version", "1.1");
            this.svgElement.setAttribute("id", ("deCarta-shape-svg-" + Math.random()).replace(".", ""));            
        }

        if (!this.lineElement){
            this.lineElement = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
            this.svgElement.appendChild(this.lineElement);
        }

        this.indexAndThinPoints(z);

        var nz = deCarta.Utilities.normalizeZoom(z);
        
        var pStr = '';
        var dX = this.topLeftPoint.getX(z);
        var dY = this.topLeftPoint.getY(z);
        
        var points = this.preparePoints(z, dX, dY, tiles);

        for (var i = 0; i < points.length; i++){
            var p = points[i];
            pStr += p.x + ',' + p.y + ' ';
        }
        
        this.lineElement.setAttribute('points', pStr);
        this.lineElement.setAttribute('style', "fill:none;stroke:"+this.options.strokeColor+";stroke-width:"+this.options.strokeWidth+";stroke-opacity:"+this.options.strokeOpacity);

        var dim = this.getSize(z);

        this.svgElement.setAttribute('style', "position: absolute; width: " + (dim.width + 10) + "px; height: " + (dim.height + 10) + "px;");
        this.svgElement.style.zIndex = this.zIndex;
        this.domPosition((x - 5),(y - 5), this.svgElement);
        //this.svgElement.setAttribute('style', "position: absolute; width: " + (dim.width + 10) + "px; height: " + (dim.height + 10) + "px; top: " + (y - 5) + "px; left: " + (x - 5) + "px;")
        this.clickableElement = this.lineElement;
        return this.svgElement;
    },
    /**
     * @private
     */
    renderCanvas: function(x, y, z, tiles){
        
        if (!this.canvasElement){
            this.findBounds();
            this.canvasElement = deCarta.crEl('canvas');

            this.canvasElement.setAttribute("id", ("deCarta-shape-" + Math.random()).replace(".", ""));
            this.canvasElement.className = 'deCarta-polyline';        
            this.canvasElement.style.zIndex = this.zIndex;
            this.canvasElement.style.position = 'absolute';            
           
            return this.canvasElement;
        }

        if (!this.canvasElement.getContext){
            try {
                G_vmlCanvasManager.initElement(this.canvasElement);
            } catch (e){
                deCarta.Core.Exception.raise('Error in drawing the shape - have you added exCanvas to your page?');
            }
        }        

        this.indexAndThinPoints(z);
                
        var dim = this.getSize(z);
        var topClip = 0;
        var leftClip = 0;

        //clipping .. otherwise this is terrible.

        if (x < 0) {
            leftClip = x;
            x = 0;
        }
        if (y < 0) {
            topClip = y;
            y = 0;
        }
        if (x + dim.width > window.innerWidth) dim.width = window.innerWidth - x;
        if (y + dim.height > window.innerHeight) dim.height = window.innerHeight - y;

        //this.canvasElement.setAttribute('style', "position: absolute;"); //why?
        this.domPosition((x - this.padding), (y - this.padding), this.canvasElement);

        //maybe we can skip this rendering? depends.
        if (z == this.lastZ &&
            leftClip == this.lastLeftClip &&
            topClip == this.lastTopClip &&
            dim.width == this.lastWidth &&
            dim.height == this.lastHeight){
            
            return this.canvasElement;

        }

        this.lastZ = z;
        this.lastLeftClip = leftClip;
        this.lastTopClip = topClip;
        this.lastWidth = dim.width;
        this.lastHeight = dim.height;

        this.canvasElement.width = dim.width + (this.padding*2);
        this.canvasElement.height = dim.height+ (this.padding*2);

        var dX = this.topLeftPoint.getX(z) - leftClip;
        var dY = this.topLeftPoint.getY(z) + topClip ;


        var ctx = this.canvasElement.getContext('2d');
        ctx.beginPath();        

        var points = this.preparePoints(z, dX, dY, tiles);

        var moved = false;
        
        for (var i = 0; i < points.length; i++){
            p = points[i];
            if (!moved) {
                ctx.moveTo(p.x, p.y);
                moved = true;
            }
            else ctx.lineTo(p.x, p.y);
        }

        ctx.strokeStyle = this.options.strokeColor;
        ctx.lineWidth = this.options.strokeWidth;
        ctx.globalAlpha = this.options.strokeOpacity;
        ctx.lineCap = 'round';

        ctx.stroke();
        
        return this.canvasElement;

    },

    /**
     * @private
     */
    indexAndThinPoints: function(z){
        //Check the point index
        var nz = deCarta.Utilities.normalizeZoom(z);
        if (!this.pointIndex[nz]){
            
            var tile = null;
            var key = null;
            var posLength = this.positions.length;
            //use these to thin out teh points.
            var lastPoint = null;
            var tx = 0;
            var ty = 0;
            var distance = null;
            var lastTileX = null;
            var lastTileY = null;

            this.pointIndex[nz] = {};
            this.genGeom[nz] = [];

            for (var i = 0; i < posLength; i++){
                var p = this.positions[i];

                tx = p.getX(z);
                ty = p.getY(z);

                if (lastPoint){
                    distance = Math.sqrt(Math.pow(tx - lastPoint.x, 2) + Math.pow(ty - lastPoint.y, 2));
                }

                if (distance > this.options.granularity || !lastPoint || i == (posLength - 1)){
                    tile = p.getTileAtZoom(nz);
                    key = deCarta.Utilities.getTileKey(tile.E, tile.N, nz);
                    if (!this.pointIndex[nz][key]) this.pointIndex[nz][key] = [];

                    this.genGeom[nz].push(i);
                    // keep only a ref to the index here
                    // so this is an index into this.genGeom[nz] which is in turn
                    // an index into the geometry. just so u know.. 
                    this.pointIndex[nz][key].push( this.genGeom[nz].length - 1 );

                    // now this is important. What happens here is that :
                    // 1 - if we have a previous point, check
                    // 2 - if the tiles are different, add 
                    // 3 - BOTH points to all tiles that connect the two
                    if (lastTileX && lastTileY){
                        if (tile.E != lastTileX || tile.N != lastTileY){

                            var x0 = Math.min(tile.E, lastTileX);
                            var x1 = Math.max(tile.E, lastTileX)
                            var y0 = Math.min(tile.N, lastTileY);
                            var y1 = Math.max(tile.N, lastTileY);

                            var dx = Math.abs(x1-x0);
                            var dy = Math.abs(y1-y0);
                            var sx = (x0 < x1) ? 1 : -1;
                            var sy = (y0 < y1) ? 1 : -1;
                            var err = dx-dy;

                            while(true){
                                
                                var eK = deCarta.Utilities.getTileKey(x0, y0, nz);
                                if (!this.pointIndex[nz][eK]) this.pointIndex[nz][eK] = [];
                                this.pointIndex[nz][eK].push( this.genGeom[nz].length - 1 );
                                this.pointIndex[nz][eK].push( this.genGeom[nz].length - 2 );

                                if ((x0==x1) && (y0==y1)) break;

                                var e2 = 2*err;

                                if (e2>-dy){
                                    err -= dy;
                                    x0  += sx;
                                }
                                if (e2 < dx){
                                    err += dx;
                                    y0  += sy;
                                }
                            }
                            
                        }
                    }
                    lastTileX = tile.E;
                    lastTileY = tile.N;

                    lastPoint = {x: tx, y: ty};
                }
            }            
        }
    },

    /**
     * @private
     */
    preparePoints: function(z, dX, dY, tiles){
        
        var points = [];
        var nz = deCarta.Utilities.normalizeZoom(z);
        var p = null;
        var px = null;
        var py = null;
        var addedPoints = {};

        for (var i = 0; i< tiles.length; i++){
            var key = deCarta.Utilities.getTileKey(tiles[i].E, tiles[i].N, nz);
            if ( this.pointIndex[nz][key])
                for (var j= 0; j< this.pointIndex[nz][key].length; j++){

                    p = this.positions[this.genGeom[nz][this.pointIndex[nz][key][j]]];
                    px = p.getX(z) - dX + this.padding;                    
                    py = dY - p.getY(z) + this.padding;

                    if (!addedPoints[p.toString()]){
                        addedPoints[p.toString()] = true;                        
                        points.push({x: px, y: py, i: this.pointIndex[nz][key][j]});
                    }                    
                }
        }

        points.sort(function(a,b){return a.i - b.i});        
        return points;

    },

    /**
     * @private
     */
    findBounds: function(){    
        
        this.topLeftPoint = null;
        this.btmRightPoint = null;

        var minX = null;
        var minY = null;
        var maxX = null;
        var maxY = null;

        for (var i = 0; i < this.positions.length; i++){

            var pt = this.positions[i];
            
            var ptX = pt.getX(18);
            var ptY = pt.getY(18);

            if (ptX < minX || !minX) minX = ptX;
            if (ptY < minY || !minY) minY = ptY;

            if (ptX > maxX || !maxX) maxX = ptX;
            if (ptY > maxY || !maxY) maxY = ptY;

            //delete pt;
        }

        this.topLeftPoint = new deCarta.Core.Position(0,0);
        this.btmRightPoint = new deCarta.Core.Position(0,0);

        this.topLeftPoint.setXY(minX, maxY, 18);
        this.btmRightPoint.setXY(maxX, minY, 18);

        this.boundingBox = new deCarta.Core.BoundingBox([this.topLeftPoint, this.btmRightPoint]);
    },

    /* tests if a position is  on the line. returns true / false. */
    shouldProcessEvent: function(position, x, y){        
       /* var z = this.owner.owner.zoom;
        var x = position.getX(z) - this.topLeftPoint.getX(z);
        var y = this.topLeftPoint.getY(z) - position.getY(z);;*/                
        
        if (this.renderingMode == 'canvas'){
            var ctx = this.canvasElement.getContext('2d');
            try{
                var c = ctx.getImageData(x, y, 2, 2).data;  
            } catch(e) {
                return false;
            }   
            if (c[0] == 0 && c[1] == 0 && c[2] == 0) return false;
            return true;
        }

        return true;
    },

    getBoundingBox: function(){
        return this.boundingBox;
    }

}; //end Polyline prototype

//Extend the OverlayObject with the additional methods for Polyline
deCarta.Core.Polyline.prototype = deCarta.Utilities.inherit(deCarta.Core.Polyline.prototype, deCarta.Core.Shape.prototype);
/**
 * @class
 *
 * Polygon is a map overlay object used to draw a polygon
 * on the map.
 * It extends {@link deCarta.Core.OverlayObject}.
 * Use the {@link deCarta.Core.MapOverlay}:addObject() method to add 
 * this object to a map overlay.
 *
 * @description An OverlayObject used to display a polygon on a MapOverlay
 *
 * @constructor
 * @param {object} options Options. May contain one or more of the following:
 * <ul>
 *  <li>(array of {@link deCarta.Core.Position}) vertices: Array of {@link deCarta.Core.Position}s comprising the vertices of the polygon</li>
 *  <li>(string) strokeColor: Color that will be used to stroke the line
 *      - optional, default '#0077D2'</li>
 *  <li>(int) strokeWidth: Size of the polygon border, in pixels - optional, default 2</li>
 *  <li>(string) fillColor: The fill color for the interior of the polygon
 *      - optional, default '#000'</li>
 *  <li>(float) opacity: Opacity of the shape (1.0 = opaque, 0.0 = transparent)
 *      - optional, default 0.6</li> 
 * </ul>
 *
 * @see deCarta.Core.OverlayObject
 * @see deCarta.Core.MapOverlay
 */

deCarta.Core.Polygon = function(options){
    deCarta.Core.Shape.call(this, options);
    
    opts = {
        draggable: false,
        scroll: null
    }

    this.options = deCarta.Utilities.extendObject(opts, this.options);

    this.lastRenderedZ = 0;    

    if (this.options.vertices.length < 3)
        deCarta.Core.Exception.raise('Instantiating a polygon with too few vertices. I believe you need at least 3.');
    
    this.boundingBox = new deCarta.Core.BoundingBox(this.options.vertices);    
    
    this.getPosition();
}


//Define methods to extend Polygon
deCarta.Core.Polygon.prototype = {
    
    /**
     * @private 
     */
    getPosition: function(){
        //if (this.position) return this.position;
        
        var lat = null;
        var lon = null;
        
        for (var i = 0; i < this.options.vertices.length; i++){
            
            var v = this.options.vertices[i];
            if (!lat || v.lat > lat) lat = v.lat;
            if (!lon || v.lon < lon) lon = v.lon;
            
        }
        
        this.position = new deCarta.Core.Position(lat,lon);
        
        
        return this.position;
    },

    /**
    * Returns a GML description of the shape. 
    * 
    *
    */    
    getGML: function(){
        var GML = '';
        GML += "<gml:Polygon><gml:exterior><gml:LinearRing>";
        for ( i = 0; i < this.options.vertices.length; i++ ) {
            GML += "<gml:pos>"+this.options.vertices[i]+"</gml:pos>"
        }
        GML += "</gml:LinearRing></gml:exterior></gml:Polygon>";
        return GML;
    },
    
    /**
     * @private 
     */
    setPosition: function(p){
        
        var oPx = this.position.getPixelPoint();
        var nPx = p.getPixelPoint();
        
        var deltaX = oPx.x - nPx.x;
        var deltaY = oPx.y - nPx.y;               
        
        for (var i = 0; i < this.options.vertices.length; i++){
            var v = this.options.vertices[i];
            var vPx = v.getPixelPoint();
            vPx.x = vPx.x - deltaX;
            vPx.y = vPx.y - deltaY;
            v.setXY(vPx.x, vPx.y);
        }
        
        if (this.boundary){
            this.boundary.fromPoly(this);
        }

        this.position = p;        
    },
    
    /**
     * @private 
     */
    getCenter: function(){
        
        var pos = this.getPosition().getPixelPoint();
        var size = this.getSize(21);
        var x = pos.x + (size.width / 2);
        var y = pos.y - (size.height / 2);
        var center = new deCarta.Core.Position(0,0);
        center.setXY(x,y,21);
        return center;        
    },
    
    /**
     * @private 
     */
    getSize: function(z){        
        return this.boundingBox.getSize(z);
    },    

    getBoundingBox: function(){
        return this.boundingBox;
    },
    
    /**
     * @private 
     */
    setVertices: function(verts){
        this.options.vertices = verts;
        this.boundingBox = new deCarta.Core.BoundingBox(verts);
    },


    /**
    * Returns true if the position passed to the function is within the polygon. 
    * @param pos: the position to check. 
    * NOTE: You can also pass an OverlayObject to this function, and the position will be extracted automatically
    */
    contains: function(pos){
        //console.log('Contains:', this.objectIid)
        if (!pos.getLon) {
            if (pos.getCenter){
                pos = pos.getCenter();
            } else {
                throw new deCarta.Core.Exception('The position passed to the "contains" function is not a position.');
            }
        }
        if (!this.boundary){
            this.boundary = new deCarta.Core.MapBoundary();
            this.boundary.fromPoly(this);
        }
        return this.boundary.checkPosition(pos);
    },

    shouldProcessEvent: function(position){
        return this.contains(position);
    },
    
    /**
     * @private 
     */
    renderCanvas: function(x, y, z, tiles){                
        
        
        if (!this.canvasElement){            
            this.canvasElement = deCarta.crEl('canvas');

            this.canvasElement.setAttribute("id", ("deCarta-shape-" + Math.random()).replace(".", ""));
            this.canvasElement.className = 'deCarta-polygon';
            this.canvasElement.style.zIndex = this.zIndex;
            this.canvasElement.style.position = 'absolute';            

            return this.canvasElement;
        }

        if (!this.canvasElement.getContext){
            try {
                G_vmlCanvasManager.initElement(this.canvasElement);
            } catch (e){
                deCarta.Core.Exception.raise('Error in drawing the shape - have you added exCanvas to your page?');
            }
        }        

 
        var size = this.getSize(z);
        
        this.domPosition((x - this.padding), (y - this.padding), this.canvasElement);

        if (z == this.lastRenderedZ) {
            //no need to rerender, just reposition - for some reason this breaks should check it
           // return this.canvasElement;
        }

        /* Now render the stuff whatever */
        
        var newW = size.width + (this.padding * 2);
        var newH = size.height + (this.padding * 2);
        
        if (newW != this.canvasElement.width || newH != this.canvasElement.height) {

            this.canvasElement.width = newW;
            this.canvasElement.height = newH;  

            var ctx = this.canvasElement.getContext("2d"); 

            ctx.strokeStyle = deCarta.Utilities.makeRGBA(this.options.strokeColor, this.options.strokeOpacity);
            ctx.lineWidth = this.options.strokeWidth;
            ctx.fillStyle = deCarta.Utilities.makeRGBA(this.options.fillColor, this.options.fillOpacity);            

            ctx.beginPath();


            var absPos = this.getPosition().getPixelPoint(z);

            for (var i = 0; i < this.options.vertices.length; i++){
                var v = this.options.vertices[i];
                var pos = v.getPixelPoint(z);

                var dx = pos.x - absPos.x  + this.padding;
                var dy =  absPos.y - pos.y + this.padding;

                if (i == 0) ctx.moveTo(dx, dy);
                else ctx.lineTo(dx, dy);            

            }
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
        }
        this.lastRenderedZ = z;
        return this.canvasElement;
    },
    
    renderVML: function(x, y, z){
        if (!this.container){
            this.container = deCarta.crEl('div');
            this.container.id = ("deCarta-polygon-container-" + Math.random()).replace(".", "");            
                       
            this.container.style.zIndex = this.zIndex;            
            this.container.style.position = 'absolute';
            
            return this.container;
        }
        
        var absPos = this.getPosition().getPixelPoint(z);
        var size = this.getSize(z);
                        
        var newW = size.width + (this.padding * 2);
        var newH = size.height + (this.padding * 2);                        
        
        var vStr = 'm ';
        
        for (var i = 0; i < this.options.vertices.length; i++){
            var v = this.options.vertices[i];
            var pos = v.getPixelPoint(z);

            var dx = pos.x - absPos.x  + this.padding;
            var dy =  absPos.y - pos.y + this.padding;
                        
            if (i == 1 ) vStr += 'l ';
            vStr += Math.round(dx) + ',' + Math.round(dy) + ' ';
        }
        vStr += 'x e';           
        
        var fillStr = '<v:fill opacity="' + Math.round(this.options.fillOpacity * 100) + '%" color="'+this.options.fillColor+'"/>'
        var strokeStr = '<v:stroke opacity="' + Math.round(this.options.strokeOpacity * 100) + '%" weight="'+ this.options.strokeWidth+'px" color="'+this.options.strokeColor+'" />';
        var vmldata = '<v:shape coordsize="'+ newW +',' + newH + '" style="position:absolute;width:'+ newW + 'px;height:' + newH + 'px;" path="' + vStr + '"> ' + fillStr + strokeStr + '</v:shape>';

        this.domPosition((x - this.padding), (y - this.padding), this.container);
        this.container.innerHTML = vmldata;
        
        return this.container;
    },
    
    /**
     * @private 
     */
    renderSVG: function(x, y, z, tiles){
                
        
        if (!this.svgElement) {        
            
            this.container = deCarta.crEl('div');
            this.container.id = ("deCarta-polygon-container-" + Math.random()).replace(".", "");            
                        
            this.svgElement = document.createElementNS("http://www.w3.org/2000/svg", "svg");
            this.svgElement.setAttribute("version", "1.1");                

            this.svgElement.setAttribute("id", ("deCarta-polygon-svg-" + Math.random()).replace(".", ""));
           
            this.container.style.zIndex = this.zIndex;            
            this.container.style.position = 'absolute';
            
            this.container.appendChild(this.svgElement); 
            return this.container;
        }        
        
        if (!this.polyElement) {
            
            this.polyElement = document.createElementNS("http://www.w3.org/2000/svg", "polygon");            
            this.svgElement.appendChild(this.polyElement);            
        }        
        var absPos = this.getPosition().getPixelPoint(z);
        
        var size = this.getSize(z);
                        
        var newW = size.width + (this.padding * 2);
        var newH = size.height + (this.padding * 2);                        
        
        var pStr = '';
        
        
        for (var i = 0; i < this.options.vertices.length; i++){
            var v = this.options.vertices[i];
            var pos = v.getPixelPoint(z);

            var dx = pos.x - absPos.x  + this.padding;
            var dy =  absPos.y - pos.y + this.padding;
            
            pStr += dx + ',' + dy + ' ';
        }
        
        this.polyElement.setAttribute('points', pStr);
        this.polyElement.setAttribute('fill-opacity', this.options.fillOpacity);
        this.polyElement.setAttribute('stroke-opacity', this.options.strokeOpacity);        
        
        this.polyElement.setAttribute('style', "fill:"+this.options.fillColor+";stroke:"+this.options.strokeColor+";stroke-width:"+this.options.strokeWidth+";position: absolute;");
        
        //this.domPosition((x - 5),(y - 5), this.svgElement);
        this.container.style.width = newW + 'px';
        this.container.style.height = newH + 'px';
        this.domPosition((x - this.padding), (y - this.padding), this.container);

        return this.container;      
    }
    
    
}; //end Polygon prototype

//Extend the OverlayObject with the additional methods for Polygon
deCarta.Core.Polygon.prototype = deCarta.Utilities.inherit(deCarta.Core.Polygon.prototype, deCarta.Core.Shape.prototype);
/**
 * @class
 * Circle is used to display a circle on the map.
 * It extends {@link deCarta.Core.OverlayObject}.
 * Use the {@link deCarta.Core.MapOverlay}:addObject() method to add
 * this object to a map overlay.
 *
 * @description A map overlay object used to draw a polygon
 *
 * @constructor
 * @param {object} options Options. May contain one or more of the following:
 * <ul>
 *  <li>{@link deCarta.Core.Position} position: The position of the center of the circle - required</li>
 *  <li>radius: The radius of the circle in meters - optional, default 500</li>
 *  <li>strokeColor: Color of the circle border - optional, default '#0077D2'</li>
 *  <li>strokeWidth: Thickness of the circle border, in pixels - optional, default 2</li>
 *  <li>fillColor: Fill color of the circle - optional, default '#0077D2'</li>
 *  <li>opacity: Opacity of the circle (1.0 = opaque, 0.0 = transparent) - optional, default 0.3</li>
 * </ul>
 *
 * @see deCarta.Core.OverlayObject
 * @see deCarta.Core.MapOverlay
 */

deCarta.Core.Circle = function(options){
    deCarta.Core.Shape.call(this, options);
    opts = {
        position: null,
        radius: 500 //radius is in meters     
    }

    this.options = deCarta.Utilities.extendObject(opts, this.options);

    if (!this.options.position)
        deCarta.Core.Exception.raise('Instantiating a circle without a position. You can see how this would not work very well. Please pass the center position as one of the options, like this: new deCarta.Core.Circle({position: new Position(37, -122)});');

    this.setBB();
}

deCarta.Core.Circle.prototype = {
    /**
     * Dynamically set the radius of the circle. It will readjust accordingly.
     * @param {float} r the radius, in meters.
     */
    setRadius: function(r){
        this.options.radius = r;
        this.setBB();
    },

    setBB: function(){
        var r = this.getPixelRadius(21);
        var x = this.options.position.getX(21);
        var y = this.options.position.getY(21);

        var tl = new deCarta.Core.Position(0,0);
        var br = new deCarta.Core.Position(0,0);

        tl.setXY(x - r, y + r, 21);
        br.setXY(x + r, y - r, 21)

        this.boundingBox= new deCarta.Core.BoundingBox([tl, br]);
    },

    getBoundingBox: function(){
        return this.boundingBox;
    },
    
    /**
    * Returns true if the specified position is within the circle. 
    * @param pos: the position to check. 
    * NOTE: You can also pass an OverlayObject to this function, and the position will be extracted automatically
    */
    contains: function(pos){
        if (!pos.getLon) {
            if (pos.getCenter){
                pos = pos.getCenter();
            } else {
                throw new deCarta.Core.Exception('The position passed to the "contains" function is not a position.');
            }
        }
        var d = deCarta.Utilities.getPointDistance(this.options.position, pos) * 1000;        
        return (d <= this.options.radius);
    },

    shouldProcessEvent: function(position){
        return this.contains(position);
    },
	/** Retrieve the radius of the circle.
	 * @return {float} Radius, in meters
	 */
    getRadius: function(){
        return this.options.radius;
    },


    getGML:function(){
        var xml = '';
        xml += "<gml:CircleByCenterPoint numArc='1'>";
        xml += "<gml:pos>"+this.options.position+"</gml:pos>";
        xml += "<gml:radius uom='m'>"+this.options.radius+"</gml:radius>";
        xml += "</gml:CircleByCenterPoint>";

        return xml;
    },

    /** Gets the radius of the circle, converted to pixels
	 * @param z {int} Zoom level for which we want the pixel dimension
	 * @return {int} Radius, in pixels
	 */
    getPixelRadius: function(z){
        return 1 / (deCarta.Utilities.metersPerPixelAtZoom(this.options.position, z) * (1 / this.options.radius));
    },

    /**
     * @private
     */
    renderCanvas: function(x, y, z, tiles){
        
        if (!this.canvasElement){            
            this.canvasElement = deCarta.crEl('canvas');

            this.canvasElement.setAttribute("id", ("deCarta-shape-" + Math.random()).replace(".", ""));
            this.canvasElement.className = 'deCarta-circle';
            this.canvasElement.style.zIndex = this.zIndex;
            this.canvasElement.style.position = 'absolute';
            return this.canvasElement;
        }

        if (!this.canvasElement.getContext){
            try {
                G_vmlCanvasManager.initElement(this.canvasElement);
            } catch (e){
                deCarta.Core.Exception.raise('Error in drawing the shape - have you added exCanvas to your page?');
            }
        }

        //let's figure out if this is in view first
        var viewport = deCarta.Window.getViewport();
        var pxRadius = this.getPixelRadius(z);
        
        this.domPosition((x - this.padding - pxRadius), (y - this.padding - pxRadius), this.canvasElement);

        if (x + pxRadius < 0 || y + pxRadius < 0 || x - pxRadius > viewport.width || y - pxRadius > viewport.height){
            return false;
        }

        var newWidth = (pxRadius * 2) + (this.padding * 2);
        var newHeight = (pxRadius * 2) + (this.padding * 2);

        if (this.canvasElement.width != newWidth || this.canvasElement.height != newHeight){
            //if we are here, we are in view. So... what do we do
            this.canvasElement.width = (pxRadius * 2) + (this.padding * 2);
            this.canvasElement.height = (pxRadius * 2) + (this.padding * 2);

            var ctx = this.canvasElement.getContext("2d");

            //draw the circle
            ctx.beginPath();
            ctx.arc(pxRadius + this.padding, pxRadius + this.padding, pxRadius, 0, Math.PI*2, true);
            ctx.closePath();

            ctx.strokeStyle = deCarta.Utilities.makeRGBA(this.options.strokeColor, this.options.strokeOpacity);
            ctx.lineWidth = this.options.strokeWidth;
            ctx.fillStyle = deCarta.Utilities.makeRGBA(this.options.fillColor, this.options.fillOpacity);
            
            ctx.fill();
            ctx.stroke();
        }

        return this.canvasElement;
    },

    /**
     * @private
     */
    renderSVG: function(x, y, z, tiles){
        if (!this.svgElement) {        
            
            this.container = deCarta.crEl('div');
            this.container.id = ("deCarta-circle-container-" + Math.random()).replace(".", "");            
                        
            this.svgElement = document.createElementNS("http://www.w3.org/2000/svg", "svg");
            this.svgElement.setAttribute("version", "1.1");                

            this.svgElement.setAttribute("id", ("deCarta-circle-svg-" + Math.random()).replace(".", ""));
           
            this.container.style.zIndex = this.zIndex;            
            this.container.style.position = 'absolute';
            
            this.container.appendChild(this.svgElement); 
            return this.container;
        }
        if (!this.circleElement) {
            
            this.circleElement = document.createElementNS("http://www.w3.org/2000/svg", "circle");            
            this.svgElement.appendChild(this.circleElement);            
        } 
        var viewport = deCarta.Window.getViewport();
        var pxRadius = this.getPixelRadius(z);
        
        if (x + pxRadius < 0 || y + pxRadius < 0 || x - pxRadius > viewport.width || y - pxRadius > viewport.height){
            return false;
        }
        var newWidth = (pxRadius * 2) + (this.padding * 2);
        var newHeight = (pxRadius * 2) + (this.padding * 2);
        
        this.container.style.width = newWidth + 'px';
        this.container.style.height = newHeight + 'px';
        
        this.circleElement.setAttribute('cx', newWidth / 2);
        this.circleElement.setAttribute('cy', newHeight / 2);
        this.circleElement.setAttribute('r', pxRadius);
        this.circleElement.setAttribute('fill-opacity', this.options.fillOpacity);
        this.circleElement.setAttribute('stroke-opacity', this.options.strokeOpacity);
        this.circleElement.setAttribute('style', "fill:"+this.options.fillColor+";stroke:"+this.options.strokeColor+";stroke-width:"+this.options.strokeWidth+";position: absolute;");

        this.domPosition((x - this.padding - pxRadius), (y - this.padding - pxRadius), this.container);
        
        return this.container;
    },
    
    renderVML: function(x, y, z){
        
        if (!this.container) {        
            
            this.container = deCarta.crEl('div');
            this.container.id = ("deCarta-circle-container-" + Math.random()).replace(".", "");            
              
            this.container.style.zIndex = this.zIndex;            
            this.container.style.position = 'absolute';
            
            return this.container;
        }
        
        var viewport = deCarta.Window.getViewport();
        var pxRadius = this.getPixelRadius(z);
        
        if (x + pxRadius < 0 || y + pxRadius < 0 || x - pxRadius > viewport.width || y - pxRadius > viewport.height){
            return false;
        }
        var newWidth = Math.round((pxRadius * 2) + (this.padding * 2));
        var newHeight = Math.round((pxRadius * 2) + (this.padding * 2));
        
        this.container.style.width = newWidth + 'px';
        this.container.style.height = newHeight + 'px';
        
        var fillStr = '<v:fill opacity="' + Math.round(this.options.fillOpacity * 100) + '%" color="'+this.options.fillColor+'"/>'
        var strokeStr = '<v:stroke opacity="' + Math.round(this.options.strokeOpacity * 100) + '%" weight="'+ this.options.strokeWidth+'px" color="'+this.options.strokeColor+'" />';        
        var vmlStr = '<v:oval style="position: relative;top:0;left:0;width:'+newWidth+'px;height:'+newHeight+'px"> ' + fillStr + strokeStr + '</v:oval>';
        
        this.container.innerHTML = vmlStr;
        
        this.domPosition((x - this.padding - pxRadius), (y - this.padding - pxRadius), this.container);
        
        return this.container;
        
    }
	
	
}; //end Circle prototype


//Extend the OverlayObject with the additional methods for circle
deCarta.Core.Circle.prototype = deCarta.Utilities.inherit(deCarta.Core.Circle.prototype, deCarta.Core.Shape.prototype);

/**
 * @class
 * Represents a geographic position as a pair of lat, lon values
 * Also provides methods to easily convert between geo positions (lat,lon) and
 * pixel coordinates (x,y) given a zoom level, and vice versa.
 *
 * @description
 * Represents a geographic position as a pair of lat, lon values
 *
 * @constructor
 * @param {float} lat The Latitude
 * @param {float} lon The Longitude
 */

deCarta.Core.Position = function(lat, lon){

    this.lat = 0;
    this.lon = 0;
    
    if (lat != null) {
        if (arguments.length == 1){
            if (typeof lat == 'string'){
                var ll = lat.split(",");
                if (ll.length < 2) ll = lat.split(" ");
                this.lat = parseFloat(ll[0]);
                this.lon = parseFloat(ll[1]);
            } else if (typeof lat == 'object' && lat.getLat) {
                this.lat = lat.getLat();
                this.lon = lat.getLon();
            } else {
                deCarta.Core.Exception.raise('Unknown parameter format for Position object');
            }
        } else if (arguments.length == 2){
            // The latitude
            this.lat = lat;
            // The longitude
            this.lon = lon;
        }
    }

    this.xz = [];
    this.yz = [];

    this.xz[21] = deCarta.Utilities.lon2pix(this.lon, 21);
    this.yz[21] = deCarta.Utilities.lat2pix(this.lat, 21);        
}


deCarta.Core.Position.prototype = {

    /**
     * Returns clone of this position
     * @return {deCarta.Core.Position} pos
     */
    clone: function(){
        return new deCarta.Core.Position(this.lat, this.lon);
    },

    /**
     * check equality of location
     * @return {Boolean} equality
     */
    equals: function(another){
        return (this.lat===another.lat && this.lon===another.lon);
    },


    /**
     * Returns the latitude associated with this position
     * @return {float} Latitude
     */
    getLat: function(){
        return parseFloat(this.lat);
    },

    /**
     * Returns the longitude associated with this positon
     * @return {float} Longitude
     */
    getLon: function(){
        return parseFloat(this.lon);
    },

    /**
	 * Returns the horizontal position on the map window of this position, in pixels 
	 * @param {float} zoom Current zoom level (20=maxzoom, 1=minzoom)
     * @return {float} X coordinate of map window for this position
	 */
    getX: function(zoom){
        
        
        if (zoom == Math.round(zoom)){
            if (!this.xz[zoom])
                this.xz[zoom] = deCarta.Utilities.lon2pix(this.lon, zoom);
            return this.xz[zoom];
        } else {
            return this.xz[21] * Math.pow(2, zoom - 21);
        }
        
    },

    /**
	 * Returns the vertical position on the map window of this position, in pixels 
	 * @param {float} zoom Current zoom level (20=maxzoom, 1=minzoom)
     * @return {float} Y coordinate of map window for this position
	 */
    getY: function(zoom){
                
        if (zoom == Math.round(zoom)){
            if (!this.yz[zoom])                
                this.yz[zoom] = deCarta.Utilities.lat2pix(this.lat, zoom);
            return this.yz[zoom];
        } else {
            return this.yz[21] * Math.pow(2, zoom - 21);
        }
        
    },

    /**
     * Sets Lat and Lon from a pixel position and a zoom level
     * @param {int} x X coordinate of the pixel in the map window
     * @param {int} y Y coordinate of the pixel in the map window
     * @param {float} zoom Current zoom level (20=maxzoom, 1=minzoom)
     */
    setXY: function(x, y, zoom){
        if (!zoom) zoom = 21;
        this.lat = deCarta.Utilities.pix2lat(y, zoom);
        this.lon = deCarta.Utilities.pix2lon(x, zoom);        
        
        if (this.lon < -180) this.lon = this.lon + 360;
        if (this.lon > 180) this.lon = this.lon - 360;

        this.yz = [];
        this.xz = [];
        this.xz[21] = deCarta.Utilities.lon2pix(this.lon, 21);
        this.yz[21] = deCarta.Utilities.lat2pix(this.lat, 21);
    },

    /**
     * Returns an object with lat and lon in pixels
	 * @return {object} An object in the format {x: lat, y: lon}
     */
    getPixelPoint: function(z){
        if (!z) z = 21;
        return {
            x: this.getX(z),
            y: this.getY(z)
            };
    },

    /**
     * Returns a string representation of the position
     * @return {string} Space-separated string of the format 'lat lon'
     */
    toString: function(n){
        if (n) return this.lat.toFixed(n) + ' ' + this.lon.toFixed(n);
        return this.lat + " " + this.lon;
    },
    
    /**
     * Returns the N (North) and E (East) params of this position at a specific zoom
     * @param {float} zoom Current zoom level (20=maxzoom, 1=minzoom)
     * return {object} Object with the structure {N: Northing value, E: easting value}
     */
    getTileAtZoom: function(zoom){
        var x = this.getX(zoom);
        var y = this.getY(zoom);
        var tileSize = deCarta.Utilities.tileSizeForZoom(zoom);

        //N and E of center tile on this grid
        var cE = Math.floor(x / tileSize);
        var cN = Math.floor(y / tileSize);

        return {
            N: cN,
            E: cE
        };
    },

    /**
     * @private
	 */
    quantize: function(z){
        this.setXY(Math.round(this.getX(z)), Math.round(this.getY(z)), z);
    },

    /** Get the geohash that represents this position.
     * @param [z] {float} the zoom level (precision) for the geohash. 
     */
    toGeoHash: function(z){
        //z is approximate        
        var precision = (z) ? Math.round((z * 2) / 5) : null;
        return deCarta.Core.GeoHash.encode(this.lat, this.lon, precision);
    },

    fromGeoHash: function(hash){
        var res = deCarta.Core.GeoHash.decode(hash);
        this.lat = res.lat;
        this.lon = res.lon;

        this.xz = [];
        this.yz = [];

        this.xz[21] = deCarta.Utilities.lon2pix(this.lon, 21);
        this.yz[21] = deCarta.Utilities.lat2pix(this.lat, 21);             
    },

    /**
     * @ private
	 */
    toJSON: function(){
        return this.lat + ', ' + this.lon;
    }
}
/**
 * @private
 */
deCarta.Core.Constants = {

    _ll_LUT: {
        'EPSG:3395': [
		"89.787438015348100000,360.00000000000000000",
		"85.084059050110410000,180.00000000000000000",
		"66.653475896509040000,90.000000000000000000",
		"41.170427238429790000,45.000000000000000000",
		"22.076741328793200000,22.500000000000000000",
		"11.251819676168665000,11.250000000000000000",
		"5.653589942659626000,5.625000000000000000",
		"2.830287664051185000,2.812500000000000000",
		"1.415581451872543800,1.406250000000000000",
		"0.707845460801532700,0.703125000000000000",
		"0.353929573271679340,0.351562500000000000",
		"0.176965641673330230,0.175781250000000000",
		"0.088482927761462040,0.087890625000000000",
		"0.044241477246363230,0.043945312500000000",
		"0.022120740293895182,0.021972656250000000",
		"0.011060370355776452,0.010986328125000000",
		"0.005530185203987857,0.005493164062500000",
		"0.002765092605263539,0.002746582031250000",
		"0.001382546303032519,0.001373291015625000",
		"0.000691272945568983,0.000686645507812500",
		"0.000345636472797214,0.000343322753906250"
        ],
        'EPSG:3857':[                
                "85.000000000000000000,180.000000000000000000",
                "85.051128779806600000,180.000000000000000000",
                "66.513260443111850000,90.000000000000000000",
                "40.979898069620130000,45.000000000000000000",
                "21.943045533438180000,22.500000000000000000",
                "11.178401873711785000,11.250000000000000000",
                "5.615985819155340000,5.625000000000000000",
                "2.811371193331140300,2.812500000000000000",
                "1.406108835435159400,1.406250000000000000",
                "0.703107352436490900,0.703125000000000000",
                "0.351560293992270900,0.351562500000000000",
                "0.175780974247085330,0.175781250000000000",
                "0.087890590530824220,0.087890625000000000",
                "0.043945308191358085,0.043945312500000000",
                "0.021972655711432625,0.021972656250000000",
                "0.010986328057681535,0.010986328125000000",
                "0.005493164054094371,0.005493164062500000",
                "0.002746582030202296,0.002746582031250000",
                "0.001373291015495537,0.001373291015625000",
                "0.000686645507798657,0.000686645507812500",
                "0.000343322753905690,0.000343322753906250"
        ]
    },

    TILE_SIZE: 256

}
/**
 * @private
 * @class Global object in the deCarta.Mobile namespace used to trigger exceptions
 * int the api.
 * @description Used in the deCarta Mobile Web api to trigger exceptions
 *
 */

deCarta.Core.Exception = {

    /**
     *
     * Throws a new exception.
     * If vocal exceptions are set in the config, it will also show an alert box.
     */
    raise: function raise(msg){
        var caller = this.getFunctionName(arguments.callee.caller);
        var s = '[' + caller + '] - ' + msg;
        if (deCarta.Core.Configuration.vocalExceptions) alert('Exception: ' + s);
        throw(s);
    },

    /**
     * @private returns the name of a function.
     * @param {function} func the function of which we want to knwo the name
     */
    getFunctionName: function getFunctionName( func ) {

        // Sort out the caller of this function
        // For Mozilla        
        if( func.name ) {
            return func.name;
        }

        // try to parse the function name from the defintion for other browsers
        var definition = func.toString();
        var name = definition.substring(definition.indexOf('function') + 8, definition.indexOf('('));
        if ( name.replace(/ /g, "") ) {
            return name.replace(/ /g, "");
        }

        // We made it here if the function is anonymous
        return "anonymous";
    }

}
/**
 * @class
 * When performing a POI search using the {@link deCarta.Core.POISearch}'s
 * execute() method, the search is performed by specifying a center point and
 * a search radius.
 * This Radius class defines the structure for that search radius, and has 
 * the following structure:
 * <pre>
 *   deCarta.Core.Radius = function(distance, uom){
 *       distance: float, //Radius distance
 *       uom: string //Unit of measure. valid values are : KM (Kilometers), M (Meters), MI (Miles), FT (Feet)
 *   }
 * </pre>
 *
 * @description A radius with distance and unit-of-measure.
 *
 * @constructor
 * @param {float} distance Radius distance
 * @param {string} uom Unit of measure. valid values are : KM (Kilometers), M (Meters), MI (Miles), FT (Feet)
 */
deCarta.Core.Radius = function(distance, uom){

    this.distance = distance;
    this.uom = uom;

}

/**
 * Returns a string representation of the radius, with both
 * distance and unit-of-measure.
 * @return {string} Space separated string in the format "distance uom"
 */
deCarta.Core.Radius.prototype.toString = function(){
    return this.distance+" "+this.uom;
};

/**
 * Localizes a distance by converting it from its current units
 * to either Imperial or Metric units.
 * @param {deCarta.Core.Locale} locale The target locale. If the country for the
 * target locale is 'US' or 'UK', units are converted to Imperial units. Otherwise,
 * units are converted to metric.
 * @return {deCarta.Core.Radius} This radius object, modified to be localized to the target locale
 */
deCarta.Core.Radius.prototype.localize = function(locale){
    if (!locale) deCarta.Core.Exception.raise('Locale is required to localize.');
    
    if (locale.country == 'US' || locale.country == 'UK'){
        this.toImperial();    
    } else {
        this.toMetric();
    }
    return this;
};

/**
 * Returns a string representation of the radius, localized to the target locale.
 * @param {deCarta.Core.Locale} locale The target locale. If the country for the
 * target locale is 'US' or 'UK', units are converted to Imperial units. Otherwise,
 * units are converted to metric.
 * @return {string} Space separated string in the format "distance uom", where the
 * distance and unit of measure have been converted based on locale
 */ 
deCarta.Core.Radius.prototype.toLocalizedString = function(locale){    
    
    return new deCarta.Core.Radius(this.distance, this.uom).localize(locale).toString();
};

/**
 * Adjusts the Radius object to use a better distance / uom combination for the 
 * current values. For example, 1000 meters would be converted to 1 km. 
 * 0.1 miles would be converted to 175 yards. 
 * @return {deCarta.Core.Radius} The modified current Radius, replacing units with better units
 */
deCarta.Core.Radius.prototype.autoFormat = function(){
    
    switch (this.uom){
        case 'KM':
            if (this.distance <= 0.5) {
                this.distance = this.distance.toFixed(1);
                this.uom = 'KM';
            } else {
                this.distance = (this.distance * 1000).toFixed(0);
                this.uom = 'M'
            }            
        break;
        case 'M':
            if (this.distance > 500) {
                this.distance = (this.distance / 1000).toFixed(1);
                this.uom = 'KM';
            } else {
                   this.distance = this.distance.toFixed(0);
                   this.uom = 'M';
            }                      
        break;
        case 'MI':
            if (this.distance < 0.3){
                this.distance = (1760 * this.distance).toFixed(0);
                this.uom = 'YDS';                
            } else {
                this.distance = this.distance.toFixed(1);
                this.uom = 'MI';                
            }
        break;
        case 'FT':
            if (this.distance > 300){
                if (this.distance > 1500){
                    this.distance = (this.distance * 0.000189393939).toFixed(1);
                    this.uom = 'MI';                    
                } else {
                    this.distance = (0.333333333 * this.distance).toFixed(0);
                    this.uom = 'YDS';
                }                
            } else {
                this.distance = this.distance.toFixed(0);
                this.uom = 'FT';                
            }
        break;
    }
    
    return this;
}



/**
 * Return the best zoom level to fit this radius
 * good for use with geolocation API
 * @param {deCarta.Core.Position} pos
 * @param {int} x view port width
 * @param {int} y view port height
 * @return {int} zoom value
 */
deCarta.Core.Radius.prototype.getZoom = function(pos, x, y){
    var degs = this.getDegrees();
    var min = new deCarta.Core.Position(pos.lat-degs,pos.lon-degs);
    var max = new deCarta.Core.Position(pos.lat+degs,pos.lon+degs);
    return new deCarta.Core.BoundingBox([min,max]).getIdealCenterAndZoom(x,y).zoom;
}


/**
 * @private
 */
deCarta.Core.Radius.prototype.getDegrees = function(){
    if(this.uom=="KM"){
        return this.distance/111.111;
    }else if(this.uom=="M"){
        return (this.distance/1000)/111.111;
    }else if(this.uom=="MI"){
        return (this.distance*1.609)/111.111;
    }else if(this.uom=="FT"){
        return ((this.distance/3.28)/1000)/111.111;
    }
    return 0;
}

/**
 * @private
 */
deCarta.Core.Radius.prototype.toMetric = function(){
    if (this.uom == 'KM' || this.uom == 'M') return;
    if (this.uom == 'MI'){
        this.distance *= 1.609344;
        this.uom = 'KM';
    }
    if (this.uom == 'FT'){
        this.distance *= 0.3048;
        this.uom = 'M';
    }
    return this;
}

/**
 * @private
 */
deCarta.Core.Radius.prototype.toImperial = function(){
    if (this.uom == 'MI' || this.uom == 'FT') return;
    if (this.uom == 'KM'){
        this.distance *= 0.621371192;
        this.uom = 'MI';
    }
    if (this.uom == 'M'){
        this.distance *= 3.2808399;
        this.uom = 'FT';
    }
    return this;
}

/**
 * Return the radius distance in miles
 * @return {float} Radius value, in miles
 */
deCarta.Core.Radius.prototype.getMiles = function(){
    switch (this.uom){
        case 'KM':
            return this.distance * 0.621371192;
        break;
        case 'M':
            return (this.distance / 1000) * 0.621371192;
        break;
        case 'MI':
            return this.distance;
        break;
        case 'FT':
            return this.distance * 0.000189393939;
        break;
        default:
            deCarta.Core.Exception.raise('Unknown UOM : ' + this.uom);
        break;
    }
}
/**
 * Return the radius distance in KM
 * @return {float} Radius value, in kilometers
 */
deCarta.Core.Radius.prototype.getKm = function(){
    switch (this.uom){
        case 'KM':
            return this.distance;
        break;
        case 'M':
            return (this.distance / 1000);
        break;
        case 'MI':
            return this.distance * 1.609344;
        break;
        case 'FT':
            return this.distance * 0.0003048;
        break;
        default:
            deCarta.Core.Exception.raise('Unknown UOM : ' + this.uom);
        break;
    }
}

/**
 * @class 
 * 
 * The Distance class describes a distance value.
 * This is simply an alias to {@link deCarta.Core.Radius}
 *
 * @description Distance (value and unit of measure)
 *
 * @see deCarta.Core.Radius
 *
 **/

deCarta.Core.Distance = deCarta.Core.Radius;
/**
 * @class
 * A Locale object represents a specific geographical, political, or
 * cultural region. An operation that requires a Locale to perform its task is
 * called locale-sensitive and uses the Locale to tailor information for the
 * user. Currently, Locales can be attached to a {@link deCarta.Core.FreeFormAddress} object
 * to aid in producing better results with a {@link deCarta.Core.Geocoder}:geocode().
 * <p>These pairs of language can be used to create a valid locale for use with
 * the Geocoder.</p>
 *
 * @description A language, country pair for localization
 *
 * @constructor
 * @param {String} language required A valid ISO Language Code. It is always an
 * upper case, two letter string.
 * @param {String} country required A valid ISO Country Code. It is always an
 * upper case, two letter string.
 *
 * For a list of country codes, please see: http://www.iso.org/iso/country_codes/iso_3166_code_lists/country_names_and_code_elements.htm
 * For a list of language codes, please see: http://www.loc.gov/standards/iso639-2/php/English_list.php
 *
 * @see deCarta.Core.FreeFormAddress
 * @see deCarta.Core.Geocoder
 */  
deCarta.Core.Locale = function( language, country ) {  
    /**
     * A valid ISO Language Code. It is always an upper case, two letter string.
     * See the class description for valid language and country code pairs.
     * @private
     * @type String
     */
    this.language = language.toUpperCase();
    /**
     * A valid ISO Country Code. It is always an upper case, two letter string.
     * @private
     * @type String
     */
    this.country = country.toUpperCase();
} // End Locale constructor



deCarta.Core.Locale.prototype = {
    /**
     * Retrieve the ISO Language Code for this locale
     * @return {String} language field of the Locale object
     */
    getLanguage: function() {
        return this.language;
    },

    /**
     * Set the ISO Language Code for this locale.
     * @param {String} language required A valid ISO Language Code. It is always an
     * upper case, two letter string. 
     */
    setLanguage: function(language) {
        this.language = language.toUpperCase();
    },

    /**
     * Retrieve the ISO Country Code for this locale
     * @return {String} country field of the Locale object
     */
    getCountry: function() {
        return this.country;
    },

    /**
     * Set the ISO Country Code for this locale.
     * @param {String} country required country required A valid ISO Country Code.
     * It is always an upper case, two letter string. 
     */
    setCountry: function(country) {
        this.country = country.toUpperCase();
    },

    /**
     * Concatenates the country and language fields, in that order and returns
     * that string.
     * @return {String} The Locale object as a single, underbar delimited string, ex: "en_US".
     */
    toString: function() {
        return  this.language  + "_" +  this.country;
    }
};

window.encodeURIComponentUTF8 = function(F){
        F=F+"";
        var K="0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-_.~";
        var C="!*'();:@&=+$,/?%#[]";
        var I=K+C;
        var H="0123456789ABCDEFabcdef";
        function J(L){
            return "%"+H.charAt(L>>4)+H.charAt(L&15);
        }
        var D="";
        for(var E=0;E<F.length;E++){
            var B=F.charAt(E);
            if(K.indexOf(B)!=-1){
                D=D+B;
            }else{
                var G=F.charCodeAt(E);if(G<128){
                    D=D+J(G);
                }if(G>127&&G<2048){
                    D=D+J((G>>6)|192);D=D+J((G&63)|128);
                }if(G>2047&&G<65536){
                    D=D+J((G>>12)|224);D=D+J(((G>>6)&63)|128);D=D+J((G&63)|128);
                }if(G>65535){
                    D=D+J((G>>18)|240);D=D+J(((G>>12)&63)|128);D=D+J(((G>>6)&63)|128);D=D+J((G&63)|128);
                }
            }
        }
        return D;
    }

/**
 * @private
 * Performs JS Request to DDW Web Services APIs.
 *
 * This class is for advanced users, and is used to communicate directly with deCarta DDS Web Services
 * through XML requests. Just use .send(xml, onSuccess, onFail) with the desired XML 
 * and success / fail callbacks. 
 *
 * Requests are performed using Dynamic Script Tag mode.
 * @description
 * The deCarta JavaScript API communicates with the DDS Web Services via
 * XML-over-HTTP requests. Browser "domain of origin" security prevents any
 * JavaScript library (including the deCartaMobile.js library) from being
 * downloaded from one domain and used to send queries to a different domain.
 * Since most AJAX applications require accessing services from more than one
 * domain, there are two main methods used to work around the domain of origin
 * security. One method requires implementation of a proxy on the server to
 * redirect queries from the client to the DDS Web Services. The second, method
 * involves wrapping the XML sent to the DDS Web Services in a set of dynamic
 * script tags, and sending the XML over as a JSON request.
 *
 * The second method is simpler to use out of the box because it is directly
 * supported via the JSRequest object.
 *
 * @description Performs JS Request to DDW Web Services APIs.
 *
 */
deCarta.Core.JSRequest = {

    callbacks: {},
    timeouts: {},    
    interceptors: {
        DirectoryResponse: [],
        RUOKResponse: [],
        DetermineRouteResponse: [],
        ReverseGeocodeResponse: [],
        GeocodeResponse: []
    },
    sessionId: Math.ceil((new Date().getTime()) * Math.random()),
    requestId: null,
    /**
     * This initializes the JSRequest object and
     * Performs the necessary authentication with DDS Web Services.
     */
    init: function(onInit){
        if (typeof onInit !== 'function'){
            deCarta.Core.Exception.raise('JSRequest.init needs a callback parameter');
        }
        var xmlRequest =
        "       <xls:Request version='1.0' requestID='1675192' methodName='RuokRequest'>" +
        "             <xls:RUOKRequest />" +
        "       </xls:Request>";

        var start = new Date().getTime();
        var proto = deCarta.Core.Configuration.url.split(":")[0];

        this.send(xmlRequest, function(res){
            var time = (new Date().getTime())-start;
            try {
                if (typeof res.XLS.ResponseHeader.ErrorList === 'object'){
                    onInit( {
                        success:false,
                        msg:res.XLS.ResponseHeader.ErrorList.Error.message,
                        exTime:time
                    })
                } else if (typeof res.XLS.Response.RUOKResponse === 'object'){
                    if (res.XLS.Response.RUOKResponse.urlFormats){                                                
                        if (deCarta.Core.Configuration.urlVersion == null || 
                            deCarta.Core.Configuration.urlVersion == 'auto'){

                                var versions = res.XLS.Response.RUOKResponse.urlFormats.split('|');
                                var maxV = 1;
                                for (var i = 0; i < versions.length; i++){
                                    maxV = Math.max(maxV,parseFloat(versions[i].match(/\d/g)));                                    
                                }

                                deCarta.Core.Configuration.urlVersion = maxV;
                            }
                    }
                    
                    deCarta.Core.Configuration.url = proto + '://' + res.XLS.Response.RUOKResponse.hostName + '/openls/JSON';
                    var maxHostAliases = res.XLS.Response.RUOKResponse.maxHostAliases ? parseInt(res.XLS.Response.RUOKResponse.maxHostAliases) : 0;
                    deCarta.Core.Configuration.streetTileHosts=[];
                    if(maxHostAliases){ 
                        for( var i=1;i<=maxHostAliases; i++){
                            var alias = proto + '://' +res.XLS.Response.RUOKResponse.hostName.replace(/\./,"-0"+i+".");
                            deCarta.Core.Configuration.streetTileHosts.push(alias);
                        }
                    } else {
                        deCarta.Core.Configuration.streetTileHosts.push('http://' +res.XLS.Response.RUOKResponse.hostName);
                    }
                    // all is good!  party time...
                    onInit( {
                        success:true,
                        msg : "ok",
                        exTime: time
                    } );
                } 
            } catch (e) {
                onInit({
                    success:false,
                    msg:e.message,
                    exTime : time
                })
            }
        }.bind(this),
            function()  {
                var time = (new Date().getTime())-start;
                onInit({
                    success:false,
                    msg:"connection timeout",
                    exTime : time
                })
            }.bind(this));

    },

    /**
     * Send an XML request to DDS Web Services
     * @param {string} xml the XML to be sent to the server
     * @param {function} onSuccess the callback function that will receive the
     * results of the xml request
     * @param {function} onFailure the callback function that will be invoked in
     * the event of a failure.
     * @param {bool} getRaw: skips all interceptors. Good for back compat. 
     */
    send: function(xml, onSuccess, onFailure, getRaw){

        //generate id
        var reqId = Math.ceil((new Date().getTime()) * Math.random());
        var elId = "deCarta-mob-req-" + reqId;
        var regEx = /requestID=[\'\"]([0-9]+)[\'\"]/;
        xml = xml.replace(regEx, 'requestID="' + reqId + '"');
        
        if(deCarta.Core.Configuration.consolelogXML){
            console.log(this.getRequestHeader() + xml + this.getRequestFooter());
        }
        var data  = encodeURIComponentUTF8(this.getRequestHeader() + xml + this.getRequestFooter());

        this.callbacks[reqId] = function(response){
            if(deCarta.Core.Configuration.consolelogXML){
                try{
                    console.log(response);
                } catch(e){}
            }
            var el = deCarta.geId(elId);
            clearTimeout(this.timeouts[reqId]);

            if (!getRaw){

                for (var type in response.response.XLS.Response){
                    if (this.interceptors[type])
                    for (var i = 0; i < this.interceptors[type].length; i++){
                        if (typeof this.interceptors[type][i] === 'function') 
                            response.response = this.interceptors[type][i](response.response);
                    }
                }

            }            

            if(el){
                el.parentNode.removeChild(el);
                //deCarta.Core.timeLog({type: "jsRequest Complete", requestId: elId});
                onSuccess(response.response);
            }
        }.bind(this);

        this.timeouts[reqId] = setTimeout(function(elId){
            this.cancel(elId);
            //deCarta.Core.timeLog({type: "jsRequest Timeout", requestId: elId});
            if (typeof onFailure == 'function') onFailure({
                'err': 'timeout'
            });
        }.bind(this, elId, onFailure), deCarta.Core.Configuration.requestTimeout);

        var url = deCarta.Core.Configuration.url +
        '?reqID=' + reqId +
        '&chunkNo=1&numChunks=1' +
        '&callback=window.deCarta.Core.JSRequest.callbacks[' + reqId + ']'+
        '&data=' + data +
        '&responseFormat=JSON';
        var sTag = deCarta.crEl('script');
        sTag.id  = elId;
        sTag.src = url;

        //deCarta.Core.timeLog({type: "jsRequest", url: url, requestId: elId});

        document.body.appendChild(sTag);
        return elId;
    },
    
    /**
     * @private
     */
    getRequestHeader: function(){

        var header = '<?xml version="1.0"?>' +
        '<xls:XLS version="1" xls:lang="en" xmlns:xls="http://www.opengis.net/xls" rel="' +deCarta.Core.Configuration.apiVersion+'" xmlns:gml="http://www.opengis.net/gml">' +
        '<xls:RequestHeader clientName="' +deCarta.Core.Configuration.clientName+
        '" sessionID="' + this.sessionId +
        '" clientAPI="mobilejs'+
        '" clientPassword="'+deCarta.Core.Configuration.clientPassword+
        '" configuration="' + deCarta.Core.Configuration.defaultConfig +
        '"/>';
        return header;
    },

    /**
     * @private
     */
    getRequestFooter: function(){
        var footer = "</xls:XLS>";
        return footer;
    },

    /**
     * cancel request by ID
     * @return {boolean} result of cancelation attempt (true if canceled, false if response already processed)
     */
    cancel:function(elId){
        if(deCarta.geId(elId)){
            var el = deCarta.geId(elId);
            el.src=null;
            el.parentNode.removeChild(el);
            return true;
        } else {
            return false;
        }
    },

    addInterceptor: function(type, interceptor){
        if (!this.interceptors[type]) deCarta.Core.Exception.raise('Interceptor type '+type+' not supported');
        var id = this.interceptors[type].length;
        this.interceptors[type].push(interceptor);
        return type + "-" + id;
    },

    removeInterceptor: function(type, interceptor){
        if (!this.interceptors[type]) deCarta.Core.Exception.raise('Interceptor type '+type+' not supported');
        for (var i = 0 ; i < this.interceptors[type].length; i++){
            if (this.interceptors[type][i] == interceptor){
                this.interceptors[type][i] = null;
                return;
            }
        }
    },

    removeInterceptorById: function(id){
        var id = id.split('-');
        this.interceptors[id[0]][id[1]] = null;
        return;
    }

}



/**
 * @class
 * The POISearch class is a static object which provides a single
 * {@link #execute} method for searching for a point of interest using
 * the deCarta DDS Web Services.
 *
 * @description Static class for performing POI search
 */

deCarta.Core.POISearch = {

    /**
     * @private
     */
    getXML: function(criteria){
        /* Example XML
         *
         *
        <?xml version="1.0"?>
        <xls:XLS xmlns:xls="http://www.opengis.net/xls" xmlns:gml="http://www.opengis.net/gml" version="1" xls:lang="en" rel="4.5.1.sp02">
          <xls:RequestHeader clientName="client_name" sessionID="8285826" clientPassword="client_password" configuration="global-decarta"/>
          <xls:Request maximumResponses="20" version="1.0" requestID="9132342" methodName="DirectoryRequest">
            <xls:DirectoryRequest database="search:decarta:tmo" sortDirection="Ascending" rankCriteria="Score">
              <xls:POILocation>
                <xls:WithinDistance>
                  <xls:POI ID="1">
                    <gml:Point>
                      <gml:pos>37.774053 -122.421398</gml:pos>
                    </gml:Point>
                  </xls:POI>
                  <xls:MinimumDistance value="0" uom="KM"/>
                  <xls:MaximumDistance value="1.9613978800000003" uom="KM"/>
                </xls:WithinDistance>
              </xls:POILocation>
              <xls:POIProperties>
                <xls:POIProperty value="foobar" name="POIName"/>
              </xls:POIProperties>
            </xls:DirectoryRequest>
          </xls:Request>
        </xls:XLS>
         **/


        var database = 'database="' + criteria.database + '"';
        var sortDirection = (criteria.sortDirection) ? 'sortDirection="' + criteria.sortDirection + '"' : '';
        var rankCriteria = (criteria.rankCriteria) ? 'rankCriteria="' + criteria.rankCriteria + '"' : '';

        var searchXml = '';

        // backwards compatibility mode - if routeID is on top level (as was in v2)
        // push it into the new corridorParams holder
        if(criteria.routeId){
          criteria.corridorParams.routeId=criteria.routeId;
        }

        if (criteria.corridorParams.routeId){
            //corridor search
            searchXml += "<xls:NearRoute>";
            if(criteria.corridorParams.measure==="distance"){
                searchXml += "<xls:distance value='"+criteria.corridorParams.measureValue+"' uom='M'/>";
            } else if(criteria.corridorParams.measure==="euclideanDistance"){
                searchXml += "<xls:euclideanDistance value='"+criteria.corridorParams.measureValue+"' uom='M'/>";
            } else {
                // TODO need to build in better
                searchXml += "<xls:drivetime>P0DT"+Math.floor(criteria.corridorParams.measureValue/60)+"H"+(criteria.corridorParams.measureValue%60)+"M0S</xls:drivetime>";
            }
            searchXml += "<xls:RouteID>"+criteria.corridorParams.routeId+"</xls:RouteID>";
            searchXml += "</xls:NearRoute>";
        } else {
            //regular search
            searchXml = '<xls:WithinDistance>' +
              '<xls:POI ID="1">' +
                '<gml:Point>' +
                  '<gml:pos>' + criteria.position.lat+ ' ' +criteria.position.lon + '</gml:pos>' +
                '</gml:Point>' +
              '</xls:POI>' +
              '<xls:MinimumDistance value="0" uom="KM"/>' +
              '<xls:MaximumDistance value="' + criteria.radius.distance + '" uom="' + criteria.radius.uom + '"/>' +
            '</xls:WithinDistance>'
        }
        
        var top =
              '<xls:Request maximumResponses=\'' + criteria.maximumResponses+ '\' version="1.0" requestID="0123456" methodName="DirectoryRequest">' +
                  '<xls:DirectoryRequest ' + database + ' ' +  sortDirection + ' ' + rankCriteria + '>' +
                  '<xls:POILocation>' +
                    searchXml+
                  '</xls:POILocation>' +
                  '<xls:POIProperties>';
       var bottom = 
                   '</xls:POIProperties>' +
                '</xls:DirectoryRequest>' +
              '</xls:Request>';
        var xml='';

        var crits = deCarta.Utilities.makeArrayFix(criteria.properties);
        for(var i=0;i<crits.length;i++){
            for (var name in crits[i]){                
                if (typeof crits[i][name] == 'object'){
                    var s = ' ';
                    for (var prop in crits[i][name]){
                        s += prop + '="' + crits[i][name][prop] + '" ';                        
                    }
                    xml += top + '<xls:POIProperty name="' + name + '" '+ s +' />'+bottom;
                } else {
                    xml+= top+'<xls:POIProperty value="' + crits[i][name] + '" name="' + name + '"/>'+bottom;
                }
            }
        }

        return xml;
    },

    /**
     * Executes a POI search with the requested criteria
     * @param {deCarta.Core.SearchCriteria} Search criteria to be used for the
	 * search. This can be either an instance of a {@link deCarta.Core.SearchCriteria},
	 * or an inline object with the same structure, as follows:
     * <pre>
     *  SearchCriteriaObject: {
     *      queryString: null, //[Not yet defined]
     *      maximumResponses: int, //Max number of responses that will be returned
     *      database: string, //Database that will be queried for this search
     *      sortDirection: string, //Sort order for results ["Ascending", "descending"]
     *      sortCriteria: string, //Property results will be sorted by ["Distance", "Score"]
     *      rankCriteria: string, //Property by which results will be ranked [Distance, Score]
     *      allowAggregates: bool, //Allow Aggregates
     *      retrieveAll: bool, //retreive all values
     *      properties: { //Object describing search properties, contains ONE OF:
     *          CATEGORY: string, //If present, this will perform a category search on this value
     *      	KEYWORD: string, //If present, this will perform a Keyword search on this value
     *      	POIName: string //If present, this will perform a freeform POI Search on this value
     *      }
     *      position: deCarta.Core.Position, //Position where the search is centered
     *      radius: deCarta.Core.Radius, //Radius of the search
     *      routeId: int, //if routeId is set, the search will be performed along the route. 
     *      corridorType: //[Not yet defined]
     *      map: deCarta.Core.Map //Optionally pass Map instead of position+radius
     * </pre>
     * @param {function} callback Function that will be called when the POI search
	 *   response is received from the DDS Web Service.

     * @param {function} callback A user defined function that will receive
     * the respose to the query from the DDS Web Service. <br />
     * Function signature: <br />
     * function poiSearchResponseCallback(resultArray)<br />
	 * The callback function is passed a single object, which is an array of 
	 * objects, with each object in the array having the following
	 * structure:
     * <pre>
     *     
  {
    "ID":"search:decarta:nt:1001042664-US",
    "name":"Extreme Pizza",
    "position":deCarta.Core.Position,
    "address":{
      "locale":deCarta.Core.Locale,
      "buildingNumber": int,
      "landmark": string,
      "street": string,
      "streetNameAndNumber": string,
      "speedLimit": string,
      "countryCode": string,
      "countrySubdivision": string,
      "countrySecondarySubdivision": string,
      "countryTertiarySubdivision": string,
      "municipality": string,
      "postalCode": string,
      "municipalitySubdivision": string,
      "type": string,
      "freeFormAddress": string
    },
    "phoneNumber": string,
    "distance":deCarta.Core.Distance,
    "categories":[
      "restaurant",
      "pizza"
    ]
  }
     * </pre>
     * @return {int} requestId which can be used to canceling long running requests
     */
    execute: function(criteria, callback, getRaw){
        
        var defaults = new deCarta.Core.SearchCriteria();
        criteria = deCarta.Utilities.extendObject(defaults, criteria);

        if(!callback) deCarta.Core.Exception.raise('You need to provide a search callback, or you will never know what was found');
        if (criteria.map){
            criteria.position = criteria.map.getCenter();
            if(!criteria.radiusOverride)
                criteria.radius = criteria.map.getRadius();
//            delete criteria.map;
        }

        if (! (criteria.position || criteria.corridorParams.routeId) ){
            deCarta.Core.Exception.raise('A position or routeId is required to search. Please provide one in the search criteria');
        }
//        if (!criteria.properties.POIName && !criteria.properties.CATEGORY){
//            deCarta.Core.Exception.raise('Can\'t search : Provide either a search term or a category');
//        }

        return deCarta.Core.JSRequest.send(this.getXML(criteria), this.handleResponse.bind(this,callback), this.handleFailure.bind(this, callback), getRaw);

    },
    
	/**
	 * @private
	 */
    handleResponse: function(callback, response){        
        var poiContextObject;
        // multi
        try {
            if (deCarta.Utilities.isArray(response)){
                callback(response);
                return; 
            }
            if(deCarta.Utilities.isArray(response.XLS.Response)){

                var pois = [];
                for(var i=0;i<response.XLS.Response.length;i++){
                    poiContextObject = response.XLS.Response[i].DirectoryResponse.POIContext;
                    if(poiContextObject){
                        var poiContext = deCarta.Utilities.makeArrayFix(poiContextObject);
                        pois = pois.concat(poiContext);
                    }
                }
                callback(pois);
            } else { // single
                poiContextObject = response.XLS.Response.DirectoryResponse.POIContext;
                if(poiContextObject){
                    callback( deCarta.Utilities.makeArrayFix(response.XLS.Response.DirectoryResponse.POIContext));
                } else {
                    callback([]);
                }
            }            
            callback(response);
        } catch (e){
            
            callback([], {message: e.message, param: response});
            //deCarta.Core.Exception.raise('Error executing search: ' + e.message);
        }
    },

    /**
	 * @private
	 */
    handleFailure: function(callback, param){
        //deCarta.Core.Exception.raise('Error executing search: Timeout');
        callback([], {param: param, message: 'Error executing search'});
    },

    responseInterceptor: function(response){
        
        var pois = [];

        if(deCarta.Utilities.isArray(response.XLS.Response)){                
                for(var i=0;i<response.XLS.Response.length;i++){
                    poiContextObject = response.XLS.Response[i].DirectoryResponse.POIContext;
                    if(poiContextObject){
                        var poiContext = deCarta.Utilities.makeArrayFix(poiContextObject);
                        pois = pois.concat(poiContext);
                    }
                }                        
        } else { // single
                poiContextObject = response.XLS.Response.DirectoryResponse.POIContext;
                if(poiContextObject){
                    pois = deCarta.Utilities.makeArrayFix(response.XLS.Response.DirectoryResponse.POIContext);
                } else {
                    pois = [];
                }
        }

        var ret = [];
        //Found all POIs. Now format them...
        for (var i = 0; i < pois.length; i ++){
                var obj = {};
                var poi = pois[i];                                        
                obj.ID = poi.POI.ID;
                obj.name = poi.POI.POIName;
                obj.position = new deCarta.Core.Position(poi.POI.Point.pos);
                obj.address = {};//poi.POI.Address;
                obj.phoneNumber = poi.POI.phoneNumber;
                if(poi.Distance){
                  if(poi.Distance.length){
                    obj.distance = {
                      onRoute : new deCarta.Core.Distance(poi.Distance[0].value, poi.Distance[0].uom),
                      offRoute : new deCarta.Core.Distance(poi.Distance[1].value, poi.Distance[1].uom)
                    }                    
                  } else {
                    obj.distance = new deCarta.Core.Distance(poi.Distance.value, poi.Distance.uom);
                  }

                }else if(poi.Duration){
                    obj.duration = {
                      onRoute : {time : poi.Duration[0].content},
                      offRoute : {time : poi.Duration[1].content}
                    }
                }                
                var addr = new deCarta.Core.StructuredAddress();
                addr.fromWSResponse(poi.POI.Address);
                obj.address = addr;
                //now the categories ...
                for (var j = 0; j < poi.POI.POIAttributeList.POIInfoList.POIInfo.length; j++){
                        var name = poi.POI.POIAttributeList.POIInfoList.POIInfo[j].name;
                        var value = poi.POI.POIAttributeList.POIInfoList.POIInfo[j].value;
                        var test = name.split('-');
                        if (test[0] == 'category'){
                                if (!obj.categories) obj.categories = [];
                                if (obj.categories.indexOf(value.toLowerCase())) obj.categories.push(value.toLowerCase());
                        } 
                }
                ret.push(obj);
        }                

        return ret;
    }

}

deCarta.Core.JSRequest.addInterceptor('DirectoryResponse', deCarta.Core.POISearch.responseInterceptor);
/**
 *  @class The Geocoder object is a static object that provides an interface
 * to execute Geocoding and Reverse Geocoding using deCarta's WebServices API.
 *  @description
 *  The Geocoder object has two specific functions:
 *  <ul>
 *    <li>{@link #geocode} - Used to perform
 *  geocoding (the translation of an address into a latitude and longitude
 *  coordinate)</li>
 *    <li>{@link #reverseGeocode} - Used to translate a
 *  latitude and longitude coordinate into an approximate address.</li>
 *  </ul>
 *
 * @description Static 
 *
 * @see deCarta.Core.FreeFormAddress
 * @see deCarta.Core.StructuredAddress
 */

deCarta.Core.Geocoder = {

    /**
     * @private
     * Get XML for a geocoding request
     */
    getGeocodeXML: function(address){


        if (address.type == 'freeForm'){
            var xml =
                '      <xls:Request maximumResponses="10" version="1.0" requestID="9132342" methodName="GeocodeRequest">' +
                '            <xls:GeocodeRequest returnFreeForm="false">' +
                                  address.toXML() +
                '            </xls:GeocodeRequest>' +
                '      </xls:Request>';

            

        } else {
            var xml =
            "      <xls:Request maximumResponses='10' version='1.0' requestID='4387206' methodName='GeocodeRequest'>"+
            "            <xls:GeocodeRequest returnFreeForm='false'>"+
            "                  <xls:Address countryCode='"+address.locale.country+"' language='"+address.locale.language+"'>";
        if (address.buildingNumber || address.street){
            xml +=  "           <xls:StreetAddress>" +
            "                              <xls:Building number='"+address.buildingNumber+"'/>"+
            "                              <xls:Street>"+address.street+"</xls:Street>" +
            "                        </xls:StreetAddress>";
        }

        if (address.municipality)  xml +=   "                        <xls:Place type='Municipality'>"+address.municipality+"</xls:Place>";
        if (address.municipalitySubdivision)  xml +=   "                        <xls:Place type='MunicipalitySubdivision'>"+address.municipalitySubdivision+"</xls:Place>";
        if (address.countrySubdivision)  xml +=    "                        <xls:Place type='CountrySubdivision'>"+address.countrySubdivision+"</xls:Place>";
        if (address.countrySecondarySubdivision)  xml +=    "                        <xls:Place type='CountrySecondarySubdivision'>"+address.countrySecondarySubdivision+"</xls:Place>";
        if (address.countryTertiarySubdivision)  xml +=    "                        <xls:Place type='CountryTertiarySubdivision'>"+address.countryTertiarySubdivision+"</xls:Place>";
        if (address.postalCode)  xml +=    "                        <xls:PostalCode>"+address.postalCode+"</xls:PostalCode>";

        xml += "                  </xls:Address>"+
            "            </xls:GeocodeRequest>"+
            "      </xls:Request>";
        }

        return xml;
/*
Free form


<xls:XLS version="1" xls:lang="en" xmlns:xls="http://www.opengis.net/xls" rel="4.5.1.sp02" xmlns:gml="http://www.opengis.net/gml">
      <xls:RequestHeader clientName="client_name" sessionID="8285826" clientPassword="client_password" />
      <xls:Request maximumResponses="10" version="1.0" requestID="9132342" methodName="DirectoryRequest">
            <xls:GeocodeRequest returnFreeForm="false">
                  <xls:Address countryCode="US" language="EN">
                        <xls:freeFormAddress>409 tilton ave san mateo</xls:freeFormAddress>
                  </xls:Address>
            </xls:GeocodeRequest>
      </xls:Request>
</xls:XLS>


Structured:

<xls:XLS version='1' xls:lang='en' xmlns:xls='http://www.opengis.net/xls' rel='4.5.1.sp02' xmlns:gml='http://www.opengis.net/gml'>
      <xls:RequestHeader clientName='client_name' sessionID='1380293' clientPassword='client_password' configuration='global-decarta'/>
      <xls:Request maximumResponses='10' version='1.0' requestID='4387206' methodName='GeocodeRequest'>
            <xls:GeocodeRequest returnFreeForm='false'>
                  <xls:Address countryCode='US' language='EN'>
                        <xls:StreetAddress>
                              <xls:Building number='409'/>
                              <xls:Street>Tilton</xls:Street>
                        </xls:StreetAddress>
                        <xls:Place type='Municipality'>san mateo</xls:Place>
                        <xls:PostalCode>94401</xls:PostalCode>
                  </xls:Address>
            </xls:GeocodeRequest>
      </xls:Request>
</xls:XLS>

*/

    },

    /**
     * @private
     * Get XML for a rev gecoding request
     */
    getRevGeocodeXML: function(pos, preference){
/*
 <xls:XLS version='1' xls:lang='en' xmlns:xls='http://www.opengis.net/xls' rel='4.5.1.sp02' xmlns:gml='http://www.opengis.net/gml'>
      <xls:RequestHeader clientName='client_name' sessionID='4212349' clientPassword='client_password' configuration='global-decarta'/>
      <xls:Request maximumResponses='10' version='1.0' requestID='5314108' methodName='ReverseGeocodeRequest'>
            <xls:ReverseGeocodeRequest>
                  <xls:Position>
                        <gml:Point>
                              <gml:pos>37.5 -112.5</gml:pos>
                        </gml:Point>
                  </xls:Position>
                  <xls:ReverseGeocodePreference>StreetAddress</xls:ReverseGeocodePreference>
            </xls:ReverseGeocodeRequest>
      </xls:Request>
</xls:XLS>
 */
        preference = preference || 'StreetAddress';
        var xml = 
         "<xls:Request maximumResponses='10' version='1.0' requestID='0123456789' methodName='ReverseGeocodeRequest'>" +
                "<xls:ReverseGeocodeRequest>" +
                      "<xls:Position>"+
                            "<gml:Point>"+
                                  "<gml:pos>" + pos.getLat()  + " " + pos.getLon() + "</gml:pos>"+
                            "</gml:Point>"+
                      "</xls:Position>"+
                      "<xls:ReverseGeocodePreference>"+preference+"</xls:ReverseGeocodePreference>"+
                "</xls:ReverseGeocodeRequest>"+
          "</xls:Request>";

         return xml;

    },
	
    /**
     * Translate an address into a list of Positions (latitude and
	 * longitude coordinates).
     * Since user input may often be incomplete, it is important to be able to
     * accept the multiple matches that can be returned from a geocode request.
     * Geocoding is an asynchronous request made to the DDS Web Services, and thus
     * requires a callBack function to catch the returned results.
     * The application should provide a callBack function that has the following prototype:
     * <pre>
     * function geocodeCallBack(results)
     * </pre>
     * Where <pre>results</pre> is an array, with each element of the array
	 * having the following structure:
	 * 
     * <pre>
{
  "Address": deCarta.Core.StructuredAddress,
  "Position": deCarta.Core.Position,
  "matchType": "string",
  "accuracy": float
}
     * </pre>
     *
     * @param {Address} address StructuredAddress or FreeFormAddress to be geocoded
	 * <p><strong>Note:</strong> This can be EITHER an instance of a
	 * {@link deCarta.Core.StructuredAddress} or
	 * {@link deCarta.Core.FreeFormAddress} class OR an equivalent structure
	 * created as an inline object.</p>
	 * <p>An inline StructuredAddress can be implemented by defining an inline object with one or more of these fields:</p>
	 * <ul>
     * <li>buildingNumber: (optional) Address number for this location.</li>
	 *   <li>countryCode: Country, formatted as ISO 3166-1 alpha-2 (2 digit) country code. 
	 *       See http://developer.decarta.com/docs/read/bada_api/Features for supported countries.</li>
     *   <li>countrySecondarySubdivision: (optional) County (or equivalent)
     *       for this location.</li>
     *   <li>countrySubdivision: (optional) Sub-country administrative
     *       division (ie the state, province, or region) for this location.</li>
	 *   <li>countryTertiarySubdivision: (optional) Additional subdivision (when relevant)</li>
	 *   <li>landmark</li>
	 *   <li>locale: Language, formatted as ISO 639 Language code.
	 *       See http://developer.decarta.com/docs/read/bada_api/Features for supported languages.</li>
     *   <li>municipality: (optional) City, town, village, or equivalent for
     *       this location.</li>
     *   <li>municipalitySubdivision: (optional) Recognized neighborhood,
     *       borough, or equivalent for this location.</li>
     *   <li>postalCode: (optional) Postal code, postcode, ZIP code, or
     *        equivalent numerical code for this location.</li>
	 *   <li>speedLimit: [Not currently documented]</li>
     *   <li>street: (optional) Name and designation of the street (ie Main
     *       St) for this location.</li>
	 *   <li>streetNameAndNumber: [Not currently documented]</li>
	 *   <li>type: Must be set to 'structured' to create an inline structured address object</li>
	 * </ul>
     *
	 * <p>An inline FreeFormAddress can be implemented by defining these fields:</p>
	 * <ul>
	 *   <li>(string) address: The free-form address</li>
	 *   <li>locale: Language, formatted as ISO 639 Language code.
	 *       See http://developer.decarta.com/docs/read/bada_api/Features for supported languages.</li>
	 *   <li>type: Must be set to 'freeForm' to create an inline Free Form address object</li>
	 * </ul>
     * <br />
     * @param {function} callback The callback function that will receive the results of the geocode operation
     * @throws {Exception} Invalid or missing address object passed as parameter
     * @throws {Exception} Invalid or missing callback function
     */
    geocode: function(address, callback){
        if (!address.type || !(address.type in {'freeForm': true, 'structured': true})) {
            deCarta.Core.Exception.raise('When using the geocode function, the first parameter must be an address object');
        }
        if (typeof callback !== 'function'){
            deCarta.Core.Exception.raise('When using the geocode function, the second parameter must be a callback function');
        }

        deCarta.Core.JSRequest.send(this.getGeocodeXML(address), this.handleResponse.bind(this, callback), this.handleFailure.bind(this, callback));

    },


    /**
     * Translate a Position (latitude, longitude coordinate) into an Address.
     * Reverse geocodes are always approximated to the best possible address
     * within the range of addresses available in the map data. Reverse geocoding
     * is an asynchronous request made to the DDS Web Services,
     * and thus requires a callBack function to catch the returned results.
     * The application should provide a callBack function that has the following
     * prototype:
     * <pre>
     *  function reverseGeocodeCallBack(result)
     * </pre>
     * If a valid reverse geocode can be made, the resulting position will be
	 * passed to the callBack in an result object. The structure of the result object
	 * is as follows:
{
  "Address": deCarta.Core.StructuredAddress,
  "Position": deCarta.Core.Position
}
     * </pre>	 
     * A failed reverse geocode will return an empty Address (result.Address.toString() == "").
     * @param {deCarta.Core.Position} position The position to reverse geocode.
	 * This can be passed as an instance of a {@link deCarta.Core.Position} class,
	 * or as an inline-object with the following fields:
	 * <ul>
	 *   <li>{float} lat: Latitude of the position</li>
	 *   <li>{float} lat: Longitude of the position</li>
	 * </ul>
	 *
     * @param {function} callback Function that will handle the result of the reverse geocode.
     * @throws {Exception} Invalid or missing callback function
     *
     */
    reverseGeocode: function(position, callback, preference){
        if (typeof callback !== 'function'){
            deCarta.Core.Exception.raise('When using the reverseGeocode function, the second parameter must be a callback function');
        }

        deCarta.Core.JSRequest.send(this.getRevGeocodeXML(position, preference), this.handleRevResponse.bind(this, callback), this.handleFailure.bind(this, callback));
    },

    /**
     *@private
     */
    handleRevResponse: function(callback, response){
        try {
            var t = response.XLS.Response.ReverseGeocodeResponse.ReverseGeocodedLocation;
            var res = {};
            res.Address = new deCarta.Core.StructuredAddress();
            res.Address.fromWSResponse(t.Address);

            res.Position = new deCarta.Core.Position(t.Point.pos);

            if (t.SearchCentreDistance){
                res.searchCenterDistance = new deCarta.Core.Distance(t.SearchCentreDistance.value, t.SearchCentreDistance.uom);
            }
            callback(res, t);
        } catch (e){            
            callback({Address: {}, Position: {}}, null);
        }
    },

    /**
     * @private
     */
    handleResponse: function(callback, response){
        
        var err = 'Unknown';

        try {
            if (response.XLS.Response.ErrorList.Error.message){
                callback({error: response.XLS.Response.ErrorList.Error.message});
                return;
            }
        } catch (e) {
            //there is no such field forget it.
        }
		try {
            var res = deCarta.Utilities.makeArrayFix(response.XLS.Response.GeocodeResponse.GeocodeResponseList.GeocodedAddress);
    		for (var i =0; i < res.length; i++){
				var add = new deCarta.Core.StructuredAddress();
				add.fromWSResponse(res[i].Address);
				res[i].Address = add;
				res[i].Position = new deCarta.Core.Position(res[i].Point.pos);
                res[i].Point = null;
                res[i].matchType = res[i].GeocodeMatchCode.matchType;
                res[i].accuracy = res[i].GeocodeMatchCode.accuracy;
                res[i].GeocodeMatchCode = null
                delete res[i].GeocodeMatchCode;
                delete res[i].Point;
			}
			callback(res, response);
		} catch (e){
            try {
                err = response.XLS.Response.ErrorList.Error.message;
            } catch (e){}
            deCarta.Core.Exception.raise('Error handling response : ' + err);
		}
                
    },

    /**
     * @private
     */
    handleFailure: function(){

    }

}


/**
 * @class
 * The Routing class is a static object which provides a single
 * {@link #execute} method for calculating a route using the deCarta DDS
 * Web Services.
 *
 * @description Static class with {@link #execute} method for calculating a route.
 *
 * @see deCarta.Core.RouteCriteria
 */

deCarta.Core.Routing = {

    /**
	 * @private
	 */
    getXML: function(criteria){
        /** Example XML
         *
<xls:XLS version='1' xls:lang='en' xmlns:xls='http://www.opengis.net/xls' rel='4.5.1.sp02' xmlns:gml='http://www.opengis.net/gml'>
      <xls:RequestHeader clientName='client_name' sessionID='3768276' clientPassword='client_password' configuration='global-decarta'/>
      <xls:Request maximumResponses='10' version='1.0' requestID='3332721' methodName='DetermineRouteRequest'>
            <xls:DetermineRouteRequest distanceUnit='M' routeQueryType='RMAN' provideRouteHandle='true'>
                  <xls:RoutePlan>
                        <xls:RoutePreference>Fastest</xls:RoutePreference>
                        <xls:WayPointList>
                              <xls:StartPoint>
                                    <xls:Position>
                                          <gml:Point>
                                                <gml:pos>37.77875373897436 -122.43852122235107</gml:pos>
                                          </gml:Point>
                                    </xls:Position>
                              </xls:StartPoint>
                              <xls:EndPoint>
                                    <xls:Position>
                                          <gml:Point>
                                                <gml:pos>37.77544959070443 -122.42852194714357</gml:pos>
                                          </gml:Point>
                                    </xls:Position>
                              </xls:EndPoint>
                        </xls:WayPointList>
                  </xls:RoutePlan>
                  <xls:RouteInstructionsRequest providePoint='true' rules='maneuver-rules'/>
                  <xls:RouteGeometryRequest returnRouteIDOnly='false'/>
            </xls:DetermineRouteRequest>
      </xls:Request>
</xls:XLS>
         */

        var altRoutes = (criteria.alternateRoutes) ? ' numAltRoutes="'+criteria.alternateRoutes+'" ' : '';

        var head =
              "<xls:Request maximumResponses='10' version='1.0' requestID='0123456789' methodName='DetermineRouteRequest'>" +
                    "<xls:DetermineRouteRequest "+altRoutes+" distanceUnit='" + criteria.distanceUnit + "' routeQueryType='" + criteria.routeQueryType + "' provideRouteHandle='" + criteria.provideRouteHandle + "'>";
                          "<xls:RoutePlan";

        // OPEN RoutePlan with the various optional attributes
        var routePlan= "<xls:RoutePlan";
        if ( criteria.trafficEnabled =="true") {
             routePlan += " useRealTimeTraffic='true'";
        }
        if (criteria.optimized) routePlan += " optimize='true' ";
        routePlan+=">";

        var routePref = "<xls:RoutePreference>" + criteria.routePreference+ "</xls:RoutePreference>";

        var waypoints = '';
        //pop off start and end, we'll be left with the viapoints
        var start = criteria.waypoints.shift();
        var end = criteria.waypoints.pop();

        waypoints = "<xls:WayPointList><xls:StartPoint><xls:Position><gml:Point><gml:pos>" + start.getLat() + " " + start.getLon() + "</gml:pos></gml:Point></xls:Position></xls:StartPoint>";
        for (var i = 0; i< criteria.waypoints.length; i++){
            var cur = criteria.waypoints[i];
            waypoints += "<xls:ViaPoint><xls:Position><gml:Point><gml:pos>" + cur.getLat() + " " + cur.getLon() + "</gml:pos></gml:Point></xls:Position></xls:ViaPoint>";
        }
        waypoints += "<xls:EndPoint><xls:Position><gml:Point><gml:pos>" + end.getLat() + " " + end.getLon() + "</gml:pos></gml:Point></xls:Position></xls:EndPoint></xls:WayPointList>";

        // be neat and put the datastructure back together again.
        criteria.waypoints.push(end);
        criteria.waypoints.unshift(start);
        
        var avoidList = ""
        if ( criteria.avoidList.length > 0 || criteria.avoidAreas.length > 0 ) {
            avoidList += "<xls:AvoidList>";
            // Avoid Areas come first
            for ( i = 0; i < criteria.avoidAreas.length; i++ ) {
                // Build the avoid areas via a buildAreaOfInterest function, or something like that
                avoidList += this.avoidAreaXML(criteria.avoidAreas[i]);
            }
            for ( i = 0; i < criteria.avoidList.length; i++ ) {
                avoidList += "<xls:AvoidFeature>"+criteria.avoidList[i].toString()+"</xls:AvoidFeature>";
            }
            avoidList += "</xls:AvoidList>";
        }


        var foot =        "</xls:RoutePlan>" +
                          "<xls:RouteInstructionsRequest providePoint='true' rules='"+criteria.instructionRules+"'/>" +
                          "<xls:RouteGeometryRequest returnRouteIDOnly='false'/>" +
                    "</xls:DetermineRouteRequest>" +
              "</xls:Request>";

        return head + routePlan + routePref + waypoints + avoidList + foot;
    },


    avoidAreaXML: function(aoi){
      
      var i; // counter
      var xml = "<xls:AOI>";
      xml += aoi.getGML();      
      xml += "</xls:AOI>";
      return xml;

    },

    /**
     * Executes the routing query.
     * @param {deCarta.Core.RouteCriteria} criteria the route criteria to be used.
	 * This can be either an instance of a {@link deCarta.Core.RouteCriteria}
	 * object, or it can be an inline object with the same structure, as follows:
	 *
	 * <pre>
	 *   object: {
	 *       distanceUnit: string, //Unit for route distance measurement. 
	 *                             //Valid values are: 'KM' (Kilometers), 'M' (Meters), 'MI' (Miles), 'FT' (Feet).
	 *       instructionProvidePoint: bool, //[[Not yet defined]
	 *       instructionRules: string, //[Not yet defined]
	 *       provideRouteHandle: bool, //Provide a route Id for further operations on route
	 *       returnIdOnly: //<em>true</em> will cause route query to return a server route ID
	 *       routePreference: string, //"AvoidFreeways", "Easy", "Fastest", "MoreFreeways", "NoFreeways", "Pedestrian", "Shortest"
	 *       routeQueryType: string, //Type of DDS Query, 'RMAN' or 'RTXT' [Need to define valid values and what they indicate.]
	 *       waypoints: //Must include at least start and end points
	 *           0: {deCarta.Core.Position}
	 *           ...
	 *           N: {deCarta.Core.Position}
	 * </pre>
	 *
     * @param {function} callback A user defined function that will receive
     * the respose to the query from the DDS Web Service. <br />
     * Function signature: <br />
     * function routeResponseCallback(RouteReturnObject)<br />
	 * The callback function is passed a single object with the following structure:
 * <pre>

 {
    "routeGeometry": [array of deCarta.Core.Position], //suitable for instantiating a deCarta.Core.Polyline
    "routeID": "String",
    "routeInstructions": {
        "list": [Array of objects: 
           {
              "distance": deCarta.Core.Distance,
              "duration": "P0DT0H0M24S", //time string
              "description": "String",
              "Instruction": "String",
              "tour": 0,
              "Point": deCarta.Core.Position
          }],
        "language": "english"
    },
    "routeSummary": {
        "boundingBox": deCarta.Core.BoundingBox,
        "totalDistance": deCarta.Core.Distance
        "totalTime": "P0DT0H45M53S" //time format string
    }
    "alternates": [
      // if the alternateRoutes paramter was set in the query criteria, this will be an array 
      // of other route objects. 
    ]
}
 * </pre>	 
     *
     */
    execute: function(criteria, callback){

        if (!criteria.waypoints || criteria.waypoints.length < 2) {
            deCarta.Core.Exception.raise('At least two waypoints are required for routing. criteria.waypoints is not a valid array, or does not contain 2 waypoints.');
        }

        var defaults = new deCarta.Core.RouteCriteria();

        criteria = deCarta.Utilities.extendObject(defaults, criteria);

        deCarta.Core.JSRequest.send(this.getXML(criteria), this.handleResponse.bind(this,callback), this.handleFailure.bind(this, callback));

    },

    /**
	 * @private
	 */
    handleResponse: function(callback, response){
      try {
        callback(response);
      } catch (e){
        callback({}, {message: 'Error executing routing request: ' + e.message});
      }
    },

    /**
	 * @private
	 */
    handleFailure: function(callback){        
	     callback({}, {message: 'Error executing routing request.'});
    },

    responseInterceptor: function(response){

      function makeRoute(response){
        var ret = {};
        ret.routeGeometry = [];
        for (var i = 0; i < response.RouteGeometry.LineString.pos.length; i++){
          ret.routeGeometry.push(new deCarta.Core.Position(response.RouteGeometry.LineString.pos[i]));
        }
        if(response.RouteHandle)
          ret.routeID = response.RouteHandle.routeID;
        ret.routeInstructions = {
          list: response.RouteInstructionsList.RouteInstruction,
          language: response.RouteInstructionsList.lang
        }

        for (var i = 0; i < ret.routeInstructions.list.length; i++){
          ret.routeInstructions.list[i].Point = new deCarta.Core.Position(ret.routeInstructions.list[i].Point);
          ret.routeInstructions.list[i].distance = new deCarta.Core.Distance(ret.routeInstructions.list[i].distance.value, ret.routeInstructions.list[i].distance.uom || "M");
        }

        ret.routeSummary = {
          boundingBox: new deCarta.Core.BoundingBox([response.RouteSummary.BoundingBox.pos[0].content,response.RouteSummary.BoundingBox.pos[1].content] ),
          totalDistance: new deCarta.Core.Distance(response.RouteSummary.TotalDistance.value, response.RouteSummary.TotalDistance.uom),
          totalTime: response.RouteSummary.TotalTime
        }
        return ret;
      }


      response = response.XLS.Response.DetermineRouteResponse;

      ret = makeRoute(response);
      if (response.AlternateRoute){

        if(!response.AlternateRoute.length) response.AlternateRoute = [response.AlternateRoute];

        for (var i = 0; i < response.AlternateRoute.length; i++){
          var r = makeRoute(response.AlternateRoute[i]);
          if (!ret.alternates) ret.alternates = [];
          ret.alternates.push(r);
        }
      }
      
      delete response;

      return ret;
    }

    
}

deCarta.Core.JSRequest.addInterceptor('DetermineRouteResponse', deCarta.Core.Routing.responseInterceptor);
/**
 * @class The StructuredAddress class holds structured address information.
 * Structured address information is pre-parsed and assigned an appropriate field
 * within the class; there is no confusion over whether the number is a postal
 * code or a block address number. This class can be used to pass an address
 * to a {@link deCarta.Core.Geocoder}:geocode() request. It can also be used to
 * parse a response from a {@link deCarta.Core.Geocoder}:reverseGeocode() request,
 * by passing the return object from that request to the {@link #fromWSResponse}
 * method of this class.
 *
 * For the purposes of the {@link deCarta.Core.Geocoder}:geocode() function,
 * you can either create an instance of a StructuredAddress, or you can create an
 * inline object with the following structure:
 * <pre>
 *   object: {
 *       buildingNumber: string, //(optional) Address number for this location.
 *       countryCode: string, //(optional) Country, formatted as ISO 3166-1 alpha-2 (2 digit) country code.
 *                            //See http://developer.decarta.com/docs/read/bada_api/Features
 *                            //for supported countries.
 *       countrySecondarySubdivision: string, //(optional) County (or equivalent) for this location.
 *       countrySubdivision: string, //(optional) Sub-country administrative
 *       division (ie the state, province, or region) for this location.
 *       countryTertiarySubdivision: string, //(optional) Additional subdivision (when relevant)
 *       landmark: string, //(optional) 
 *       locale: string, //(optional) Language, formatted as ISO 639 Language code.
 *                       //See http://developer.decarta.com/docs/read/bada_api/Features
 *                       //for supported languages.
 *       municipality: string, //(optional) City, town, village, or equivalent for this location.
 *       municipalitySubdivision: string, //(optional) Recognized neighborhood, borough, or equivalent for this location.
 *       postalCode: string, //(optional) Postal code, postcode, ZIP code, or equivalent numerical code for this location.
 *       speedLimit: string, //(optional) [Not Yet Defined]
 *       street: string, //(optional) Name and designation of the street (ie Main St) for this location.
 *       streetNameAndNumber: string, //(optional) [Not Yet Defined]
 *       type: string //(required) Must be set to 'structured' to create an inline structured address object
 *   }
 * </pre>
 *
 * @description The StructuredAddress class holds structured address information for the Geocoder

 * @constructor
 * @param {Object} addressObj
 * An object containing any of the following fields:
 * <ul>
 *   <li>buildingNumber: (optional) Address number for this location.</li>
 *   <li>countryCode: Country, formatted as ISO 3166-1 alpha-2 (2 digit) country code.
 *       See http://developer.decarta.com/docs/read/bada_api/Features for supported countries.</li>
 *   <li>countrySecondarySubdivision: (optional) County (or equivalent)
 *       for this location.</li>
 *   <li>countrySubdivision: (optional) Sub-country administrative
 *       division (ie the state, province, or region) for this location.</li>
 *   <li>countryTertiarySubdivision: (optional) Additional subdivision (when relevant)</li>
 *   <li>landmark</li>
 *   <li>locale: Language, formatted as ISO 639 Language code.
 *       See http://developer.decarta.com/docs/read/bada_api/Features
 *       for supported languages.</li>
 *   <li>municipality: (optional) City, town, village, or equivalent for
 *       this location.</li>
 *   <li>municipalitySubdivision: (optional) Recognized neighborhood,
 *       borough, or equivalent for this location.</li>
 *   <li>postalCode: (optional) Postal code, postcode, ZIP code, or
 *        equivalent numerical code for this location.</li>
 *   <li>speedLimit: [Not Yet Defined]</li>
 *   <li>street: (optional) Name and designation of the street (ie Main
 *       St) for this location.</li>
 *   <li>streetNameAndNumber: [Not Yet Defined]</li>
 * </ul>
 * @param {deCarta.Core.Locale} locale optional What parsing rules should be used to improve
 * the address match rate. Default is equivalent to a Locale of "en" (English)
 * language and "US" (United States) country parsing.
 *
 * @see deCarta.Core.Geocoder
 * @see deCarta.Core.FreeFormAddress
 */
deCarta.Core.StructuredAddress = function(addressObj, locale){
    if (!addressObj) addressObj = {};
    //this.setAddress(addressObj);
    this.locale = locale || new deCarta.Core.Locale("en","US");


    // The building number could be 0, I guess
    if ( addressObj.buildingNumber || addressObj.buildingNumber == 0 ) {
        this.buildingNumber = addressObj.buildingNumber;
    } else {
        this.buildingNumber = "";
    }
    this.landmark = "";
    this.street = addressObj.street || "";
    this.streetNameAndNumber = "";
    this.speedLimit = "";
    this.countryCode = "";
    this.countrySubdivision = addressObj.countrySubdivision || "";
    this.countrySecondarySubdivision = addressObj.countrySecondarySubdivision || "";
    this.countryTertiarySubdivision = "";
    this.municipality = addressObj.municipality || "";
    this.postalCode = addressObj.postalCode || "";
    this.municipalitySubdivision = addressObj.municipalitySubdivision || "";

    this.type = 'structured';

}

deCarta.Core.StructuredAddress.prototype = {

    /**
	 * Provides the structured address as a single string, formatted ready for
	 * display to the user
	 * @return {string} String containing the address in a single string
	 */
    toString: function(){


        var retval = "";
        if ( this.buildingNumber != "" && typeof this.buildingNumber != 'object')
            retval += this.buildingNumber + " ";
        if ( this.street != "" && typeof this.street === 'string')
            retval += this.street + " ";
        if ((deCarta.Core.Configuration.country==='CH') && this.municipalitySubdivision != "" && typeof this.municipalitySubdivision === 'string'){
            retval += this.municipalitySubdivision + " ";
        }
        if ( this.municipality != "" && typeof this.municipality === 'string'){
            retval += this.municipality + " ";
        } else {
            if ( this.municipalitySubdivision != "" && typeof this.municipalitySubdivision === 'string'){
                retval += this.municipalitySubdivision + " ";  
            }
        }
        if ( this.countrySubdivision != "" && typeof this.countrySubdivision === 'string')
            retval += this.countrySubdivision + " ";
        if ( this.postalCode != "" && typeof this.postalCode === 'string')
            retval += this.postalCode;
        return retval;
    },

    /**
	 * @private
	 * Initializes the properties of this StructuredAddress class using
	 * the values returned from a {@link deCarta.Core.Geocoder}:reverseGeocode()
	 * function call in the result data structure passed to the callback function.
	 * @param {reverseGeocodeResult} r Value passed into the callback function
	 * of a {@link deCarta.Core.Geocoder}:reverseGeocode() request.
	 */
    fromWSResponse: function(r){
        if (r.StreetAddress){
            if (r.StreetAddress.Building){
                if(r.StreetAddress.Building.number.length && r.StreetAddress.Building.number.indexOf("-")>-1){
                    var spl = r.StreetAddress.Building.number.split(" ");
                    r.StreetAddress.Building.number = spl[0]+"-"+spl[spl.length-1];
                }
                this.buildingNumber = r.StreetAddress.Building.number;
            }
            if (r.StreetAddress.Street) this.street = r.StreetAddress.Street;
        }
        if (r.freeFormAddress) this.freeFormAddress = r.freeFormAddress;
        if (r.countryCode) {
            this.locale.country = r.countryCode;
            this.countryCode = r.countryCode;
        }
        if (r.language) this.locale.language = r.language;
        if (r.Place){
            r.Place = deCarta.Utilities.makeArrayFix(r.Place);
            for (var i =0; i < r.Place.length; i++){
                var prop = r.Place[i].type.substring(0,1).toLowerCase() + r.Place[i].type.substring(1);
                this[prop] = r.Place[i].content;
            }
        }
        if (r.StreetIntersection){
            this.streetIntersection = r.StreetIntersection;
        }
        
    },
    
	/**
	 * @private
	 */
    fromWSAddressResponse: function(r){
        for (var prop in this){
            if (this.hasOwnProperty(prop) && r[prop])
            this[prop] = r[prop];
        }
    },

    /**
     * @private
     */
    toXML: function(){

    },

    /**
	 * Generates a FreeFormAddress from this structured address
	 * @return {deCarta.Core.FreeFormAddress} A FreeFormAddress object containing the address in a single string
	 */
    toFreeForm: function(){
        return new deCarta.Core.FreeFormAddress(this.toString(), new deCarta.Core.Locale('EN', 'US'));
    }

}

/**
 * @class Represents a Free Form Address.
 * For the purposes of the {@link deCarta.Core.Geocoder}:geocode() function,
 * you can either create an instance of a FreeFormAddress, or you can create an
 * inline object with the following structure:
 * <pre>
 *   object: {
 *       address: string, //free form address
 *       locale: deCarta.Core.Locale, //a locale object
 *       type: string = 'freeForm'
 *   }
 * </pre>
 *
 * @description Free Form Address for use with Geocoder
 *
 * @constructor
 * @param {String} address The free-form address, containing a partial or complete 
 * address
 * @param {deCarta.Core.Locale} locale A Locale object
 * 
 * @see deCarta.Core.Geocoder
 * @see deCarta.Core.StructuredAddress
 */


deCarta.Core.FreeFormAddress = function(address, locale){
    this.address = address;
    this.locale = locale;
    this.type = 'freeForm';
}

deCarta.Core.FreeFormAddress.prototype = {

    /**
	 * @private
	 */
    toString: function(){
        return this.address;
          
    },

    /**
     * Returns an XML Representation of the FreeFormAddress
     * @return {string} XML formatted address
     */
    toXML: function(){


        var xml =
        '<xls:Address countryCode="'+this.locale.getCountry()+'" language="'+this.locale.getLanguage()+'">' +
            '<xls:freeFormAddress>' + this.address + '</xls:freeFormAddress>' +
        '</xls:Address>';

        return xml;
    }
}
/**
 *  @class
 *  Data structure for POI request parameters, used with the
 *  {@link deCarta.Core.POISearch}:execute() method. The structure of the
 *  SearchCriteria class is as follows:
 * <pre>
 *  SearchCriteriaObject: {
 *      queryString: null, //[Not yet defined]
 *      maximumResponses: int, //Max number of responses that will be returned
 *      database: string, //Database that will be queried for this search
 *      sortDirection: string, //Sort order for results ["Ascending", "descending"]
 *      sortCriteria: string, //Property results will be sorted by ["Distance", "Score"]
 *      rankCriteria: string, //Property by which results will be ranked [Distance, Score]
 *      allowAggregates: bool, //Allow Aggregates
 *      retrieveAll: bool, //retreive all values
 *      properties: { //Object describing search properties, contains ONE OF:
 *          CATEGORY: string, //If present, this will perform a category search on this value
 *          KEYWORD: string, //If present, this will perform a Keyword search on this value
 *          POIName: string //If present, this will perform a freeform POI Search on this value
 *      }
 *      position: deCarta.Core.Position, //Position where the search is centered
 *      radius: deCarta.Core.Radius, //Radius of the search
 *      routeId: int, //if routeId is set, the search will be performed along the route. 
 *      corridorType: //[Not yet defined]
 *      map: deCarta.Core.Map //Optionally pass Map instead of position+radius
 * </pre>
 *
 * @description Data structure for POI request parameters.
 *
 * @see deCarta.Core.POISearch
 */

deCarta.Core.SearchCriteria=function(){}
deCarta.Core.SearchCriteria.prototype={
    /**
     *
     */
    queryString: null,
    /**
     * (int) Max number of responses that will be returned (default=10)
     */
    maximumResponses: 10,
    /**
     * (string) Database that will be queried for this search
	 * (default='search:decarta:poi')
     */
    database: 'search:decarta:poi',
    /**
     * (string) Sort order for results ["Ascending" (default), "descending"]
     */
    sortDirection: "Ascending",
    /**
     * (string) Property results will be sorted by ["Distance" (default), "Score"]
     */
    sortCriteria: "Distance",
    /**
     * (string) Property by which results will be ranked [Distance, Score (default)]
     */
    rankCriteria: "Score",
    /**
     * (bool) Allow Aggregates (default=false)
     */
    allowAggregates: false,
    /**
     * (bool) retreive all values (default=false)
     */
    retrieveAll: false,
    /**
     * Object describing search properties
     * Can contain one of the following:
     * <ul>
     *  <li>CATEGORY : "string". <br />This will perform a category search.</li>
     *  <li>KEYWORD : "string". <br />This will perform a Keyword search.</li>
     *  <li>POIName : "string". <br />This will perform a freeform POI Search.</li>
     * </ul>
     */
    properties: {},
    /**
     * {@link deCarta.Core.Position} Position where the search is centered
     */
    position: null,
    /**
     * {@link deCarta.Core.Radius} Radius of the search
     */
    radius: new deCarta.Core.Radius(5, 'km'),
    /**
     * if corridorParams are set the search will be performed around the route.
     *  routeId - returned from @See deCarta.Core.Routing
     * measure : 'distance' or 'time' or 'euclideanDistance'
     * measureValue : int representing either meters or minutes
     */
    corridorParams: {
        routeId: null,
        measure : 'distance', 
        measureValue : 10
    },
    /**
     * {@link deCarta.Core.Map} Instead of passing position and radius, you can
	 * pass a reference to your map and Position and Radius will be set according
	 * to the currently visible area on the map.
     */
    map: null

}

/**
 *  @class
 *  Data structure for route request parameters, used with the
 *  {@link deCarta.Core.Routing}:execute() method. The structure of the
 *  RouteCriteria class is as follows:
 * <pre>
 *   object: {
 *       distanceUnit: string, //Unit for route distance measurement. Valid values are: 'KM' (Kilometers), 'M' (Meters), 'MI' (Miles), 'FT' (Feet).
 *       instructionProvidePoint: bool, //[Not yet defined]
 *       instructionRules: string, //[Not yet defined]
 *       provideRouteHandle: bool, //Provide a route Id for further operations on route
 *       returnIdOnly: //<em>true</em> will cause route query to return a server route ID
 *       routePreference: string, //"AvoidFreeways", "Easy", "Fastest", "MoreFreeways", "NoFreeways", "Pedestrian", "Shortest"
 *       routeQueryType: string, //Type of DDS Query, 'RMAN' or 'RTXT' [Need to define valid values and what they indicate.]
 *       waypoints: //Must include at least start and end points
 *           0: {deCarta.Core.Position}
 *           ...
 *           N: {deCarta.Core.Position}
 * </pre>
 *
 * @description Data structure for setting route request parameters.
 *
 * @see deCarta.Core.Routing
 */
deCarta.Core.RouteCriteria = function(){};
deCarta.Core.RouteCriteria.prototype = {
    /**
     * Unit for route distance measurement. Valid values are: 'KM' (Kilometers), 'M' (Meters), 'MI' (Miles), 'FT' (Feet)
     */
    distanceUnit : 'M',
    /**
     * Type of DDS Query, 'RMAN' or 'RTXT' [Need to define valid values and what they indicate.]
     */
    routeQueryType: 'RMAN',
    /**
     * Provide a route Id for further operations on route @See deCarta.Core.SearchCriteria for CorridorSearch
     */
    provideRouteHandle: 'false',
    /**
     * Route preferences.
     * <p>The various different routing styles are summarized below.</p>
     * <ul>
     * <li>"AvoidFreeways" = Return a vehicular route that avoids limited access
     * roads (e.g. freeways) as much as possible.</li>
     * <li>"Easy" = Return a vehicular route that attempts to make as few turns,
     * balancing this constraint with the shortest travel time.</li>
     * <li>"Fastest" = (DEFAULT) Return a vehicular route with the smallest, calculated
     * travel time. This is the standard, and default routing style.</li>
     * <li>"MoreFreeways" = Return a vehicular route that will attempt to use as
     * many limited access roads (e.g. freeways) as possible.</li>
     * <li>"NoFreeways" = Return a vehicular route that avoids limited access
     * roads (e.g. freeways) entirely. This route will take only surface street
     * and arterial roads to the destination.</li>
     * <li>"Pedestrian" = Return a route fit for Pedestrian traffic. Routes will
     * avoid limited access roads, ignore vehicular signage restrictions, obey
     * impassible physical restrictions (like grade separations), take the most
     * direct path possible, and utilize pedestrian only foot-traffic paths.</li>
     * <li>"Shortest" = Return a vehicular route with the shortest total distance
     * traveled.</li>
     * </ul>
     */
    routePreference: 'Fastest',
	
    /**
     * An array of {@link deCarta.Core.Position}s, from start-to-end of the
	 * route. Must include at least 2 (start and end).
     */
    waypoints: [],
	
    /**
     * [Not yet defined]
     */
    instructionProvidePoint: 'true',
	
    /**
     * [Not yet defined]
     */
    instructionRules: 'maneuver-rules',
	
    /**
     * If set to <em>true</em>, the route calculation will only return a route ID.
	 * Default=false
     */
    returnIdOnly: 'false',

    /**
     * If set to <em>true</em>, the route calculation will take into consideration live traffic.
     * Default=false
     * @note the server must be running the deCarta Traffic Manager
     */
    trafficEnabled: 'false',

    /**
     * Array of any combination of:     
     * Polygon, Circle or Polyline objects
     */
    avoidAreas: [],

    /***
     * Array of features to avoid. Features are string and can be :
     * Ferry
     * Toll
     * Tunnels
     * Bridges
     *
     */
    avoidList: [],

    /**
    * Integer. 
    * If this is set to N, the routing query will return N alternate routes 
    * in addition to the regular response. 
    */
    alternateRoutes: 0,

    /**
    * Boolean. 
    * If the route has moltiple waypoints, setting this to true will fine the best 
    * order in which to visit the waypoints. If false, the waypoints will be 
    * visited in their original order. 
    */
    optimized: false

}
/**
 * @class
 * <p>
 * PositionAnimator allows you to define a start and end position and it will
 * provide a sequence of interpolated positions suitable for an animation.
 * </p>
 * <p>A typical use case would be animating the map {@link deCarta.Core.Map} to
 * move smoothly from one center position to another one, or animating a map
 * overlay object {@link deCarta.Core.MapOverlay} to move
 * from a position to a different one</p>
 *
 * @description Used to animate a map or map overlay object.
 * 
 * @constructor
 * @param {object} opt Options, a structure with the following fields:
 * <ul>
 *   <li>start: {@link deCarta.Core.Position} the starting position</li>
 *   <li>end: {@link deCarta.Core.Position} the ending position</li>
 *   <li>start: {@link deCarta.Core.Position} the starting position</li>
 *   <li>duration: {int} duration of the animation in milliseconds, default: 300</li>
 *   <li>easing: {string} the easing function that will be used, default: linear <br />Available functions:
 *      <ul>
 *          <li>linear</li>
 *          <li>backin</li>
 *          <li>backout</li>
 *          <li>backinout</li>
 *          <li>bouncein</li>
 *          <li>bounceout</li>
 *          <li>bounceinout</li>
 *          <li>cubicin</li>
 *          <li>cubicout</li>
 *          <li>cubicinout</li>
 *          <li>elasticin</li>
 *          <li>elasticout</li>
 *          <li>elasticinout</li>
 *          <li>quadin</li>
 *          <li>quadout</li>
 *          <li>quadinout</li>
 *          <li>sinein</li>
 *          <li>sineout</li>
 *          <li>sineinout</li>
 *      </ul>
 *   </li>
 *   <li>onStep: function that will be called with the updated position every step of the animation<br />
 *   <pre>function getUpdatedPosition(deCarta.Core.Position)</pre>
 *   </li>
 *   <li>onEnd: function that will be called when the animation reaches the end position<br />
 *   <pre>function getUpdatedPosition(deCarta.Core.Position)</pre>
 *   </li>
 * </ul>
 *   
 */
deCarta.Core.PositionAnimator = function(opts){

    if (opts){
        this.animate(opts);
    }
}

deCarta.Core.PositionAnimator.prototype = {

    /**
     * @private
     * performs the animation
     *
     */
    animate: function(opts){

        var defaults = {
            start: null,
            end: null,
            duration: 300,
            easing: 'linear',
            onStep: null,
            onEnd: null
        }

        if (!opts.start || !opts.end || !opts.onStep)
                deCarta.Core.Exception.raise('You need to specify a start point, and end point and a callback for a position animation');

        opts = deCarta.Utilities.extendObject(defaults,opts);

        this.start = opts.start;
        this.end = opts.end;
        this.duration = opts.duration;
        this.onStep = opts.onStep;
        this.onEnd = opts.onEnd;

        this.easingX = (opts.easingX) ? opts.easingX : (opts.easing) ? opts.easing : 'linear';
        this.easingY = (opts.easingY) ? opts.easingY : (opts.easing) ? opts.easing : 'linear';

        this.easingFnX = deCarta.Easing(this.easingX);
        this.easingFnY = deCarta.Easing(this.easingY);

        this.startTime = new Date().getTime();
        this.endTime = this.startTime + this.duration;
        
        this.step();

    },

    /**
     *@private
     *Calculates every new step
     */
    step: function(){
        if (this.mustStop) return;
        var time = new Date().getTime() - this.startTime;
        var completion = 1 - ((this.endTime - new Date().getTime()) / this.duration);
        
        if (completion >= 0.99) {
            //position on end
            if (typeof this.onStep === 'function') this.onStep(this.end);
            if (typeof this.onEnd === 'function') this.onEnd(this.end);
        } else {
            var pxStart = this.posToPix(this.start);
            var pxEnd = this.posToPix(this.end);

            var dX = pxEnd.x - pxStart.x;
            var dY = pxEnd.y - pxStart.y;

            var newPos = this.pixToPos({
                x: this.easingFnX(time, pxStart.x, dX, this.duration),
                y : this.easingFnY(time, pxStart.y, dY, this.duration)
            });

            if (typeof this.onStep === 'function') this.onStep(newPos);

            //setTimeout(this.step.bind(this), 20);
            requestAnimFrame(this.step.bind(this));
        }
    },

    stop: function(){
        this.mustStop = true;
    },

    /**
     * @private
     * Converts a position (lat, lon) to pixels at zoom lev 21.
     * Having the zoom level fixed at 21 allows for the highest
     * resolution required for animations.
     **/
    posToPix: function(pos){


        return {x: deCarta.Utilities.lon2pix(pos.getLon(), 21) , y: deCarta.Utilities.lat2pix(pos.getLat(), 21)}

        /*
        var scaleLevel = deCarta.App.zoom.getGXConvertedZoomLevel();
        var scale = Utilities.radsPerPixelAtZoom(deCarta.App.map.getTileSize(), scaleLevel);

        return {x: Utilities.lon2pix(pos.lon, scale) , y: Utilities.lat2pix(pos.lat, scale)}*/
    },

    pixToPos: function(pixPos){

        return new deCarta.Core.Position(deCarta.Utilities.pix2lat(pixPos.y, 21), deCarta.Utilities.pix2lon(pixPos.x, 21));

        /*
        var scaleLevel = deCarta.App.zoom.getGXConvertedZoomLevel();
        var scale = Utilities.radsPerPixelAtZoom(deCarta.App.map.getTileSize(), scaleLevel);

        return new Position(Utilities.pix2lat(pixPos.y,scale), Utilities.pix2lon(pixPos.x,scale));*/
    }
}

/**
* @class
* the ZoomAnimator is similar to the Position Animator, but works on floating point values, suitable for use as zoom values. 
*/
deCarta.Core.ZoomAnimator = function(opts){
    if (opts){
        this.animate(opts);
    }
}

deCarta.Core.ZoomAnimator.prototype = {

    animate: function(opts){
        var defaults = {
            start: null,
            end: null,
            duration: 300,
            easing: 'linear',
            onStep: null,
            onEnd: null
        }        

        if (!opts.start || !opts.end || !opts.onStep)
            deCarta.Core.Exception.raise('You need to specify a start point, and end point and a callback for a position animation');

        this.start = opts.start;
        this.end = opts.end;
        this.duration = opts.duration;
        this.onStep = opts.onStep;
        this.onEnd = opts.onEnd;

        this.easing = (opts.easing) ? opts.easing : 'linear';
        this.easingFn = deCarta.Easing(this.easing);

        this.startTime = new Date().getTime();
        this.endTime = this.startTime + this.duration;
        
        this.step();

    },

    step: function(){
        if (this.mustStop) return;
        var time = new Date().getTime() - this.startTime;
        var completion = 1 - ((this.endTime - new Date().getTime()) / this.duration);
        
        if (completion >= 0.99) {
            //position on end
            if (typeof this.onStep === 'function') this.onStep(this.end); 
            if (typeof this.onEnd === 'function') this.onEnd(this.end);
        } else {            
            var zoom = this.easingFn(time, this.start, this.end-this.start, this.duration);

            if (typeof this.onStep === 'function') this.onStep(zoom);            
            requestAnimFrame(this.step.bind(this));            
        }
    },

    stop: function(){
        this.mustStop = true;
    }
}

/**
 * Easing functions
 * 
 * sourced from Robert Penner's excellent work:
 * http://www.robertpenner.com/easing/
 * And the js port by http://www.tile5.org/
 * 
 * Functions follow the function format of fn(t, b, c, d, s) where:
 * - t = time
 * - b = beginning position
 * - c = change
 * - d = duration
 * - s = [not used]
 *
 * @param {string} type The string representing the name of the easing function to use
 */  
deCarta.Easing = function(type) {

    // define some constants
    var TWO_PI = Math.PI * 2,
        HALF_PI = Math.PI / 2;

    // define some function references
    var abs = Math.abs,
        pow = Math.pow,
        sin = Math.sin,
        asin = Math.asin,
        cos = Math.cos;

    var s = 1.70158;


    var easingFns = {
        linear: function(t, b, c, d) {
            return c*t/d + b;
        },

        backin: function(t, b, c, d) {
            return c*(t/=d)*t*((s+1)*t - s) + b;
        },

        backout: function(t, b, c, d) {
            return c*((t=t/d-1)*t*((s+1)*t + s) + 1) + b;
        },

        //this one is broken.
        backinout: function(t, b, c, d) {
            return ((t/=d/2)<1) ? c/2*(t*t*(((s*=(1.525))+1)*t-s))+b : c/2*((t-=2)*t*(((s*=(1.525))+1)*t+s)+2)+b;
        },

        bouncein: function(t, b, c, d) {
            return c - easingFns.bounceout(d-t, 0, c, d) + b;
        },

        bounceout: function(t, b, c, d) {
            if ((t/=d) < (1/2.75)) {
                return c*(7.5625*t*t) + b;
            } else if (t < (2/2.75)) {
                return c*(7.5625*(t-=(1.5/2.75))*t + 0.75) + b;
            } else if (t < (2.5/2.75)) {
                return c*(7.5625*(t-=(2.25/2.75))*t + 0.9375) + b;
            } else {
                return c*(7.5625*(t-=(2.625/2.75))*t + 0.984375) + b;
            }
        },

        bounceinout: function(t, b, c, d) {
            if (t < d/2) return easingFns.bouncein(t*2, 0, c, d) / 2 + b;
            else return easingFns.bounceout(t*2-d, 0, c, d) / 2 + c/2 + b;
        },

        cubicin: function(t, b, c, d) {
            return c*(t/=d)*t*t + b;
        },

        cubicout: function(t, b, c, d) {
            return c*((t=t/d-1)*t*t + 1) + b;
        },

        cubicinout: function(t, b, c, d) {
            if ((t/=d/2) < 1) return c/2*t*t*t + b;
            return c/2*((t-=2)*t*t + 2) + b;
        },

        elasticin: function(t, b, c, d, a, p) {
            var s;

            if (t==0) return b;  if ((t/=d)==1) return b+c;  if (!p) p=d*0.3;
            if (!a || a < abs(c)) { a=c; s=p/4; }
            else s = p/TWO_PI * asin (c/a);
            return -(a*pow(2,10*(t-=1)) * sin( (t*d-s)*TWO_PI/p )) + b;
        },

        elasticout: function(t, b, c, d, a, p) {
            var s;

            if (t==0) return b;  if ((t/=d)==1) return b+c;  if (!p) p=d*0.3;
            if (!a || a < abs(c)) { a=c; s=p/4; }
            else s = p/TWO_PI * asin (c/a);
            return (a*pow(2,-10*t) * sin( (t*d-s)*TWO_PI/p ) + c + b);
        },

        elasticinout: function(t, b, c, d, a, p) {
            var s;

            if (t==0) return b;  if ((t/=d/2)==2) return b+c;  if (!p) p=d*(0.3*1.5);
            if (!a || a < abs(c)) { a=c; s=p/4; }
            else s = p/TWO_PI * asin (c/a);
            if (t < 1) return -0.5*(a*pow(2,10*(t-=1)) * sin( (t*d-s)*TWO_PI/p )) + b;
            return a*pow(2,-10*(t-=1)) * sin( (t*d-s)*TWO_PI/p )*0.5 + c + b;
        },

        quadin: function(t, b, c, d) {
            return c*(t/=d)*t + b;
        },

        quadout: function(t, b, c, d) {
            return -c *(t/=d)*(t-2) + b;
        },

        quadinout: function(t, b, c, d) {
            if ((t/=d/2) < 1) return c/2*t*t + b;
            return -c/2 * ((--t)*(t-2) - 1) + b;
        },

        sinein: function(t, b, c, d) {
            return -c * cos(t/d * HALF_PI) + c + b;
        },

        sineout: function(t, b, c, d) {
            return c * sin(t/d * HALF_PI) + b;
        },

        sineinout: function(t, b, c, d) {
            return -c/2 * (cos(Math.PI*t/d) - 1) + b;
        }
    }

    return (easingFns[type]) ? easingFns[type] : easingFns['linear'];

}
/**
* @ignore
* @class
* The Map Animator class plays animations encoded in the NightHawk Map Animation Format. 
* 
*
*/


deCarta.Core.MapAnimator = function(map){
	this.map = map;
}

deCarta.Core.MapAnimator.prototype = {
	

	loadAnimation: function(animation){
		this.animation = animation;
	},

	play: function(){
		this.startTime = new Date().getTime();
		
		var firstFrame = this.getNextIdx();
		
		setTimeout(this.step.bind(this), firstFrame);
	},

	step: function(){
		var elapsed = new Date().getTime() - this.startTime;

		var frameIdx = this.getNextIdx();
		if (!frameIdx) {			
			return; 
		}
		var frame = this.animation[frameIdx];

		for (var i = 0; i < frame.length; i++){
			var item = frame[i];
			this.runItem(item);
		}

		delete this.animation[frameIdx];
		var nextFrameIdx = this.getNextIdx();
		setTimeout(this.step.bind(this), nextFrameIdx - elapsed);
	},

	runItem: function(item){
		switch(item.type){
			case 'zoom':
				//console.log('Starting zoom animations');

				this.zoomAnimator = new deCarta.Core.ZoomAnimator({
					start: this.map.zoom,
					end: item.target,
					duration: item.duration,
					easing: item.easing,
					onStep: function(z){
						this.map.zoom = z;
						this.map.render();
					}.bind(this)
				});
			break;
			case 'position':
				//console.log('Starting pos animations');
				this.positionAnimator = new deCarta.Core.PositionAnimator({
					start: this.map.center,
					end: new deCarta.Core.Position(item.target),
					duration: item.duration,
					easing: item.easing,
					onStep: function(p){
						this.map.centerOn(p, {animated: false});
					}.bind(this)
				})
			break;
			case 'config':
				 deCarta.Core.Configuration.defaultConfig = item.target;
				 deCarta.Core.Configuration.defaultHiResConfig = item.target;
			break;
		}
	},



	getNextIdx: function(){
		for (i in this.animation){
			var frameIdx = i;
			
			return frameIdx;
		}
		return false;
	}

}
/**
 * @private
 * @class HTMLRenderer is used to render a tile layer as a set of HTML elements
 * @description Renders a tile layer in an HTML element.
 *
 * @constructor
 * @param {HTMLDomElement} container : the HTML element that should be used for
 * rendering
 */

deCarta.Core.HTMLRenderer = function(container){

    this.container = container;
    this.imageWrapper = deCarta.crEl('div');

    this.imageWrapper.style.position = 'absolute';
    this.imageWrapper.style.overflow = 'hidden';
    this.imageWrapper.style.top = this.imageWrapper.style.left = 0;

    this.resize();

    this.container.appendChild(this.imageWrapper);

    this.images = [];

    this.bmark = {
        counts: 0,
        renderTime: 0
    }

    this.scale = deCarta.Window.getDpr();//(window.devicePixelRatio) ? 1 / window.devicePixelRatio : 1;
}

deCarta.Core.HTMLRenderer.prototype = {

    /**
     * Invoked by the MapLayer when a resize is necessary.
     *
     */
    resize: function(){    
    
        this.imageWrapper.style.width = this.container.style.width;
        this.imageWrapper.style.height = this.container.style.height;
    },

    /**
     * Invoked by the MapLayer when a rendering is necessary.
     * @param {array} renderingQueue renderingQueue of tiles as generated by the
     * MapLayer. Z-Ordered back to front.
     *
     */
    render: function(renderingQueue){            
        //var start = new Date().getTime();        
        this.renderRestore(renderingQueue);
        /**this.bmark.renderTime += new Date().getTime() - start;
        this.bmark.counts ++;*/
    },
    /**
     * @private
     */
    show: function(){
        this.imageWrapper.style.display = 'block';
    },

    /**
     * @private
     */
    hide: function(){
        this.imageWrapper.style.display = 'none';
    },
    
    renderRestore: function(renderingQueue){
        
        var restore = deCarta.Utilities.removeElementToReinsert(this.imageWrapper);
        var newEl = this.imageWrapper;
        newEl.innerHTML = '';
        
        var time = new Date().getTime();
        for (var i = 0; i < renderingQueue.length; i++){        
            var draw = renderingQueue[i];

            draw.img.className = 'deCarta-Core-TileImage';
            if (draw.img.empty) {
                draw.img.className += ' blank';                
            }
            draw.img.style.position = 'absolute';

            draw.y = Math.floor(draw.y);
            draw.x = Math.floor(draw.x);
            draw.size = Math.ceil(draw.size);
            
            draw.img.style.top = draw.y + 'px';
            draw.img.style.left = draw.x + 'px';
            draw.img.style.width = draw.img.style.height = draw.size + 'px';
            draw.img.style.zIndex = 10 - (draw.scale);
            
            //deCarta.DOM(draw.img).setUnselectable();
            
            /*var deltaT = time - draw.time;
            var opacity = 1;
            if (deltaT <= 500){
                opacity = deltaT / 500;
            }
            draw.img.style.opacity = opacity;*/
            
            newEl.appendChild(draw.img);            

        }

        restore();
    },
    
    renderReplace: function(renderingQueue){        
        
        var newEl = deCarta.crEl('div');                        

        for (var i = 0; i < renderingQueue.length; i++){
            var draw = renderingQueue[i];

            draw.img.className = 'deCarta-mobile-tileImage';
            if (draw.img.empty) {
                draw.img.className += ' blank';                
            }
            draw.img.style.position = 'absolute';

            draw.y = Math.floor(draw.y);
            draw.x = Math.floor(draw.x);
            draw.size = Math.ceil(draw.size);
            
            draw.img.style.top = draw.y + 'px';
            draw.img.style.left = draw.x + 'px';
            draw.img.style.width = draw.img.style.height = draw.size + 'px';
            
            newEl.appendChild(draw.img);            

        }

        this.imageWrapper.parentNode.replaceChild(newEl, this.imageWrapper);
        this.imageWrapper = newEl;
        
    },
    
    renderString: function(renderingQueue){

        var newEl = deCarta.crEl('div');

        var string = '';

        for (var i = 0; i < renderingQueue.length; i++){
            var draw = renderingQueue[i];

            string += '<img src="'+draw.img.src+'" class="deCarta-mobile-tileImage ' + (draw.img.empty ? 'blank' : '') + '" style="position: absolute; top: '+Math.floor(draw.y)+'px; left: '+Math.floor(draw.x)+'px; width: '+Math.ceil(draw.size)+'px; height: '+Math.ceil(draw.size)+' " />';

        }
        newEl.innerHTML = string;
        //restore();
        this.imageWrapper.parentNode.replaceChild(newEl, this.imageWrapper);
        this.imageWrapper = newEl;

    }


}
/**
 * @private
 * @class CSS3Renderer is used to render a tile layer as a set of HTML elements
 * using css3 transforms. This enables hardware acceleration on the iOS platform (and chrome)
 * @description Renders a tile layer in an HTML element using CSS3 Transforms.
 *
 * @constructor
 * @param {HTMLDomElement} container : the HTML element that should be used for
 * rendering
 */

deCarta.Core.CSS3Renderer = function(container){
    
    this.container = container;
    this.imageWrapper = deCarta.crEl('div');

    this.imageWrapper.style.position = 'absolute';
    this.imageWrapper.style.overflow = 'hidden';
    this.imageWrapper.style.top = this.imageWrapper.style.left = 0;

    this.resize();

    this.resetCounter = 0;

    this.container.appendChild(this.imageWrapper);

    this.images = [];
    this.visibleKeys = {};

    this.imageWrapper.id = 'deCarta-Core-Renderer-' + Math.floor(Math.random() * 10000);
    this.id = 0;

    this.scale = deCarta.Window.getDpr();//(window.devicePixelRatio) ? 1 / window.devicePixelRatio : 1;    

}

deCarta.Core.CSS3Renderer.prototype = {

    /**
	 * @private
     * Invoked by the MapLayer when a resize is necessary.
     */
    resize: function(){
        
        this.imageWrapper.style.width = this.container.style.width;
        this.imageWrapper.style.height = this.container.style.height;
    },

    /**
	 * @private
     * Invoked by the MapLayer when a rendering is necessary.
     * @param {array} renderingQueue renderingQueue of tiles as generated by the
     * MapLayer. Z-Ordered back to front.
     */
    render: function(renderingQueue){

        // It seems that if you let it go too long chrome blows up.
        // It might be worth doing a renderRestore and seeing
        // if it works well ... for now this keeps it relatively ok. 
        if (this.resetCounter >= 100){
            this.imageWrapper.innerHTML = '';
            this.visibleKeys = {};
            this.resetCounter = 0;
        }

        var keepKeys = {};

        for (var i = 0; i < renderingQueue.length; i++){
            var draw = renderingQueue[i];

            draw.img.className = 'deCarta-Core-TileImage';
            if (draw.img.empty) {
                draw.img.className += ' blank';                
            }
            draw.img.style.position = 'absolute';

            /**
             * This code uses css transforms which are supposed to be fast.
             * They are but have some issues such as not working very well at all.
             * it can be uncommented and tried on various devices from time to time
             * it will be interesting to see the performance.
             */

            var scale = draw.size / draw.img.width;
            if (scale == 1){
                /* On chrome when HW accel the tiles get fuzzied up unless pixel aligned. */
                draw.y = Math.floor(draw.y);
                draw.x = Math.floor(draw.x);
                draw.width = Math.ceil(draw.width);
                draw.height = Math.ceil(draw.height);
            }
            draw.img.style.top = '0px';
            draw.img.style.left = '0px';
            draw.img.style.webkitTransformOrigin = " 0 0 ";
            draw.img.style.MozTransformOrigin = " 0 0 ";
            draw.img.style.OTransformOrigin = " 0 0 ";
            draw.img.style.msTransformOrigin = " 0 0 ";
            draw.img.style.TransformOrigin = " 0 0 ";
            draw.img.style.webkitTransform = "translate3d("+draw.x+"px, "+draw.y+"px, 0) scale("+scale+") ";
            draw.img.style.MozTransform = "translate3d("+draw.x+"px, "+draw.y+"px, 0) scale("+scale+") ";
            draw.img.style.OTransform = "translate3d("+draw.x+"px, "+draw.y+"px, 0) scale("+scale+") ";
            draw.img.style.msTransform = "translate3d("+draw.x+"px, "+draw.y+"px, 0) scale("+scale+") ";
            draw.img.style.Transform = "translate3d("+draw.x+"px, "+draw.y+"px, 0) scale("+scale+") ";
            draw.img.style.zIndex = 10 - (draw.scale);


            if (!draw.img.parentNode){                
                draw.img.id = this.imageWrapper.id + '_' + this.id++;
                this.imageWrapper.appendChild(draw.img);
                this.visibleKeys[draw.img.key] = draw.img.id;
            
            } 
            keepKeys[draw.img.key] = draw.img.id;
        }

        //We have to manually figure out what's in and what's out. 
        for (var k in this.visibleKeys){            
            if (!keepKeys[k]){                
                try {                    
                    var el = deCarta.geId(this.visibleKeys[k]);                    
                    el.parentNode.removeChild(el);
                    this.visibleKeys[k] = false;
                    delete this.visibleKeys[k];
                } catch (e){
                    console.log('CSS3Renderer', e, keepKeys[k], k );
                }
            }
        }

        this.resetCounter ++;
    },
	
    /**
     * @private
     */
    show: function(){
        this.imageWrapper.style.display = 'block';
    },

    /**
     * @private
     */
    hide: function(){
        this.imageWrapper.style.display = 'none';
    }


}


    window.deCarta = deCarta;
    window._dC = deCarta.Core;
    window._dU = deCarta.Utilities;
    deCarta.Mobile = deCarta.Core;
    
    deCarta.Mobile.ZoomControl = deCarta.UI.ZoomControl;
    deCarta.Mobile.PanControl = deCarta.UI.PanControl;
    deCarta.Mobile.CopyrightControl = deCarta.UI.CopyrightControl;
    
})(window);
