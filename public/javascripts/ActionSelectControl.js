/**
 * @class
 * Add a Select control to the map.
 * This class inherits from {@link deCarta.UI.MapControl}.
 *
 * @description Select Map Control
 *
 * The ActionSelectControl allows the user to select an area of the map by drawing around it,
 * and then zoom to it.
 * This class inherits from {@link deCarta.UI.MapControl}.
 * @param opt Options A list of options with which to initialize the ScaleControl.
 * Valid options are:
 * <ul>
 *   <li>(string) position: (Inherited from {@link deCarta.UI.MapControl}), which should
 *       be set to one of: 'topLeft', 'topRight', 'bottomLeft', 'bottomRight'
 *       (default='bottomRight')</li>
 * </ul>
 * <b>NOTE:</b> This control uses the HTML5 canvas element, and therefore does not work in IE8 - .
 * It will work if used with iecanvas.
 * To style this control, edit the corresponding CSS file in the css/UI dir.
 * @see deCarta.UI.MapControl
 * @see deCarta.Core.Map
 */


deCarta.UI.ActionSelectControl = function(opt){

    this.options = {
        layout: function(width, height, existingControls){
            return {top: 10, left: 10}
        },
        cssClass : 'deCarta-control-select',
        markerColor: 'rgba(0,153,255,0.4)',
        markerWidth: 3
    }

    this.options = deCarta.Utilities.extendObject(this.options, opt);
    this.options.callback = opt.callback;

    deCarta.UI.MapControl.call(this, this.options);
    this.active = false;

}


//Define methods to extend ZoomControl
deCarta.UI.ActionSelectControl.prototype = {

    initElements: function(){

        // if (this.img) return; //exists already ...
        // this.domElement = document.createElement('div');
        // this.domElement.style.position = 'absolute';
        // this.domElement.style.display = "block";

        // this.domElement.className = 'deCarta-control-select';
        // if(this.options.cssClass !== this.domElement.className){
        //     this.domElement.className = this.domElement.className + ' ' + this.options.cssClass;
        // }

        this.domElement = document.createElement('div');
        this.contentElement = document.createElement('div');
        this.domElement.style.position = 'absolute';
        this.contentElement.className = 'deCarta-control-select deCarta-control-select-off';
        if(this.options.cssClass !== this.contentElement.className){
            this.contentElement.className = this.contentElement.className + ' ' + this.options.cssClass;
        }
        this.domElement.className = "domElement";
        this.mapCanvas = this.options.map.canvas;

        this.mapDomPos = deCarta.Utilities.domPosition(this.mapCanvas);

        this.drawingBoard = document.createElement('div');
        this.drawingBoard.id = 'SelectControl-DrawingBoard';
        this.drawingBoard.style.display = 'none';
        this.drawingBoard.style.cursor = 'url("img/pen.cur"), auto !important';

        this.drawingCanvas = document.createElement('canvas');
        this.drawingCanvas.id = 'SelectControl-Drawing';
        this.drawingBoard.appendChild(this.drawingCanvas);

        this.mapCanvas.parentNode.insertBefore(this.drawingBoard, this.mapCanvas);

        deCarta.Touch.attachListener('touchstart', this.drawingBoard, this.startDrawing.bind(this), true);
        deCarta.Touch.attachListener('touchend', this.drawingBoard, this.endDrawing.bind(this), true);
        deCarta.Touch.attachListener('touchmove', this.drawingBoard, this.draw.bind(this), true);
        deCarta.Touch.attachListener('tap', this.domElement, this.handleTap.bind(this), true);
        this.ready = true;
    },

    handleTap: function(){
        // this code was not working
        // ...        
        // if (this.active){
        //     this.drawingBoard.style.display = 'none';
        //     this.active = false; 
        //     this.contentElement.className = this.contentElement.className;
        //     return;
        // } 
        this.active = true;

        var base = this.contentElement.className;
        base=base.substring(0,base.indexOf(" "));
        this.contentElement.className =  base + ' deCarta-control-select-on';
        try {
            deCarta.Utilities.extendStyle(this.drawingBoard.style, this.mapCanvas.style);
            this.drawingBoard.style.width = this.mapCanvas.style.width;
            this.drawingBoard.style.height = this.mapCanvas.style.height;
            this.drawingBoard.style.cursor = 'url("img/pen.cur"), auto';
            this.drawingBoard.style.display = 'block';
            this.drawingBoard.style.zIndex = 21474836476;
            this.drawingCanvas.width = parseInt(this.drawingBoard.style.width);
            this.drawingCanvas.height = parseInt(this.drawingBoard.style.height);
        } catch (e){
            console.log(e.message);
        }
    },

    startDrawing: function(e, ev){

        this.BB = null;
        this.drawing = true;
        this.ctx = this.drawingCanvas.getContext("2d");
        this.ctx.beginPath();
        this.points = [];
        var px = e.pageX - this.mapDomPos.left;
        var py = e.pageY - this.mapDomPos.top;

        this.lastPoint = {x: px, y: py};
        this.ctx.moveTo(px, py);
        this.ctx.strokeStyle = this.options.markerColor;
        this.ctx.lineWidth = this.options.markerWidth;
        this.points.push(this.lastPoint);

        return false;
    },

    endDrawing: function (e, ev){
        this.drawing = false;

        var px = e.pageX - this.mapDomPos.left;
        var py = e.pageY - this.mapDomPos.top;

        var point = {x: px, y: py};
        //this.points.push(point); //somehow this is 0,0 on ipad. 

        this.center = this.findCentroid();
        this.angleSum = this.findAngleSum();

        if (this.angleSum > 300){
            var center = this.findCenter();

            var zoom = this.findZoom();

            //hide and zoom the map.
            this.drawingBoard.style.display = 'none';
            this.active = false;

            var base = this.contentElement.className;
            base = base.substring(0,base.indexOf(" "));
            this.contentElement.className =  base + ' deCarta-control-select-off';

            this.options.map.zoomTo(zoom, null, true);
            this.options.map.centerOn(center, {animated: false});


            if (this.options.callback) {
                var func = _.bind(this.options.callback,null, this.getBB());
                func();
            }


            return;

        }
        return false;
    },

    draw: function( e, ev){
        try{
            if (!this.drawing) return;

            var px = e.pageX - this.mapDomPos.left;
            var py = e.pageY - this.mapDomPos.top;

            var point = {x: px, y: py};

            this.ctx.lineTo(point.x, point.y);
            this.ctx.stroke();
            var dist = deCarta.Utilities.pixelDistance(this.lastPoint, point);
            if (dist >=10){
                this.points.push(point);
                this.lastPoint = point;

            }
        }catch(e){
            alert(e)
        }

        return false;
    },

    getBB: function(){
        var minX = 999999999999999;
        var minY = 999999999999999;
        var maxX = 0;
        var maxY = 0;

        for (var i = 1 ; i < this.points.length; i++){
            if (this.points[i].x < minX) minX = this.points[i].x ;
            if (this.points[i].x > maxX) maxX = this.points[i].x ;
            if (this.points[i].y < minY) minY = this.points[i].y ;
            if (this.points[i].y > maxY) maxY = this.points[i].y ;
        }

        this.topLeftPoint = this.options.map.positionFromXY(minX, minY);
        this.btmRightPoint = this.options.map.positionFromXY(maxX, maxY);

        this.BB = new deCarta.Core.BoundingBox(this.topLeftPoint, this.btmRightPoint);
        return this.BB;
    },

    findCentroid: function(){
        var centerX = 0;
        var centerY = 0;
        for (var i = 0 ; i < this.points.length; i++){
            centerX += this.points[i].x;
            centerY += this.points[i].y;
        }
        centerX /= this.points.length;
        centerY /= this.points.length;
        return {x: centerX, y: centerY};
    },

    findAngleSum: function(){
        var sum = 0;
        var lastAngle = deCarta.Utilities.getAnglePx(this.center,this.points[0], false);
        for (var i = 1 ; i < this.points.length; i++){
            var ang = deCarta.Utilities.getAnglePx( this.center,this.points[i], false);
            var delta = lastAngle - ang;
            if (delta < 0) delta = 0;
            sum +=  delta;

            lastAngle = ang;

        }
        return sum;
    },

    findCenter: function(){

        if (!this.BB) this.getBB();
        return this.BB.getCenter();
    },

    findZoom: function(){
        if (!this.BB) this.getBB();
        return this.BB.getIdealCenterAndZoom(this.options.map).zoom;
    },

    render: function(container){

        // if (!this.ready) this.initElements();
        // container.appendChild( this.domElement );

        if (!this.ready) this.initElements();
        this.domElement.appendChild( this.contentElement );
        container.appendChild( this.domElement );
        this.width = this.domElement.offsetWidth;
        this.height = this.domElement.offsetHeight;
    }
}

deCarta.UI.ActionSelectControl.prototype = deCarta.Utilities.inherit(deCarta.UI.ActionSelectControl.prototype, deCarta.UI.MapControl.prototype);