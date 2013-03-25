/**
 * @class ZoomControl - Add a zoom control to the map to present the user
 * with zoom in / zoom out buttons.
 * This class inherits from {@link deCarta.UI.MapControl}.
 *
 * @description Zoom Map Control
 *
 * @constructor
 * @param opt Options A list of options with which to initialize the ZoomControl.
 * Valid options are:
 * <ul>
 *   <li>(string) position: (Inherited from {@link deCarta.UI.MapControl}), which should
 *       be set to one of: 'topLeft', 'topRight', 'bottomLeft', 'bottomRight' (default='topLeft')</li>
 *   <li>(bool) continuousZoom: in case of desktop style, zoom will be continuous if the zoom handle is dragged.
 *   Performance intensive. Use appropriately. </li>
 *   <li>(bool) autoResize: If this options is set, the zoom controller will collapse to the zoomin / out 
 *   buttons only if there isn't sufficient space for the full element. Default: true </li> 
 * </ul>
 * To style this control, edit the corresponding CSS file in the css/UI dir.
 *
 * @see deCarta.UI.MapControl
 * @see deCarta.Core.Map
 */

deCarta.UI.ZoomControl = function(opt){
    this.options = {
        autoResize: true,
        continuousZoom : true,
        cssClass : 'deCarta-control-zoom',
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
            return {
                top: top,
                left: 20
            }
        }
    }

    this.options = deCarta.Utilities.extendObject(this.options, opt);

    deCarta.UI.MapControl.call(this, this.options);

}


//Define methods to extend ZoomControl
deCarta.UI.ZoomControl.prototype = {

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
        this.contentElement.className = 'deCarta-control-zoom';
        if(this.options.cssClass !== this.contentElement.className){
            this.contentElement.className = this.contentElement.className + ' ' + this.options.cssClass;
        }
        this.domElement.className = "domElement";

        this.zoomIn = document.createElement('div');
        this.zoomOut = document.createElement('div');

        this.zoomLevels = this.options.map.maxZoom - this.options.map.minZoom + 1; //[]
        this.zoomOfs = this.options.map.minZoom;

        this.makeControl();

        this.zoomIn.onclick = function(){
            this.options.map.zoomIn();
        }.bind(this);

        this.zoomOut.onclick = function(){
            this.options.map.zoomOut();
        }.bind(this);

        this.ready = true;
    },

    /**
     * @private
     * renders the control with a desktop look.
     */
    makeControl: function(){
        this.positionCursor = function(){

            if (this.cursor)
                this.cursor.style.top = ((this.zoomLevels - this.options.map.zoom + this.zoomOfs -1) * 10 ) + 'px';

        }.bind(this);

        this.options.map.onzoomend(this.positionCursor);

        this.zoomIn.className = "deCarta-control-zoomInBtn"

        this.zoomOut.className = "deCarta-control-zoomOutBtn"

        var self = this;
        function zoomFromY(y){
            return (self.zoomLevels + self.zoomOfs - (y / 10));
        }

        this.pillar = document.createElement('div');
        this.pillar.className = "deCarta-control-zoomPillar";
        this.pillar.unselectable = 'on';

        this.pillar.style.height = (10 * this.zoomLevels)  + 'px'

        this.cursor = document.createElement('div');
        this.cursor.unselectable = 'on';
        this.cursor.className = "deCarta-control-zoomCursor";

        deCarta.Touch.attachListener('touchstart', this.pillar, function(ev, oev){
            this.cursorDragging = true;
            this.pillar.style.cursor = 'url("img/closedhand.cur"), auto';
            this.cursor.style.cursor = 'url("img/closedhand.cur"), auto';
            //prevent the defaults 
            if (oev && oev.preventDefault) oev.preventDefault();
            if (oev && oev.stopPropagation) oev.stopPropagation();
            if (oev && oev.stopImmediatePropagation) oev.stopImmediatePropagation();            
        }.bind(this), false);

        deCarta.Touch.attachListener('touchmove', document.body, function(ev, oev){

            if (!this.cursorDragging) 
                return false;
            var y = ev.pageY - deCarta.Utilities.domPosition(this.pillar).top;
            //console.log(y, oev.pageY, deCarta.Utilities.domPosition(this.pillar).top, ev.pageY, oev);
            if (this.options.continuousZoom) {
                this.options.map.zoomTo(zoomFromY(y), null, true);
            }

            //prevent the defaults 
            if (oev && oev.preventDefault) oev.preventDefault();
            if (oev && oev.stopPropagation) oev.stopPropagation();
            if (oev && oev.stopImmediatePropagation) oev.stopImmediatePropagation();

        }.bind(this), false);

        deCarta.Touch.attachListener('touchend', document.body, function (ev, oev){
            if (this.cursorDragging){

                this.pillar.style.cursor = 'url("img/openhand.cur"), auto';
                this.cursor.style.cursor = 'url("img/openhand.cur"), auto';

                this.cursorDragging = false;
                var y = ev.pageY - deCarta.Utilities.domPosition(this.pillar).top;
                var level = zoomFromY(y);

                this.options.map.zoomTo(Math.round(level), null, true);

            }
        }.bind(this), false);

        var out = function(e){
            if (!this.cursorDragging) return;
            if (!e.relatedTarget) e.relatedTarget = e.toElement;
            if (!(e.relatedTarget == this.cursor || e.relatedTarget == this.pillar)){

                this.cursorDragging = false;
                this.pillar.style.cursor = 'url("img/openhand.cur"), auto';
                this.cursor.style.cursor = 'url("img/openhand.cur"), auto';
                var y = parseInt(this.cursor.style.top) + 10;
                this.options.map.zoomTo(Math.round(zoomFromY(y)));
            }

        }.bind(this);

        if (deCarta.Window.isIe())
            this.options.map.canvas.attachEvent('onmouseout', out);
        else
            this.options.map.canvas.addEventListener('mouseout', out, true);

        this.pillar.appendChild(this.cursor);

        this.contentElement.appendChild(this.zoomIn);
        this.contentElement.appendChild(this.pillar);
        this.contentElement.appendChild(this.zoomOut);

        this.positionCursor();

        this.unbridledHeight = this.height = parseFloat(this.pillar.style.height) + (27 * 2);

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

    resize: function(event){

        var height = this.calculateAvailableHeight();

        if(!this.options.autoResize || !this.ready) return;

        if(this.pillar && this.pillar.tagName=='DIV'){
            if(this.unbridledHeight > height){
                this.pillar.style.display='none';
            }else{
                this.pillar.style.display='block';
            }
        }

        this.height = this.domElement.offsetHeight;
    },

    calculateAvailableHeight: function(){
        var allHeight = this.options.map.height;
        var myPlace = this.getPlacement();
        for (var i = 0; i < this.options.map.controls.length; i++){
            if (this.options.map.controls[i] == this) continue;
            var place = this.options.map.controls[i].getPlacement();
            //check if c is above / below
            var overlap =
            (place.left <= myPlace.left && place.right >= myPlace.right) ||
            (place.right >= myPlace.left && place.right <= myPlace.right) ||
            (place.left >= myPlace.left && place.left <= myPlace.right);


            if (overlap) allHeight -= place.height;
        }
        return allHeight;
    }



}; //end ZoomControl prototype

//Extend the MapControl with the additional methods for ZoomControl
deCarta.UI.ZoomControl.prototype = deCarta.Utilities.inherit(deCarta.UI.ZoomControl.prototype, deCarta.UI.MapControl.prototype);