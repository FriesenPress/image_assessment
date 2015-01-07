////// DEFAULT VARIABLES

var DEFAULT_ASPECT_RATIO_WARNING_THRESHOLD = 1.5;
var DEFAULT_ENLARGEMENT_TOLERANCE_PCT = 1.25;
var DEFAULT_IMAGE_URL = 'http://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/Shakespeare.jpg/800px-Shakespeare.jpg';
var DEFAULT_INTERIOR_IMAGE_TOLERANCE_PCT = .75;
var DEFAULT_PPI = 300;
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

Image.prototype.requiredResize = function(ppi, targetWidth, targetHeight) {
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

Assessment.prototype.resolutionComment = function(ppi, requiredResize, enlargementTolerancePct) {
    var printWidth = ( this.img.printWidth(ppi) ).toFixed(1);
    var printHeight = ( this.img.printHeight(ppi) ).toFixed(1);
	var baseComment = 	"Assuming no cropping, this image can be printed at up to " +
						printWidth + "\" by " + printHeight + "\" without losing any resolution, " +
						"or at up to about " + (printWidth * enlargementTolerancePct) + "\" by " + (printHeight * enlargementTolerancePct) +
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
    var actualWidthAsPctOfHeight = this.width / this.height;
    var targetWidthAsPctOfHeight; // width divided by height
    if (imageUsage == 'cover' || imageUsage == 'interior') {
        targetWidthAsPctOfHeight = targetWidth / targetHeight;
    } else if (imageUsage == 'spread') {
        targetWidthAsPctOfHeight = ( targetWidth * 2) / targetHeight;
    } else { // shouldn't happen
        targetWidthAsPctOfHeight = 1;
    }
    var comment;
    // WidthAsPctOfHeight.  if 1, the image is a square.  If <1, image is portrait (all trim sizes).  If >1, image is landscape orientation.
    if ( imageUsage =='interior') {
        comment = 'Aspect ratio assessment is not applicable to interior images.';
        return comment;
    } else if ( (actualWidthAsPctOfHeight * warningThreshold) < targetWidthAsPctOfHeight ) {
		comment = 'The image is proportionately taller and skinnier than the target print space.';
	} else if ( actualWidthAsPctOfHeight > (targetWidthAsPctOfHeight * warningThreshold) ) {
		comment = 'The image is proportionately shorter and wider than the target print space.';
	} else {
		comment = 'Actual dimensions are similar to target dimensions.';
	}
	return comment;
};



function initializeForm() {
	//$( "#image-source-form" ).hide();
	$( "#input-url-group" ).hide();
	$( ".assessment-measurements" ).hide();
	$( ".assessment-comment" ).hide();
	$( "#flash" ).hide();
	$( "#aspect-ratio-comment").hide();
	$( ".image-attribute").hide();

	$( ".nailthumb-container" ).nailthumb(
		{width:100,height:100,method:'resize',fitDirection:'center center'}
		);
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


function previewImageFromURL(url) {
    var img = new Image;
    img.src = url;
    setTimeout(function() {
        $( ".nailthumb-container" ).nailthumb({width: 100, height: 100, method: 'resize', fitDirection: 'center center'});
        $( "#input-preview" ).attr('src', url);
        $( ".aspect-ratio" ).text( img.aspectRatioString() );
        $( ".width-value-px" ).text( img.width );
        $( ".height-value-px" ).text( img.height );
        $( ".image-attribute" ).show(); // width in px, height in px, aspectRatio str
    }, 100);
}

function setAspectRatioCommentStyle(img, warningThreshold) {
    // TODO make this label-success or label-danger depending on whether aspect ratio is below or above warning threshold
    return 'label label-default'
}

function assess(img, ppi, targetWidth, targetHeight, imageUsage, aspectRatioWarningThreshold) {
    var requiredResize = img.requiredResize(ppi, targetWidth, targetHeight);
    var aspectRatioString = img.aspectRatioString();
    var assessment = new Assessment(img);
    var resolutionComment = assessment.resolutionComment(DEFAULT_PPI, requiredResize, DEFAULT_ENLARGEMENT_TOLERANCE_PCT);
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
	$( "#aspect-ratio-comment" ).text( aspectRatioComment ).show();
    $( "#aspect-ratio-comment" ).attr( {'class': setAspectRatioCommentStyle(img, aspectRatioWarningThreshold)} );
	$( ".assessment-measurements" ).show();
	$( ".assessment-comment" ).html( "<i class=\"fa fa-fw fa-thumbs-" + thumb + "\"></i>" + resolutionComment).show();
	$( ".progress-bar" ).attr(
		{ 	'class': "progress-bar progress-bar-"+colourStyle,
			'aria-valuenow': progressBarValue,
			'style': "width:"+progressBarValue+"%" }
	);
} // end function assess


$(document).ready(function() {

	initializeForm();

	$( "#image-from-url" ).change(function() {
		if (this.checked) {
			$( "#input-file-group" ).hide();
			$( "#input-url").val(DEFAULT_IMAGE_URL);
			$( "#input-url-group" ).show();
	        $( "#input-preview" ).attr('src', "ph.png");
            $( ".image-attribute").hide();
		}
	});

	$( "#image-from-file" ).change(function() {
		if (this.checked) {
			$( "#input-url-group" ).hide();
			$( "#input-file-group" ).show();
	        $( "#input-preview" ).attr('src', "ph.png");
            $( ".image-attribute").hide();
		}
	});

	$( ".form-group" ).change(function() {
			$( "#flash" ).hide();
			$( ".assessment-measurements" ).hide();
			$( ".assessment-comment" ).hide();
			$( "#aspect-ratio-comment").hide();
			$( ".progress-bar" ).attr({	'class': "progress-bar", 'aria-valuenow': 0, style: "width:0%" });
	});

	$( "#input-file" ).change(function() {
		 if (this.files && this.files[0]) {
	            var reader = new FileReader();
	            reader.onload = function (e) {
	            	$( ".nailthumb-container" ).nailthumb({width:100,height:100,method:'resize',fitDirection:'center center'});
	                $( "#input-preview" ).attr('src', e.target.result);
					var img = new Image();
					img.src = reader.result;
					$( ".aspect-ratio" ).text( img.aspectRatioString() );
					$( ".width-value-px" ).text( img.width );
					$( ".height-value-px" ).text( img.height );
					$( ".image-attribute" ).show(); // width in px, height in px, aspectRatio str
	            };
	            reader.readAsDataURL(this.files[0]);
	        }
	});

	$( "#preview-url" ).on( 'click', function() {
        var url = $( "#input-url" ).val();
        previewImageFromURL(url);
	});

	$( "#assess-image-button" ).on( 'click', function() {
		$( "#flash" ).hide();
		// If the 'image from file' radio button is selected...
        var trimSizeIndex = $( "#trim-size-options" ).find(":selected").val();
        var trimSize = DEFAULT_TRIM_SIZES[trimSizeIndex];
        var imageUsage  = $( "#image-use-form input[type='radio']:checked" ).val();
        var imageSource = $( "#image-source-form input[type='radio']:checked" ).val();
        var targetWidth;
        if (imageUsage == 'interior') {
            targetWidth = trimSize.width * DEFAULT_INTERIOR_IMAGE_TOLERANCE_PCT;
        } else if (imageUsage == 'spread') {
            targetWidth = trimSize.width * 2;
        } else { // 'cover', or any other case
            targetWidth = trimSize.width;
        }
        var targetHeight;
        if (imageUsage == 'interior') {
            targetHeight = trimSize.height * DEFAULT_INTERIOR_IMAGE_TOLERANCE_PCT;
        } else { // 'cover', 'spread', or any other case
            targetHeight = trimSize.height;
        }
        var img = new Image();

        if (imageSource == 'image-from-file') {
			var file = document.getElementById("input-file").files[0];
			if (file.type.match(/image.*/)) {
	  			var reader = new FileReader();
	  			reader.onload = function() {
                    img.src = reader.result;
                    assess(img, DEFAULT_PPI, targetWidth, targetHeight, imageUsage, DEFAULT_ASPECT_RATIO_WARNING_THRESHOLD);
                };
				reader.readAsDataURL(file);
			} else { // user didn't upload a valid image file
				$( "#flash" ).show();
			}
		} else { // user wants to assess an image from a url
            var url = $( "#input-url" ).val();
            var inputPreviewSrc = $( "#input-preview" ).attr( 'src' );
            if (url != inputPreviewSrc) {
                previewImageFromURL(url);
            };
            img.onload = function() {
                assess(img, DEFAULT_PPI, targetWidth, targetHeight, imageUsage, DEFAULT_ASPECT_RATIO_WARNING_THRESHOLD);
            };
            img.src = url;
		}
	});
}); // end of document ready function