////// GLOBAL VARIABLES

var PPI = 300;
var SAMPLE_IMAGE_URL = 'http://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/Shakespeare.jpg/800px-Shakespeare.jpg';

// The number represents the % of the width & length & area of the selected trim size that
// the image must meet or exceed in order to meet the definition.
var BENCHMARK_DEFINITIONS = {
	'cover': {
		'good': 	0.5,
		'better': 	0.75,
		'best': 	1.0
	},
	'interior': {
		'good': 	0.4,
		'better':	0.5,
		'best':		0.75
	}
};

var AVAILABLE_TRIM_SIZES_IN_INCHES = [
	{'width': 5, 	'height': 5, 	'area': 25},
	{'width': 5.5, 	'height': 8.5, 	'area': 46.75},
	{'width': 6, 	'height': 9, 	'area': 54},
	{'width': 7, 	'height': 10, 	'area': 70},
	{'width': 8.5, 	'height': 8.5, 	'area': 72.25},
	{'width': 8.5, 	'height': 11, 	'area': 93.5}
];

// MAPS AVAILABLE TRIM SIZES FROM INCHES (USER-FRIENDLY) TO PIXELS (COMPUTER-FRIENDLY).
var AVAILABLE_TRIM_SIZES_IN_PIXELS = [];
for (var tsInches = 0; tsInches < AVAILABLE_TRIM_SIZES_IN_INCHES.length; tsInches++) {
	d = {
		'width': AVAILABLE_TRIM_SIZES_IN_INCHES[tsInches]['width'] * PPI,
		'height': AVAILABLE_TRIM_SIZES_IN_INCHES[tsInches]['height'] * PPI,
		'area': (AVAILABLE_TRIM_SIZES_IN_INCHES[tsInches]['width'] * PPI) * (AVAILABLE_TRIM_SIZES_IN_INCHES[tsInches]['height'] * PPI)
	}
	AVAILABLE_TRIM_SIZES_IN_PIXELS.push(d);
}

//////// OBJECT METHODS

String.prototype.repeat = function(n) {
	n = n || 1;
	return Array(n+1).join(this);
}

function round(num, places) {
	var f = parseInt('1' + '0'.repeat(places));
	return Math.round(num * f) / f;
}

function toInches(px, PPI, places) {
	return round((px / PPI), places);
}

function toCm(inches, places) {
	return round((inches * 2.54), places);
}

function logAssessment(img, level, benchmarks) {
	console.log("Assessment: ", level)
	console.log("Actual (W, H, Area): ", img.width, img.height, img.getArea());
	console.log("Good Benchmark: ", benchmarks['good']['width'], benchmarks['good']['height'], benchmarks['good']['area']);
	console.log("Better Benchmark: ", benchmarks['better']['width'], benchmarks['better']['height'], benchmarks['better']['area']);
	console.log("Best Benchmark: ", benchmarks['best']['width'], benchmarks['best']['height'], benchmarks['best']['area']);
}


Image.prototype.getAspectRatio = function() {
	var heightRelativeToWidth = round((this.height / this.width), 1);
	if (heightRelativeToWidth < 1) {
		var widthRelativeToHeight = round((this.width / this.height), 1);
		var aspectRatioWH = widthRelativeToHeight + " : 1";
	} else {
		var aspectRatioWH = "1 : " + heightRelativeToWidth;
	}
	return aspectRatioWH;
};

Image.prototype.getArea = function() {
	return this.width * this.height;
};

Image.prototype.assess = function(selectedTrimSizeInPixels, imageUsage) {
	// build a dict of dicts, e.g. {'best':{'width':1000, 'height':800}, 'better': ... }
	// During the assessment, the width and area at each benchmark will be looked up
	// and compared against the image under assessment until a match is found.
	var benchmarks = {};
	for (var factor in BENCHMARK_DEFINITIONS[imageUsage]) { // e.g. good, better, best
		var factor_value = BENCHMARK_DEFINITIONS[imageUsage][factor]; // e.g. 0.5, 0.75, 1.0
		benchmarks[factor] = {};
		for (var prop in selectedTrimSizeInPixels) { // e.g. width, length, area
			benchmarks[factor]['width'] = selectedTrimSizeInPixels['width'] * factor_value; // e.g benchmarks['good']['width'] = 1500 * 0.5
			benchmarks[factor]['height'] = selectedTrimSizeInPixels['height'] * factor_value;
			benchmarks[factor]['area'] = (selectedTrimSizeInPixels['width'] * factor_value) * (selectedTrimSizeInPixels['height'] * factor_value);
		}
	}

	areaInPixels 			= this.getArea();
	widthInInchesRounded 	= toInches(this.width, PPI, 1);
	heightInInchesRounded 	= toInches(this.height, PPI, 1);
	widthInCmRounded 		= toCm(widthInInchesRounded, 1);
	heightInCmRounded 		= toCm(heightInInchesRounded, 1);

	$( ".width-value-in" ).text(widthInInchesRounded);
	$( ".width-value-cm" ).text(widthInCmRounded);
	$( ".width-value-px" ).text(this.width);
	$( ".height-value-in" ).text(heightInInchesRounded);
	$( ".height-value-cm" ).text(heightInCmRounded);
	$( ".height-value-px" ).text(this.height);
	$( ".aspect-ratio" ).text(this.getAspectRatio())
	$( ".assessment-measurements" ).show();

	var thumbsUp = '<i class="fa fa-fw fa-thumbs-up"></i>';
	var thumbsDown = '<i class="fa fa-fw fa-thumbs-down"></i>';

	baseComment = 	"Assuming no cropping, this image can be printed at up to " + widthInInchesRounded + "\" by " + heightInInchesRounded + "\" without losing any resolution, " +
					"or at up to about " + (widthInInchesRounded * 1.25) + "\" by " + (heightInInchesRounded * 1.25) + "\" with some minor loss of quality.\n\n"

	comment = {
		'cover': {
			'best': 	"The resolution of this image should be sufficient for the selected trim size.",
			'better': 	"Enlargement may be required for the selected trim size, but the loss of resolution may not be significant.",
			'good': 	"As a full page image, enlargement would likely be required which would cause significant loss of quality.  It's recommended to use an image with better resolution.",
			'bad': 		"This is likely too small.  Please use an image with better resolution."
		},
		'interior': {
			'best': 	"The resolution of this image should be sufficient for the target print area.",
			'better': 	"Enlargement may be required for the selected trim size, but the loss of resolution may not be significant.",
			'good': 	"Enlargement would likely be required which would cause significant loss of quality.  It's recommended to use an image with better resolution.",
			'bad': 		"This is likely too small.  Please use an image with better resolution."
		}
	}

	if (this.width >= benchmarks['best']['width'] && this.height >= benchmarks['best']['height'] && areaInPixels >= benchmarks['best']['area']) {
		logAssessment(this, 'best', benchmarks);
		$( ".progress-bar" ).attr({ 'class': "progress-bar progress-bar-success", 'aria-valuenow': 100, style: "width:100%" });
		$( ".assessment-comment" ).html(thumbsUp + baseComment + comment[imageUsage]['best']).show();
	}
	else if (this.width >= benchmarks['better']['width'] && this.height >= benchmarks['better']['height'] && areaInPixels >= benchmarks['better']['area']) {
		logAssessment(this, 'better', benchmarks);
		$( ".progress-bar" ).attr({	'class': "progress-bar progress-bar-info", 'aria-valuenow': 75, style: "width:75%" });
		$( ".assessment-comment" ).html(thumbsUp + baseComment + comment[imageUsage]['better']).show();
	}
	else if (this.width >= benchmarks['good']['width'] && this.height >= benchmarks['good']['height'] && areaInPixels >= benchmarks['good']['area']) {
		logAssessment(this, 'good', benchmarks);
		$( ".progress-bar" ).attr({	'class': "progress-bar progress-bar-warning", 'aria-valuenow': 50, style: "width:50%" });
		$( ".assessment-comment" ).html(thumbsDown + baseComment + comment[imageUsage]['good']).show();
	}
	else {
		logAssessment(this, 'bad', benchmarks);
		$( ".progress-bar" ).attr({	'class': "progress-bar progress-bar-danger", 'aria-valuenow': 25, style: "width:25%" });
		$( ".assessment-comment" ).html(thumbsDown + baseComment + comment[imageUsage]['bad']).show();
	}
} // end function MyImage.assess()



////////// APPLICATION FUNCTIONS

function init() {
	$( "#image-source-form" ).hide();
	$( "#input-url-group" ).hide();
	$( ".assessment-measurements" ).hide();
	$( ".assessment-comment" ).hide();
	$( "#flash" ).hide();

	$( ".nailthumb-container" ).nailthumb(
		{width:100,height:100,method:'resize',fitDirection:'center center'}
		);
	$( ".ppi" ).text(PPI);

	// Build the trim size drop-down.
	for (var ts = 0; ts < AVAILABLE_TRIM_SIZES_IN_INCHES.length; ts++) {
		$( "#trim-size-options" ).append($('<option>', {
			value: ts,
			text: AVAILABLE_TRIM_SIZES_IN_INCHES[ts]['width'] + '" x ' + AVAILABLE_TRIM_SIZES_IN_INCHES[ts]['height'] + '"'
		}));
	}
}


$(document).ready(function() {

	init();

	if (window.File && window.FileReader) {
		// Great success! All the File APIs are supported.
	} else {
		// alert('The File APIs are not fully supported in this browser.');
		$( '#image-from-file' ).addClass('disabled');
	}

	$( "#image-from-url" ).change(function() {
		if (this.checked) {
			$( "#input-file-group" ).hide();
			$( "#input-url").val(SAMPLE_IMAGE_URL);
			$( "#input-url-group" ).show();
	        $( "#input-preview" ).attr('src', "ph.png");
		}
	});

	$( "#image-from-file" ).change(function() {
		if (this.checked) {
			$( "#input-url-group" ).hide();
			$( "#input-file-group" ).show();
	        $( "#input-preview" ).attr('src', "ph.png");
		}
	});

	$( ".form-group" ).change(function() {
			$( "#flash" ).hide();
			$( ".assessment-measurements" ).hide();
			$( ".assessment-comment" ).hide();
			$( ".progress-bar" ).attr({	'class': "progress-bar", 'aria-valuenow': 0, style: "width:0%" });
	});

	$( "#input-file" ).change(function() {
		 if (this.files && this.files[0]) {
	            var reader = new FileReader();
	            reader.onload = function (e) {
	            	$( ".nailthumb-container" ).nailthumb({width:100,height:100,method:'resize',fitDirection:'center center'});
	                $( "#input-preview" ).attr('src', e.target.result);
	            }
	            reader.readAsDataURL(this.files[0]);
	        }
	});

	$( "#preview-url" ).on( 'click', function() {
		$( ".nailthumb-container" ).nailthumb({width:100,height:100,method:'resize',fitDirection:'center center'});
	    $( "#input-preview" ).attr('src', $( "#input-url" ).val());
	});

	$( "#assess-image-button" ).on( 'click', function() {
		$( "#flash" ).hide();

		// If the 'image from file' radio button is selected...
		if ($( "#image-source-form input[type='radio']:checked" ).val() == 'image-from-file') {
			var file = document.getElementById("input-file").files[0];
			var selectedTrimSizeInPixels = AVAILABLE_TRIM_SIZES_IN_PIXELS[$( "#trim-size-options" ).find(":selected").val()];
			var imageUsage  = $( "#image-use-form input[type='radio']:checked" ).val();
			var imageType = /image.*/;
			if (file.type.match(imageType)) {
	  			var reader = new FileReader();
	  			reader.onload = function() {
						var img = new Image();
						img.src = reader.result;
						img.assess(selectedTrimSizeInPixels, imageUsage);
					} // end case where filetype is ok
					reader.readAsDataURL(file);
			} else {
				$( "#flash" ).show();
			}
		}

		// If the 'image from url' radio button is selected...
		else {
			var img = new Image();
	    	url = $( "#input-url" ).val();
	    	img.src = url;
			img.onload = function() {
				img.assess(selectedTrimSizeInPixels, imageUsage);
			}
		}
	});
}); // end of document ready function
