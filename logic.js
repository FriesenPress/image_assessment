

Image.prototype.printWidth = function(ppi) {
    return this.width / ppi;
};

Image.prototype.printHeight = function(ppi) {
    return this.height / ppi;
};

Image.prototype.requiredResize = function(img, ppi, targetWidth, targetHeight) {
    // Returns the percentage the image must be resized to fully cover the target area at the given ppi.
    return Math.max((targetWidth * ppi - img.width) / img.width, (targetHeight * ppi - img.height) / img.height);
};

Image.prototype.similarity = function(img, targetWidth, targetHeight) {
    // Returns the
}

// TEST
    var img = new Image();
    //img.src = 'http://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/Shakespeare.jpg/800px-Shakespeare.jpg';
    img.src = 'http://map.gsfc.nasa.gov/media/060915/060915_CMB_Timeline600nt.jpg'
    img.onload = function() {
        console.log(requiredResizePct(img, 1, 9280, 4960));
    };