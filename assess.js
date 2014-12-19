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
	var d = {
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


Number.prototype.px2in = function(ppi) {
	return this / ppi;
}

Number.prototype.in2cm = function() {
	return this * 2.54;
}

Number.prototype.roundTo = function(places) {
	var f = parseInt('1' + '0'.repeat(places));
	return Math.round(this * f) / f;
}


function logAssessment(img) {
	console.log("Assessment: ", img.result);
	console.log("Actual (W, H, Area): ", img.width, img.height, img.area['px']);
	console.log("Good Benchmark: ", img.benchmarks['good']['width'], img.benchmarks['good']['height'], img.benchmarks['good']['area']);
	console.log("Better Benchmark: ", img.benchmarks['better']['width'], img.benchmarks['better']['height'], img.benchmarks['better']['area']);
	console.log("Best Benchmark: ", img.benchmarks['best']['width'], img.benchmarks['best']['height'], img.benchmarks['best']['area']);
}

function drawProgressBar(img) {
	var result = img.result;
	$( ".progress-bar" ).attr(
		{ 	'class': "progress-bar progress-bar-"+img.resultProperties[result]['colourStyle'],
			'aria-valuenow': img.resultProperties[result]['progressBarValue'],
			'style': "width:"+img.resultProperties[result]['progressBarValue']+"%" }
	);
}

function printComment(img) {
	var thumbsUp = '<i class="fa fa-fw fa-thumbs-up"></i>';
	var thumbsDown = '<i class="fa fa-fw fa-thumbs-down"></i>';

	var baseComment = 	"Assuming no cropping, this image can be printed at up to " +
						img.w['inches'] + "\" by " + img.h['inches'] + "\" without losing any resolution, " +
						"or at up to about " + (img.w['inches'] * 1.25) + "\" by " + (img.h['inches'] * 1.25) +
						"\" with some minor loss of quality.\n\n";

	var comment = {
		'cover': {
			'best': 	"The resolution of this image should be sufficient for the selected trim size.",
			'better': 	"Enlargement may be required for the selected trim size, but the loss of resolution may not be significant.",
			'good': 	"As a full page image, enlargement would likely be required which would cause significant loss of quality.  It's recommended to use an image with better resolution.",
			'bad': 		"This is likely too small.  Please use an image with better resolution."
		},
		'interior': {
			'best': 	"The resolution of this image should be sufficient for the target print area.",
			'better': 	"Enlargement may be required for the target print area, but the loss of resolution may not be significant.",
			'good': 	"Enlargement would likely be required which would cause significant loss of quality.  It's recommended to use an image with better resolution.",
			'bad': 		"This is likely too small.  Please use an image with better resolution."
		}
	};

	$( ".assessment-comment" ).html(thumbsUp + baseComment + comment[img.imageUsage][img.result]).show();
}


Image.prototype.assess = function(ppi, selectedTrimSizeInPixels, imageUsage) {
	this.ppi = ppi;
	this.selectedTrimSize = selectedTrimSizeInPixels;
	this.imageUsage = imageUsage;

	this.w = {
		'px': this.width,
		'inches': this.width.px2in(ppi).roundTo(1)
	};

	this.h = {
		'px': this.height,
		'inches': this.height.px2in(ppi).roundTo(1)
	};

	this.area = {
		'px': this.width * this.height
	}

	this.aspectRatio = this.getAspectRatio();

	this.benchmarks = this.getBenchmarks(selectedTrimSizeInPixels, imageUsage);

	this.resultProperties = {
		'best': {
			'colourStyle': "success",
			'progressBarValue': 100
		},
		'better': {
			'colourStyle': "info",
			'progressBarValue': 75
		},
		'good': {
			'colourStyle': "warning",
			'progressBarValue': 50
		},
		'bad': {
			'colourStyle': "danger",
			'progressBarValue': 25
		}
	}

	if (this.width >= this.benchmarks['best']['width'] && this.height >= this.benchmarks['best']['height'] && this.area['px'] >= this.benchmarks['best']['area']) {
		this.result = "best";
	}
	else if (this.width >= this.benchmarks['better']['width'] && this.height >= this.benchmarks['better']['height'] && this.area['px'] >= this.benchmarks['better']['area']) {
		this.result = "better";
	}
	else if (this.width >= this.benchmarks['good']['width'] && this.height >= this.benchmarks['good']['height'] && this.area['px'] >= this.benchmarks['good']['area']) {
		this.result = "good";
	}
	else {
		this.result = "bad";
	}



};



Image.prototype.getSize = function(resolution) {
	if(typeof(resolution)==='undefined') resolution = 300;
	size = {
		'width': this.width * resolution,
		'height': this.height * resolution
	}
	return size;
}

Image.prototype.getResolution = function(key, size) {
	var resolution = size / this[key];
	return resolution;
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

Image.prototype.getBenchmarks = function(selectedTrimSizeInPixels, imageUsage) {
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
	return benchmarks;
}


Image.prototype.report = function() {
	$( ".width-value-in" ).text(this.w['inches']);
	$( ".width-value-px" ).text(this.width);
	$( ".height-value-in" ).text(this.h['inches']);
	$( ".height-value-px" ).text(this.height);
	$( ".aspect-ratio" ).text(this.aspectRatio);

	$( ".assessment-measurements" ).show();

	logAssessment(this);
	drawProgressBar(this);
	printComment(this);
}; // end function Image.prototype.report


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
						img.assess(PPI, selectedTrimSizeInPixels, imageUsage);
						img.report();
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
				img.assess(PPI, selectedTrimSizeInPixels, imageUsage);
				img.report();
			}
		}
	});
}); // end of document ready function
