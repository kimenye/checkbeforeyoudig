/**
 * @class ImagePack
 * Allows dynamic loading of different image sets depending on resolution.
 *
 *
 * The ImagePack allows you to load a base64 encoded set of images (a "pack").
 * These are generated server-side, either statically with a build tool or
 * dynamically. The content of an imagePack is an object with the following structure
 *<pre>
 * {
 *      "image name" : {
 *          img : "base64 data",
 *          scale: (float)
 *      }
 * }
 *</pre>
 * Each image will be loaded and rescaled to screen size (depending on the DPR of the
 * device) according to the scale paramter. This allows you to load the same pack
 * for different ratios. For example, you could load a pack
 * containing images with a scale of 2. These images will contain *twice as many pixels*
 * as required for display (hence the 2 factor). When displayed on a regular screen
 * the extra data will be discarded, but when displayed on a high res screen
 * they will utilize its full resolution. Of course this works the other way around
 * as well : you can load a pack of low res images with a scale setting of 1, and they
 * will be upscaled on high res screens to display the correct size.
 *
 * A Java tool to generate image packs is provided with the api. Please refer to the
 * documentation in the Tools section of the API distribution.
 * 
 * @description Tool for loading images
 */

deCarta.UI.ImagePack = {

    /**
     * Load a pack.
     * @param pack (string) relative of absolute uri
     * @param onComplete a callback function that will be notified when the pack is ready for use
     *
     */
    load: function(pack, onComplete, forceScript){

        if (typeof onComplete !== 'function')
            deCarta.Core.Exception.raise("Image pack loading requires a callback.");
        

        if (!forceScript && (pack.indexOf('http://') == -1 && window.location.protocol != 'file:' && !deCarta.Window.isIe())) {
            this.loadXHR(pack, onComplete);
        } else {            
            this.loadScript(pack, onComplete);
        }
    },

    loadScript: function(pack, onComplete){        
        var sTag = document.createElement('script');
        var packName = pack.substring(pack.lastIndexOf('/') + 1, pack.lastIndexOf('.'));
        sTag.onload = function(){
            this.importLoadedPack(packName, onComplete);
            sTag.parentNode.removeChild(sTag);
        }.bind(this);

        sTag.onreadystatechange= function (sTag) {
            if (sTag.readyState == 'complete'){
                this.importLoadedPack(packName, onComplete);
                sTag.parentNode.removeChild(sTag);
            }
        }.bind(this, sTag);

        sTag.src = pack;
        document.body.appendChild(sTag);
    },

    loadXHR: function(pack, onComplete){
       /* try {
            netscape.security.PrivilegeManager.enablePrivilege("UniversalPreferencesWrite UniversalBrowserWrite UniversalPreferencesRead UniversalBrowserRead");
        } catch (e) {}*/

        var req = new XMLHttpRequest();
        req.open('GET', pack, true);
        req.onreadystatechange = function (aEvt) {
            if (req.readyState == 4) {
                if(req.status == 200){
                    (new Function(req.responseText + '; window.imagePacks = imagePacks'))();
                    //window.imagePacks = deCarta.Utilities.extendObject(window.imagePacks, imagePacks);
                    var packName = pack.substring(pack.lastIndexOf('/') + 1, pack.lastIndexOf('.'));
                    deCarta.UI.ImagePack.importLoadedPack(packName, onComplete);
                }
                else
                    deCarta.Core.Exception.raise('Error loading resources');

            }
        };
        req.send();
    },

    /**
     * Get an image: returns a clone of the original image for use in the application
     * @param id is the name of the image in the pack
     */
    get: function(id){
        //console.log(id)
        try {
            return this[id].cloneNode(false);
        } catch (e){
            deCarta.App.streamlog('Failed Pin Load', {err: 'pin ' + id + ' is not here.'});
            return false;
        }
    },

    /**
     * @private. 
     */
    importLoadedPack: function(packName, onComplete){
        if (!imagePacks[packName]) {
            deCarta.Core.Exception.raise("Image pack " + packName + " contains no images, or is in the wrong format!");
        }

        var image = null;

        var imageCount = 0;
        for (image in imagePacks[packName]){
            imageCount ++;
        }

        for (image in imagePacks[packName]){

            this[image] = new Image();
            this[image].onload = function(img, packImg) {

                var scale = (packImg.scale) ? packImg.scale : 1;


                //using css pix because of opera
                img.style.width = (img.width / scale) + 'px';
                img.style.height = (img.height / scale) + 'px';

                imageCount --;

                if (imageCount == 0) onComplete();

            }.bind(this, this[image], imagePacks[packName][image]);
            this[image].src = imagePacks[packName][image].img;
        }
        onComplete();
    }


}