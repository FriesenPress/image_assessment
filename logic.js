

Image.prototype.widthInInches = function(ppi) {
    return this.width / ppi;
}

Image.prototype.heightInInches = function(ppi) {
    return this.height / ppi;
}

function get_benchmarks(usage) {
    var benchmarks = [1, 0.75, 0.5];
    // when defining benchmarks, adjustment is needed to handle case where image is for interior usage
    var adjustForInterior = 0.75;
    // when defining benchmarks, adjustment is needed to handle unique case where image is for spread usage
    var adjustForSpread = (usage === 'spread') ? 2 : 1;


}


function longVersion(img, ppi, targetWidth, targetHeight) {
    console.log('image width:', img.width, 'target width:', targetWidth*ppi);
    console.log('image height:', img.height, 'target height:', targetHeight*ppi);
    var imgWidthDiffAsPct = (targetWidth * ppi - img.width) / img.width; // .125
    var imgHeightDiffAsPct = (targetHeight * ppi - img.height) / img.height; // 1.25
    console.log('% that image width must change to match target (lower is better):', (imgWidthDiffAsPct*100).toFixed()+'%');
    console.log('% that image height must change to match target (lower is better):', (imgHeightDiffAsPct*100).toFixed()+'%');
    if (imgWidthDiffAsPct <= 0 && imgHeightDiffAsPct <= 0) { // image fully covers target area
        if (imgWidthDiffAsPct > imgHeightDiffAsPct) {
            return imgWidthDiffAsPct;
        } else {
            return imgHeightDiffAsPct;
        }
    } else if (imgWidthDiffAsPct > 0 || imgHeightDiffAsPct > 0) { // one or both sides of the image are too short
        if (imgWidthDiffAsPct > imgHeightDiffAsPct) {
            return imgWidthDiffAsPct;
        } else {
            return imgHeightDiffAsPct;
        }
    }
};

function getPctImageMustBeResizedToMatchTarget(img, ppi, targetWidth, targetHeight) {
    return Math.max((targetWidth * ppi - img.width) / img.width, (targetHeight * ppi - img.height) / img.height);
}

// TEST
    var img = new Image();
    //img.src = 'http://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/Shakespeare.jpg/800px-Shakespeare.jpg';
    img.src = 'http://map.gsfc.nasa.gov/media/060915/060915_CMB_Timeline600nt.jpg'
    img.onload = function() {
        console.log(longVersion(img, 1, 9280, 4960));
        console.log(getPctImageMustBeResizedToMatchTarget(img, 1, 9280, 4960));
    };