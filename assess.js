////// DEFAULT VARIABLES

var DEFAULT_PPI = 300;
var DEFAULT_ENLARGEMENT_TOLERANCE_PCT = 1.25;
var DEFAULT_ASPECT_RATIO_WARNING_THRESHOLD = 1.5;
var SAMPLE_IMAGE_URL = 'http://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/Shakespeare.jpg/800px-Shakespeare.jpg';
var TRIM_SIZES = [
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
    return Math.max((targetWidth * ppi - img.width) / img.width, (targetHeight * ppi - img.height) / img.height);
};

Image.prototype.resolutionAssessmentComment = function(requiredResize) {
	var baseComment = 	"Assuming no cropping, this image can be printed at up to " +
						this.printWidth(ppi) + "\" by " + this.printHeight(ppi) + "\" without losing any resolution, " +
						"or at up to about " + (this.printWidth(ppi) * DEFAULT_ENLARGEMENT_TOLERANCE_PCT) + "\" by " + (this.printHeight(ppi) * DEFAULT_ENLARGEMENT_TOLERANCE_PCT) +
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
	};
	return baseComment + specificComment;
};

Image.prototype.aspectRatioString = function() {
	var aspectRatio;
	var heightRelativeToWidth = (this.height / this.width).toFixed();
	if (heightRelativeToWidth < 1) {
		var widthRelativeToHeight = (this.width / this.height).toFixed();
		aspectRatio = widthRelativeToHeight + " : 1";
	} else {
		aspectRatio= "1 : " + heightRelativeToWidth;
	}
	return aspectRatio;
};

Image.prototype.aspectRatioAssessmentComment = function(imageUsage, targetWidth, targetHeight, warning_threshold) {
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
    } else if ( (actualWidthAsPctOfHeight * warning_threshold) < targetWidthAsPctOfHeight ) {
		comment = 'The image is proportionately taller and skinnier than the target print space.';
	} else if ( actualWidthAsPctOfHeight > (targetWidthAsPctOfHeight * warning_threshold) ) {
		comment = 'The image is proportionately shorter and wider than the target print space.';
	} else {
		comment = 'Actual dimensions are similar to target dimensions.';
	}
	return comment;
};

Image.prototype.report = function(resolutionAssessmentComment, aspectRatioString, aspectRatioAssessmentComment) {
	$( ".width-value-in" ).text(this.printWidth());
	$( ".height-value-in" ).text(this.printHeight());
	$( ".aspect-ratio" ).text( aspectRatioString );
	$( "#aspect-ratio-comment" ).text( aspectRatioAssessmentComment ).show();
    $( "#aspect-ratio-comment" ).attr( {'class': setAspectRatioAssessmentStyle()} );
	$( ".assessment-measurements" ).show();
	$( ".assessment-comment" ).html( resolutionAssessmentComment ).show();
	logAssessment(this);
	drawProgressBar(this);
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
	for (var ts = 0; ts < TRIM_SIZES.length; ts++) {
		$( "#trim-size-options" ).append($('<option>', {
			value: ts,
			text: TRIM_SIZES[ts].width + '" x ' + TRIM_SIZES[ts].height + '"'
		}));
	}
} // end of function initializeForm

function previewImageFromURL(url) {
    var img = new Image;
    img.src = url;
    setTimeout(function() {
        $( ".nailthumb-container" ).nailthumb({width: 100, height: 100, method: 'resize', fitDirection: 'center center'});
        $( "#input-preview" ).attr('src', url);
        $( ".aspect-ratio" ).text( img.getAspectRatio() );
        $( ".width-value-px" ).text( img.width );
        $( ".height-value-px" ).text( img.height );
        $( ".image-attribute" ).show(); // width in px, height in px, aspectRatio str
    }, 100);
}

function setAspectRatioAssessmentStyle(img, warningThreshold) {
    // TODO make this label-success or label-danger depending on whether aspect ratio is below or above warning threshold
    return 'label label-default'
}

function drawProgressBar(img) {
	var result = img.result;
	$( ".progress-bar" ).attr(
		{ 	'class': "progress-bar progress-bar-"+ setProgressBarStyle, // e.g. success, info, warning, danger
			'aria-valuenow': img.resultProperties[result]['progressBarValue'],
			'style': "width:"+img.resultProperties[result]['progressBarValue']+"%" }
	);
}

function logAssessment(img) {
	console.log("Assessment: ", img.result, img.src);
	console.log("Actual (W, H): ", img.width, img.height);
	console.log("Good Benchmark: ", img.benchmarks['good']['width'], img.benchmarks['good']['height']);
	console.log("Better Benchmark: ", img.benchmarks['better']['width'], img.benchmarks['better']['height']);
	console.log("Best Benchmark: ", img.benchmarks['best']['width'], img.benchmarks['best']['height']);
	console.log("");

$(document).ready(function() {

	initializeForm();

	$( "#image-from-url" ).change(function() {
		if (this.checked) {
			$( "#input-file-group" ).hide();
			$( "#input-url").val(SAMPLE_IMAGE_URL);
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
					img.initialize();
					$( ".aspect-ratio").text( img.getAspectRatio() );
					$( ".width-value-px" ).text( img.width );
					$( ".height-value-px" ).text( img.height );
					$( ".image-attribute").show(); // width in px, height in px, aspectRatio str
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
        var trimSize = TRIM_SIZES[trimSizeIndex];
        var imageUsage  = $( "#image-use-form input[type='radio']:checked" ).val();
        var imageSource = $( "#image-source-form input[type='radio']:checked" ).val()
        var img = new Image();

        if (imageSource == 'image-from-file') {
			var file = document.getElementById("input-file").files[0];

			if (file.type.match(/image.*/)) {
	  			var reader = new FileReader();
	  			reader.onload = function() {
					img.src = reader.result;
                    var requiredResize = img.requiredResize(DEFAULT_PPI, trimSize.width, trimSize.height);
					var resolutionAssessmentComment = img.resolutionAssessmentComment(requiredResize);
                    var aspectRatioString = img.aspectRatioString();
                    var aspectRatioAssessmentComment = img.aspectRatioAssessmentComment(imageUsage, trimSize.width, trimSize.height, DEFAULT_ASPECT_RATIO_WARNING_THRESHOLD);
                    img.report(resolutionAssessmentComment, aspectRatioString, aspectRatioAssessmentComment);
				};
				reader.readAsDataURL(file);
			} else { // user didn't upload a valid image file
				$( "#flash" ).show();
			}
		} else { // user wants to assess an image from a url
            var url = $( "#input-url" ).val();
            var inputPreviewSrc = $("#input-preview").attr('src');
            if (url != inputPreviewSrc) {
                previewImageFromURL(url);
            }
	    	img.src = url;
			img.onload = function() {
                var requiredResize = img.requiredResize(DEFAULT_PPI, trimSize.width, trimSize.height);
                var resolutionAssessmentComment = img.resolutionAssessmentComment(requiredResize);
                var aspectRatioString = img.aspectRatioString();
                var aspectRatioAssessmentComment = img.aspectRatioAssessmentComment(imageUsage, trimSize.width, trimSize.height, DEFAULT_ASPECT_RATIO_WARNING_THRESHOLD);
                img.report(resolutionAssessmentComment, aspectRatioString, aspectRatioAssessmentComment);
			}
		}
	});
}); // end of document ready function
