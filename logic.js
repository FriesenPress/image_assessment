Image.prototype.widthInInches = function(ppi) {
    return this.width / ppi;
}

Image.prototype.heightInInches = function(ppi) {
    return this.height / ppi;
}



function assessResolution(img, ppi, target_width, target_height, usage) {
    /* args:
       - image: Image object
       - ppi: integer
       - trimSize: object {width: int, height: int}
       - usage: string ['cover', 'interior', 'spread']

       returns:
       - benchmark: float between 0 and 1 which represents the assessed quality of the {image} resolution
         when printed at {ppi} ppi at {trimSize} trim size as a {usage} image.
     */

    var benchmarks = [1, 0.75, 0.5];

    // when defining benchmarks, adjustment is needed to handle case where image is for interior usage
    var adjustForInterior = 0.75;

    // when defining benchmarks, adjustment is needed to handle unique case where image is for spread usage
    var adjustForSpread = (usage === 'spread') ? 2 : 1;

    // assess the image width and height by comparing them to predefined benchmarks for hte purpose of assessment
    for (var i = 0; i < benchmarks.length; i++) {
        var benchmark = benchmarks[i];
        var benchmarkWdith = ppi * target_width * benchmark * adjustForInterior * adjustForSpread;
        var benchmarkHeight = ppi * target_height * benchmark * adjustForInterior;
        console.log('Comparing actual W, H', img.width, img.height, 'to target W, H', benchmarkWdith, benchmarkHeight, '...');
        if ( (img.width >= benchmarkWdith) && (img.height >= benchmarkHeight) ) {
            console.log('Image meets/exceeds benchmark #' + (i+1));
            return benchmark;
        }
    }
    console.log('Image falls below all benchmarks.');
    return 0;
}; // end function assess








function assessAspectRatio(img) {

}



Image.prototype.getAspectRatio = function() {
	var aspectRatio;
	var heightRelativeToWidth = (this.height / this.width).roundTo(1);
	if (heightRelativeToWidth < 1) {
		var widthRelativeToHeight = (this.width / this.height).roundTo(1);
		aspectRatio = widthRelativeToHeight + " : 1";
	} else {
		aspectRatio= "1 : " + heightRelativeToWidth;
	}
	return aspectRatio;
};

Image.prototype.getAspectRatioComment = function(n) {
    var actualWidthAsPctOfHeight = this.width / this.height;

    var targetWidthAsPctOfHeight; // width divided by height
    if (this.imageUsage == 'cover' || this.imageUsage == 'interior') {
        targetWidthAsPctOfHeight = this.selectedTrimSize['width'] / this.selectedTrimSize['height'];
    } else if (this.imageUsage == 'spread') {
        targetWidthAsPctOfHeight = (this.selectedTrimSize['width'] * 2) / this.selectedTrimSize['height'];
    } else {
        targetWidthAsPctOfHeight = 1;
    }

    var comment;
    var labelStyle;
    // WidthAsPctOfHeight.  if 1, the image is a square.  If <1, image is portrait (all trim sizes).  If >1, image is landscape orientation.
    if ( this.imageUsage =='interior') {
        comment = 'Aspect ratio assessment is not applicable to interior images.';
        labelStyle = 'label label-default'
    } else if ( (actualWidthAsPctOfHeight * n) < targetWidthAsPctOfHeight ) {
		comment = 'The image is proportionately taller and skinnier than the target print space.';
		labelStyle = 'label label-danger';
	} else if ( actualWidthAsPctOfHeight > (targetWidthAsPctOfHeight * n) ) {
		comment = 'The image is proportionately shorter and wider than the target print space.';
		labelStyle = 'label label-danger';
	} else {
		comment = 'Actual dimensions are similar to target dimensions.';
		labelStyle = 'label label-success';
	}
	return {'comment': comment, 'labelStyle': labelStyle};
};