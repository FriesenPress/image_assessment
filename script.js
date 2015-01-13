////// DEFAULT VARIABLES

var DEFAULT_ASPECT_RATIO_WARNING_THRESHOLD = 1.5;
var DEFAULT_ENLARGEMENT_TOLERANCE_PERCENT = 1.25;
var DEFAULT_IMAGE_URL = 'http://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/Shakespeare.jpg/800px-Shakespeare.jpg';
var DEFAULT_INTERIOR_IMAGE_TOLERANCE_PERCENT = .75;
var DEFAULT_PPI = 300;
var DEFAULT_PREVIEW_WIDTH = 200;
var DEFAULT_PREVIEW_HEIGHT = 200;
var DEFAULT_PREVIEW_SETTINGS = {width:DEFAULT_PREVIEW_WIDTH,height:DEFAULT_PREVIEW_HEIGHT,method:'resize',fitDirection:'center center'};
var DEFAULT_TRIM_SIZES = [
	{'width': 5, 	'height': 5},
	{'width': 5.5, 	'height': 8.5},
	{'width': 6, 	'height': 9},
	{'width': 7, 	'height': 10},
	{'width': 8.5, 	'height': 8.5},
	{'width': 8.5, 	'height': 11}
];
var PLACEHOLDER_IMAGE = "ph.png";

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

var Assessment = function(img) {
    this.img = img;
};

Assessment.prototype.assessmentComment = function(imageUsage, requiredResize) {
    var assessmentComment;
    if (imageUsage == 'interior') {
        assessmentComment = "";
    } else {
        if (requiredResize <= 0) {
            assessmentComment = "The resolution of this image should be sufficient.";
        } else if (requiredResize <= 0.25) {
            assessmentComment = "Enlargement may be required, but the loss of resolution may not be significant.";
        } else if (requiredResize <= 0.5) {
            assessmentComment = "Enlargement would likely be required which would cause significant loss of quality.  It's recommended to use an image with better resolution.";
        } else {
            assessmentComment = "This is likely too small.  Please use an image with better resolution."
        }
    }
    return assessmentComment;
};

Assessment.prototype.resolutionComment = function(ppi, requiredResize, enlargementTolerancePercent) {
    var printWidth = ( this.img.printWidth(ppi) ).toFixed(1);
    var printHeight = ( this.img.printHeight(ppi) ).toFixed(1);
	var resolutionComment = "Assuming no cropping, this image can be printed at up to " +
						printWidth + "\" by " + printHeight + "\" without losing any resolution, " +
						"or at up to about " + (printWidth * enlargementTolerancePercent) + "\" by " + (printHeight * enlargementTolerancePercent) +
						"\" with some minor loss of quality.\n";
	return resolutionComment;
};


Assessment.prototype.aspectRatioComment = function(imageUsage, targetWidth, targetHeight, warningThreshold) {
    var actualWidthAsPercentOfHeight = this.img.width / this.img.height;
    var targetWidthAsPercentOfHeight; // width divided by height
    if (imageUsage == 'cover' || imageUsage == 'interior') {
        targetWidthAsPercentOfHeight = targetWidth / targetHeight;
    } else if (imageUsage == 'spread') {
        targetWidthAsPercentOfHeight = ( targetWidth * 2) / targetHeight;
    } else { // shouldn't happen
        targetWidthAsPercentOfHeight = 1;
    }
    var comment;
    // WidthAsPercentOfHeight.  if 1, the image is a square.  If <1, image is portrait (all trim sizes).  If >1, image is landscape orientation.
    if ( imageUsage =='interior') {
        return comment;
    } else if ( (actualWidthAsPercentOfHeight * warningThreshold) < targetWidthAsPercentOfHeight ) {
		comment = 'The image is proportionately taller and skinnier than the target print space.';
	} else if ( actualWidthAsPercentOfHeight > (targetWidthAsPercentOfHeight * warningThreshold) ) {
		comment = 'The image is proportionately shorter and wider than the target print space.';
	}
	return comment;
};



function initializeForm() {
	//$( "#image-source-form" ).hide();
    $( "#preview-url").hide();
	$( "#input-url" ).hide();
	$( ".assessment-measurements" ).hide();
	$( ".resolution-comment" ).hide();
	$( ".assessment-comment" ).hide();
    $( "#invalid-source-flash").hide();
	$( "#aspect-ratio-comment" ).hide();
	$( ".image-attribute").hide();
	$( ".nailthumb-container" ).nailthumb(DEFAULT_PREVIEW_SETTINGS);
	$( ".ppi" ).text(DEFAULT_PPI);

	if (window.File && window.FileReader) {
		// Great success! All the File APIs are supported.
	} else {
		// alert('The File APIs are not fully supported in this browser.');
		$( '#image-from-file' ).addClass('disabled');
	}

	// Build the trim size drop-down.
	for (var ts = 0; ts < DEFAULT_TRIM_SIZES.length; ts++) {
		$( "#trim-size-options" ).append($('<option>', {
			value: ts,
			text: DEFAULT_TRIM_SIZES[ts].width + '" x ' + DEFAULT_TRIM_SIZES[ts].height + '"'
		}));
	}
} // end of function initializeForm


function getTargetDimension(dimension, trimSize, imageUsage, interiorImageTolerance) {
    var spreadFactor;
    if (dimension == 'width') {
        spreadFactor = 2;
    } else {
        spreadFactor = 1;
    }

    var targetDimension;
    if (imageUsage == 'interior') {
        targetDimension = trimSize[dimension] * interiorImageTolerance;
    } else if (imageUsage == 'spread') {
        targetDimension = trimSize[dimension] * spreadFactor;
    } else { // 'cover', or any other case
        targetDimension = trimSize[dimension];
    }
    return targetDimension;
}


function previewImageFromURL(src) {
    var previewImg = new Image;
    previewImg.onload = function() {
        $(".nailthumb-container").nailthumb(DEFAULT_PREVIEW_SETTINGS);
        $("#input-preview").attr('src', src);
        $(".aspect-ratio").text(previewImg.aspectRatioString());
        $(".width-value-px").text(previewImg.width);
        $(".height-value-px").text(previewImg.height);
        $(".image-attribute").show(); // width in px, height in px, aspectRatio str
    }
    previewImg.src = src;
}


function assess(img, ppi, imageUsage, imageSource, targetWidth, targetHeight, aspectRatioWarningThreshold, enlargementTolerancePercent) {
    if (imageSource == 'image-from-file') {
        var file = document.getElementById("input-file").files[0];
        if (file.type.match(/image.*/)) {
            var reader = new FileReader();
            reader.onload = function () {
                img.src = reader.result;
                displayAssessment(img, ppi, targetWidth, targetHeight, imageUsage, aspectRatioWarningThreshold, enlargementTolerancePercent);
            };
            reader.readAsDataURL(file);
        } else { // user didn't upload a valid image file
            $( "#invalid-source-flash").show();
        }
    } else { // user wants to assess an image from a url
        var url = getUrlInput();
        var inputPreviewSrc = $( "#input-preview" ).attr( 'src' );
        img.onload = function () {
            if (url != inputPreviewSrc) {
                previewImageFromURL(url);
            }
            displayAssessment(img, ppi, targetWidth, targetHeight, imageUsage, aspectRatioWarningThreshold, enlargementTolerancePercent);
        };
        img.src = url;
    }
}

function displayAssessment(img, ppi, targetWidth, targetHeight, imageUsage, aspectRatioWarningThreshold, enlargementTolerancePercent) {
    var requiredResize = img.requiredResizeToMatchArea(ppi, targetWidth, targetHeight);
    var aspectRatioString = img.aspectRatioString();

    var assessment = new Assessment(img);
    var aspectRatioComment = assessment.aspectRatioComment(imageUsage, targetWidth, targetHeight, aspectRatioWarningThreshold);
    var resolutionComment = assessment.resolutionComment(ppi, requiredResize, enlargementTolerancePercent);
    var assessmentComment = assessment.assessmentComment(imageUsage, requiredResize);

    var colourStyle, progressBarValue, resolutionIcon;
    if (requiredResize < 0) {
        colourStyle = "success";
        progressBarValue = 100;
        resolutionIcon = "<i class=\"fa fa-thumbs-up\"></i>";
    } else if (requiredResize < 0.25) {
        colourStyle = "info";
        progressBarValue = 75;
        resolutionIcon = "<i class=\"fa fa-thumbs-up\"></i>";
    } else if (requiredResize < 0.5) {
        colourStyle = "warning";
        progressBarValue = 50;
        resolutionIcon = "<i class=\"fa fa-thumbs-down\"></i>";
    } else {
        colourStyle = "danger";
        progressBarValue = 25;
        resolutionIcon = "<i class=\"fa fa-thumbs-down\"></i>";
    }

    var printWidth = ( img.printWidth(ppi) ).toFixed(1);
    var printHeight = ( img.printHeight(ppi) ).toFixed(1);

    $( ".width-value-in" ).text( printWidth );
	$( ".height-value-in" ).text( printHeight );
	$( ".aspect-ratio" ).text( aspectRatioString );
	$( ".assessment-measurements" ).show();

	$( ".progress-bar" ).attr(
		{ 	'class': "progress-bar progress-bar-"+colourStyle,
			'aria-valuenow': progressBarValue,
			'style': "width:"+progressBarValue+"%" }
	);

	if (typeof aspectRatioComment !== 'undefined') {
        $("#aspect-ratio-comment").text(aspectRatioComment).show();
    }

    if (imageUsage == 'interior') {
        var sizeRating = img.sizeRating(ppi, targetWidth, targetHeight);
        $(".assessment-comment").html("Image size: " + "<span class=\"size-rating-container\"><strong class=\"size-rating\">" + sizeRating + "</strong></span>").show();
        $( ".resolution-comment" ).html( resolutionComment ).show();
    } else {
        $(".assessment-comment").html(assessmentComment).show();
        $( ".resolution-comment" ).html( resolutionIcon + resolutionComment ).show();
    }

} // end function displayAssessment




// Get the input values

function getTrimSizeInput(trimSizeList) {
    var trimSizeIndex = $( "#trim-size-options" ).find(":selected").val();
    return trimSizeList[trimSizeIndex];
}

function getImageUsageInput() {
    return $( "#image-use-form input[type='radio']:checked" ).val();
}

function getImageSourceInput() {
    return $( "#image-source-form input[type='radio']:checked" ).val();
}


function getUrlInput() {
    return $( "#input-url" ).val();
}





$(document).ready(function() {

	initializeForm();

	$( "#image-from-url" ).change(function() {
		if (this.checked) {
			$( "#input-file" ).hide();
			$( "#input-url").val(DEFAULT_IMAGE_URL);
			$( "#input-url" ).show();
	        $( "#input-preview" ).attr('src', PLACEHOLDER_IMAGE);
            $( ".image-attribute").hide();
		}
	});

	$( "#image-from-file" ).change(function() {
		if (this.checked) {
			$( "#input-url" ).hide();
			$( "#input-file" ).show();
	        $( "#input-preview" ).attr('src', PLACEHOLDER_IMAGE);
            $( ".image-attribute").hide();
		}
	});

	$( ".form-group" ).change(function() {
            $( "#invalid-source-flash").hide();

			$( ".assessment-measurements" ).hide();
			$( ".resolution-comment" ).hide();
			$( ".assessment-comment" ).hide();
        	$( "#aspect-ratio-comment").hide();
			$( ".progress-bar" ).attr({	'class': "progress-bar", 'aria-valuenow': 0, style: "width:0%" });
	});

	$( "#input-file" ).change(function() {
        if (this.files && this.files[0]) {
	        var reader = new FileReader();
            reader.onload = function (e) {
                var src = e.target.result;
                previewImageFromURL(src);
	            };
            reader.readAsDataURL(this.files[0]);
        }
	});


	$( "#assess-image-button" ).on( 'click', function() {
        $( "#invalid-source-flash").hide();
        var img = new Image();

        var imageSource = getImageSourceInput();

        var trimSize = getTrimSizeInput(DEFAULT_TRIM_SIZES);
        var imageUsage = getImageUsageInput();
        var targetWidth = getTargetDimension('width', trimSize, imageUsage, DEFAULT_INTERIOR_IMAGE_TOLERANCE_PERCENT);
        var targetHeight = getTargetDimension('height', trimSize, imageUsage, DEFAULT_INTERIOR_IMAGE_TOLERANCE_PERCENT);

        assess(img, DEFAULT_PPI, imageUsage, imageSource, targetWidth, targetHeight, DEFAULT_ASPECT_RATIO_WARNING_THRESHOLD, DEFAULT_ENLARGEMENT_TOLERANCE_PERCENT);
	});

}); // end of document ready function