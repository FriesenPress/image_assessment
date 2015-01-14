// Image functions

Image.prototype.printWidth = function(ppi) {
    return this.width / ppi;
};

Image.prototype.printHeight = function(ppi) {
    return this.height / ppi;
};

Image.prototype.requiredResizeToMatchArea = function(ppi, targetWidth, targetHeight) {
    // Returns the percentage the image must be resized to fully cover the target area at the given ppi.
    return Math.max((targetWidth * ppi - this.width) / this.width, (targetHeight * ppi - this.height) / this.height);
};

Image.prototype.aspectRatioString = function() {
	var aspectRatio;
	var heightRelativeToWidth = (this.height / this.width).toFixed(1);
	if (heightRelativeToWidth < 1) {
		var widthRelativeToHeight = (this.width / this.height).toFixed(1);
		aspectRatio = widthRelativeToHeight + " : 1";
	} else {
		aspectRatio= "1 : " + heightRelativeToWidth;
	}
	return aspectRatio;
};

Image.prototype.sizeRating = function(ppi, targetWidth, targetHeight) {
    var printWidth = this.printWidth(ppi);
    var printHeight = this.printHeight(ppi);
    var rating;
    if (printWidth >= targetWidth && printHeight >= targetHeight ) {
        rating = 'XL';
    } else if (printWidth >= targetWidth*.75 && printHeight >= targetHeight*.75 ) {
        rating = 'L';
    } else if (printWidth >= targetWidth*.5 && printHeight >= targetHeight*.5 ) {
        rating = 'M';
    } else if (printWidth >= targetWidth*.25 && printHeight >= targetHeight*.25 ) {
        rating = 'S';
    } else {
        rating = 'XS';
    }
    return rating;
};


Image.prototype.printSizeComment = function(ppi, enlargementTolerancePercent) {
    var printWidth = ( this.printWidth( ppi) ).toFixed(1);
    var printHeight = ( this.printHeight( ppi) ).toFixed(1);
	return "This image can be printed at up to " +
						printWidth + "\" by " + printHeight + "\" without losing any resolution, " +
						"or at up to about " + (printWidth * enlargementTolerancePercent) + "\" by " + (printHeight * enlargementTolerancePercent) +
						"\" with some minor loss of quality.\n";
};


Image.prototype.assessmentComment = function(requiredResize) {
    var assessmentComment;
    if (requiredResize <= 0) {
        assessmentComment = "The resolution of this image should be sufficient.";
    } else if (requiredResize <= 0.25) {
        assessmentComment = "Enlargement may be required, but the loss of resolution may not be significant.";
    } else if (requiredResize <= 0.5) {
        assessmentComment = "Enlargement would likely be required which would cause significant loss of quality.  It's recommended to use an image with better resolution.";
    } else {
        assessmentComment = "This is likely too small.  Please use an image with better resolution."
    }
    return assessmentComment;
};

Image.prototype.aspectRatioWarningThresholdExceeded = function(targetWidth, targetHeight, warningThreshold) {
    var actualWidthAsPercentOfHeight = this.width / this.height;
    var targetWidthAsPercentOfHeight = targetWidth / targetHeight;
    console.log(actualWidthAsPercentOfHeight, targetWidthAsPercentOfHeight)
    return Boolean((actualWidthAsPercentOfHeight * warningThreshold) < targetWidthAsPercentOfHeight || actualWidthAsPercentOfHeight > (targetWidthAsPercentOfHeight * warningThreshold));
};

Image.prototype.aspectRatioComment = function(targetWidth, targetHeight, warningThreshold) {
    var actualWidthAsPercentOfHeight = this.width / this.height;
    var targetWidthAsPercentOfHeight = targetWidth / targetHeight;
    var comment;
    // WidthAsPercentOfHeight.  if 1, the image is a square.  If <1, image is portrait (all trim sizes).  If >1, image is landscape orientation.
    if ( (actualWidthAsPercentOfHeight * warningThreshold) < targetWidthAsPercentOfHeight ) {
		comment = 'The image is proportionately taller and skinnier than the target print space.';
	} else if ( actualWidthAsPercentOfHeight > (targetWidthAsPercentOfHeight * warningThreshold) ) {
		comment = 'The image is proportionately shorter and wider than the target print space.';
	} else { // shouldn't happen
	    comment = 'The image aspect ratio is within tolerance.';
	}
	return comment;
};