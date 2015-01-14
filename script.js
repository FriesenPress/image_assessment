////// DEFAULT VARIABLES
var DEFAULT_PPI = 300;

var DEFAULT_ASPECT_RATIO_WARNING_THRESHOLD = 1.5;
var DEFAULT_ENLARGEMENT_TOLERANCE_PERCENT = 1.25;
var DEFAULT_INTERIOR_IMAGE_TOLERANCE_PERCENT = .75;

var DEFAULT_IMAGE_URL = 'http://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/Shakespeare.jpg/800px-Shakespeare.jpg';
var PLACEHOLDER_IMAGE = "ph.png";

var DEFAULT_PREVIEW_HEIGHT = 200;
var DEFAULT_PREVIEW_WIDTH = 200;
var DEFAULT_PREVIEW_SETTINGS = {width:DEFAULT_PREVIEW_WIDTH,height:DEFAULT_PREVIEW_HEIGHT,method:'resize',fitDirection:'center center'};

var DEFAULT_TRIM_SIZES = [
	{'width': 5, 	'height': 5},
	{'width': 5.5, 	'height': 8.5},
	{'width': 6, 	'height': 9},
	{'width': 7, 	'height': 10},
	{'width': 8.5, 	'height': 8.5},
	{'width': 8.5, 	'height': 11}
];


function initializeForm() {
    $('[data-toggle="tooltip"]').tooltip();

	//$( "#image-source-form" ).hide();
	$( ".ppi" ).text(DEFAULT_PPI);

    $( "#invalid-source-flash").hide();
	$( "#input-url" ).hide();

    $( ".result" ).hide();


    $( ".image-attribute").hide();
	$( ".preview-container" ).nailthumb(DEFAULT_PREVIEW_SETTINGS);

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


// Calculation functions

function getTargetDimension(dimension, trimSize, imageUsage, interiorImageTolerance) {
    var targetDimension;
    if (imageUsage == 'interior') {
        targetDimension = trimSize[dimension] * interiorImageTolerance;
    } else if (imageUsage == 'spread') {
        var spreadFactor = ((dimension == 'width') ? 2 : 1);
        targetDimension = trimSize[dimension] * spreadFactor;
    } else { // 'cover', or any other case
        targetDimension = trimSize[dimension];
    }
    return targetDimension;
}

function getAssessmentIcon(requiredResize) {
    var assessmentIcon;
    if (requiredResize < 0.25) {
        assessmentIcon = "<i class=\"fa fa-thumbs-up\"></i>";
    } else {
        assessmentIcon = "<i class=\"fa fa-thumbs-down\"></i>";
    }
    return assessmentIcon;
}

function getProgressBarValue(requiredResize) {
    var progressBarValue;
    if (requiredResize < 0) {
        progressBarValue = 100;
    } else if (requiredResize < 0.25) {
        progressBarValue = 75;
    } else if (requiredResize < 0.5) {
        progressBarValue = 50;
    } else {
        progressBarValue = 25;
    }
    return progressBarValue;
}

function getProgressBarColour(requiredResize) {
    var progressBarColour;
    if (requiredResize < 0) {
        progressBarColour = "success";
    } else if (requiredResize < 0.25) {
        progressBarColour = "info";
    } else if (requiredResize < 0.5) {
        progressBarColour = "warning";
    } else {
        progressBarColour = "danger";
    }
    return progressBarColour;
}


// Display functions

function previewImageFromURL(src) {
    var previewImg = new Image;
    previewImg.onload = function() {
        $(".preview-container").nailthumb(DEFAULT_PREVIEW_SETTINGS);
        $("#input-preview").attr('src', src);
        $(".aspect-ratio").text(previewImg.aspectRatioString());
        $(".width-value-px").text(previewImg.width);
        $(".height-value-px").text(previewImg.height);
        $(".image-attribute").show(); // width in px, height in px, aspectRatio str
    };
    previewImg.src = src;
}

function displayAspectRatio(img, targetWidth, targetHeight, aspectRatioWarningThreshold) {
    if (img.aspectRatioWarningThresholdExceeded(targetWidth, targetHeight, aspectRatioWarningThreshold)) {
        var aspectRatioComment = img.aspectRatioComment(targetWidth, targetHeight, aspectRatioWarningThreshold);
        $("#aspect-ratio-comment").text(aspectRatioComment).show();
    }
}

function displayPrintInfo(img, ppi, targetWidth, targetHeight, enlargementTolerancePercent) {
    var printSizeComment = img.printSizeComment(ppi, enlargementTolerancePercent);
    $(".print-size-comment").html(printSizeComment).show();

    var sizeRating = img.sizeRating(ppi, targetWidth, targetHeight);
    $(".size-" + sizeRating).attr('id', "rated-size");
}

function displayAssessment(img, requiredResize) {
    var progressBarValue = getProgressBarValue(requiredResize);
    var progressBarColour = getProgressBarColour(requiredResize);
    $( ".progress").show();
    $( ".progress-bar" ).attr(
        { 	'class': "progress-bar progress-bar-"+progressBarColour,
            'aria-valuenow': progressBarValue,
            'style': "width:"+progressBarValue+"%" }
    ).show();

    var assessmentComment = img.assessmentComment(requiredResize);
    var assessmentIcon = getAssessmentIcon(requiredResize);
    $( ".assessment-comment" ).html( assessmentIcon + ' ' + assessmentComment ).show();

} // end function displayAssessment



$(document).ready(function() {

	initializeForm();

	$( "#image-from-url" ).change(function() {
		if (this.checked) {
			$( "#input-file" ).hide();
			$( "#input-url").val(DEFAULT_IMAGE_URL).show();
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
			$( ".result" ).hide();
            $( ".progress").hide();
            $( ".size-rating-container").removeAttr('id');
			//$( ".progress-bar" ).attr({	'class': "progress-bar", 'aria-valuenow': 0, style: "width:0%" });
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

        var ppi = DEFAULT_PPI;
        var aspectRatioWarningThreshold = DEFAULT_ASPECT_RATIO_WARNING_THRESHOLD;
        var enlargementTolerancePercent = DEFAULT_ENLARGEMENT_TOLERANCE_PERCENT;

        var img = new Image;

        var trimSize = getTrimSizeInput(DEFAULT_TRIM_SIZES);
        var imageUsage = getImageUsageInput();
        var targetWidth = getTargetDimension('width', trimSize, imageUsage, DEFAULT_INTERIOR_IMAGE_TOLERANCE_PERCENT);
        var targetHeight = getTargetDimension('height', trimSize, imageUsage, DEFAULT_INTERIOR_IMAGE_TOLERANCE_PERCENT);

        var requiredResize;
        var imageSource = getImageSourceInput();
        if (imageSource == 'image-from-file') {
            var file = document.getElementById("input-file").files[0];
            if (file.type.match(/image.*/)) {
                var reader = new FileReader();
                reader.onload = function () {
                    img.src = reader.result;
                    displayAspectRatio(img, targetWidth, targetHeight, aspectRatioWarningThreshold);
                    displayPrintInfo(img, ppi, targetWidth, targetHeight, enlargementTolerancePercent);
                    requiredResize = img.requiredResizeToMatchArea(ppi, targetWidth, targetHeight);
                    displayAssessment(img, requiredResize);
                };
                reader.readAsDataURL(file);
            } else { // user didn't upload a valid image file
                $( "#invalid-source-flash" ).show();
            }
        } else { // user wants to assess an image from a url
            var url = getUrlInput();
            var inputPreviewSrc = $( "#input-preview" ).attr('src');

            img.onload = function() {
                if (url != inputPreviewSrc) {
                    previewImageFromURL(url);
                }
                displayAspectRatio(img, targetWidth, targetHeight, aspectRatioWarningThreshold);
                displayPrintInfo(img, ppi, targetWidth, targetHeight, enlargementTolerancePercent);
                requiredResize = img.requiredResizeToMatchArea(ppi, targetWidth, targetHeight);
                displayAssessment(img, requiredResize);
            };
            img.onerror = function() {
                $( "#invalid-source-flash" ).show();
            };
            img.src = url;
        }
        $('.suitability-as').text(" as " + imageUsage)
	});
}); // end of document ready function