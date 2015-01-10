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


var Assessment = function(img) {
    this.img = img;
};

Assessment.prototype.resolutionComment = function(ppi, requiredResize, enlargementTolerancePercent) {
    var printWidth = ( this.img.printWidth(ppi) ).toFixed(1);
    var printHeight = ( this.img.printHeight(ppi) ).toFixed(1);
	var baseComment = 	"Assuming no cropping, this image can be printed at up to " +
						printWidth + "\" by " + printHeight + "\" without losing any resolution, " +
						"or at up to about " + (printWidth * enlargementTolerancePercent) + "\" by " + (printHeight * enlargementTolerancePercent) +
						"\" with some minor loss of quality.\n\n";
    var specificComment;
    if (requiredResize <= 0) {
        specificComment = "The resolution of this image should be sufficient.";
    } else if (requiredResize <= 0.25) {
        specificComment = "Enlargement may be required, but the loss of resolution may not be significant.";
    } else if (requiredResize <= 0.5) {
        specificComment = "Enlargement would likely be required which would cause significant loss of quality.  It's recommended to use an image with better resolution.";
    } else {
		specificComment = "This is likely too small.  Please use an image with better resolution."
	}
	return baseComment + specificComment;
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
    var img = new Image;
    img.src = src;
    $( ".nailthumb-container" ).nailthumb(DEFAULT_PREVIEW_SETTINGS);
    $( "#input-preview" ).attr('src', src);
    $( ".aspect-ratio" ).text( img.aspectRatioString() );
    $( ".width-value-px" ).text( img.width );
    $( ".height-value-px" ).text( img.height );
    $( ".image-attribute" ).show(); // width in px, height in px, aspectRatio str
}


function initializeAssessment() {
    $( "#invalid-source-flash").hide();


    var trimSize = getTrimSizeInput(DEFAULT_TRIM_SIZES);
    var imageUsage = getImageUsageInput();
    var imageSource = getImageSourceInput();

    var targetWidth = getTargetDimension('width', trimSize, imageUsage, DEFAULT_INTERIOR_IMAGE_TOLERANCE_PERCENT);
    var targetHeight = getTargetDimension('height', trimSize, imageUsage, DEFAULT_INTERIOR_IMAGE_TOLERANCE_PERCENT);

    var img = new Image();

    if (imageSource == 'image-from-file') {
        var file = document.getElementById("input-file").files[0];
        if (file.type.match(/image.*/)) {
            var reader = new FileReader();
            reader.onload = function () {
                img.src = reader.result;
                assess(img, DEFAULT_PPI, targetWidth, targetHeight, imageUsage, DEFAULT_ASPECT_RATIO_WARNING_THRESHOLD);
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
            assess(img, DEFAULT_PPI, targetWidth, targetHeight, imageUsage, DEFAULT_ASPECT_RATIO_WARNING_THRESHOLD);
        };
        img.src = url;
    }
}

function assess(img, ppi, targetWidth, targetHeight, imageUsage, aspectRatioWarningThreshold) {
    var requiredResize = img.requiredResizeToMatchArea(ppi, targetWidth, targetHeight);
    var aspectRatioString = img.aspectRatioString();
    var assessment = new Assessment(img);
    var resolutionComment = assessment.resolutionComment(DEFAULT_PPI, requiredResize, DEFAULT_ENLARGEMENT_TOLERANCE_PERCENT);
    var aspectRatioComment = assessment.aspectRatioComment(imageUsage, targetWidth, targetHeight, aspectRatioWarningThreshold);
    var colourStyle, progressBarValue, thumb;
    if (requiredResize < 0) {
        colourStyle = "success";
        progressBarValue = 100;
        thumb = 'up';
    } else if (requiredResize < 0.25) {
        colourStyle = "info";
        progressBarValue = 75;
        thumb = 'up';
    } else if (requiredResize < 0.5) {
        colourStyle = "warning";
        progressBarValue = 50;
        thumb = 'down';
    } else {
        colourStyle = "danger";
        progressBarValue = 25;
        thumb = 'down';
    }

    $( ".width-value-in" ).text( ( img.printWidth(ppi) ).toFixed(1) );
	$( ".height-value-in" ).text( ( img.printHeight(ppi) ).toFixed(1) );
	$( ".aspect-ratio" ).text( aspectRatioString );
	if (typeof aspectRatioComment !== 'undefined') {
        $("#aspect-ratio-comment").text(aspectRatioComment).show();
    }
	$( ".assessment-measurements" ).show();
	$( ".assessment-comment" ).html( "<i class=\"fa fa-fw fa-thumbs-" + thumb + "\"></i>" + resolutionComment).show();
	$( ".progress-bar" ).attr(
		{ 	'class': "progress-bar progress-bar-"+colourStyle,
			'aria-valuenow': progressBarValue,
			'style': "width:"+progressBarValue+"%" }
	);
} // end function assess




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
	        $( "#input-preview" ).attr('src', "ph.png");
            $( ".image-attribute").hide();
		}
	});

	$( "#image-from-file" ).change(function() {
		if (this.checked) {
			$( "#input-url" ).hide();
			$( "#input-file" ).show();
	        $( "#input-preview" ).attr('src', "ph.png");
            $( ".image-attribute").hide();
		}
	});

	$( ".form-group" ).change(function() {
            $( "#invalid-source-flash").hide();

			$( ".assessment-measurements" ).hide();
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
        initializeAssessment();
	});

}); // end of document ready function