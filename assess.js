////// GLOBAL VARIABLES

var PPI = 300;
var SAMPLE_IMAGE_URL = 'http://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/Shakespeare.jpg/800px-Shakespeare.jpg';

var AVAILABLE_TRIM_SIZES_IN_INCHES = [
	{'width': 5, 	'height': 5},
	{'width': 5.5, 	'height': 8.5},
	{'width': 6, 	'height': 9},
	{'width': 7, 	'height': 10},
	{'width': 8.5, 	'height': 8.5},
	{'width': 8.5, 	'height': 11}
];

// The number represents the % of the width & length & area of the selected trim size that
// the image must meet or exceed in order to meet the definition.
var BENCHMARK_DEFINITIONS = {
	'cover': {
		'good': 	{'width': 0.5, 	'height': 0.5},
		'better': 	{'width': 0.75, 'height': 0.75},
		'best': 	{'width': 1.0, 	'height': 1.0}
	},
	'interior': {
		'good': 	{'width': 0.4,	'height': 0.4},
		'better':	{'width': 0.5,	'height': 0.5},
		'best':		{'width': 0.75,	'height': 0.75}
	},
	'spread': {
		'good': 	{'width': 1.0, 	'height': 0.5},
		'better': 	{'width': 1.5, 	'height': 0.75},
		'best': 	{'width': 2.0, 	'height': 1.0}
	}
};

// MAPS AVAILABLE TRIM SIZES FROM INCHES (USER-FRIENDLY) TO PIXELS (COMPUTER-FRIENDLY).
var AVAILABLE_TRIM_SIZES_IN_PIXELS = [];
for (var tsInches = 0; tsInches < AVAILABLE_TRIM_SIZES_IN_INCHES.length; tsInches++) {
	var trimSize = {
		'width': AVAILABLE_TRIM_SIZES_IN_INCHES[tsInches]['width'] * PPI,
		'height': AVAILABLE_TRIM_SIZES_IN_INCHES[tsInches]['height'] * PPI
	};
	AVAILABLE_TRIM_SIZES_IN_PIXELS.push(trimSize);
}


//////// OBJECT METHODS

String.prototype.repeat = function(n) {
	n = n || 1;
	return Array(n+1).join(this);
};

Number.prototype.px2in = function(ppi) {
	return this / ppi;
};

Number.prototype.roundTo = function(places) {
	var f = parseInt('1' + '0'.repeat(places));
	return Math.round(this * f) / f;
};

function logAssessment(img) {
	console.log("Assessment: ", img.result, img.src);
	console.log("Actual (W, H, Area): ", img.width, img.height);
	console.log("Good Benchmark: ", img.benchmarks['good']['width'], img.benchmarks['good']['height']);
	console.log("Better Benchmark: ", img.benchmarks['better']['width'], img.benchmarks['better']['height']);
	console.log("Best Benchmark: ", img.benchmarks['best']['width'], img.benchmarks['best']['height']);
	console.log("");
}

function drawProgressBar(img) {
	var result = img.result;
	$( ".progress-bar" ).attr(
		{ 	'class': "progress-bar progress-bar-"+img.resultProperties[result]['colourStyle'],
			'aria-valuenow': img.resultProperties[result]['progressBarValue'],
			'style': "width:"+img.resultProperties[result]['progressBarValue']+"%" }
	);
}

Image.prototype.getAssessmentComment = function() {
	var thumb = "<i class=\"fa fa-fw fa-thumbs-" + this.resultProperties[this.result]['thumb'] + "\"></i>";

	var baseComment = 	"Assuming no cropping, this image can be printed at up to " +
						this.w['inches'] + "\" by " + this.h['inches'] + "\" without losing any resolution, " +
						"or at up to about " + (this.w['inches'] * 1.25) + "\" by " + (this.h['inches'] * 1.25) +
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
		},
		'spread': {
			'best': 	"The resolution of this image should be sufficient for the selected trim size.",
			'better': 	"Enlargement may be required for the selected trim size, but the loss of resolution may not be significant.",
			'good': 	"As a full-spread image, enlargement would likely be required which would cause significant loss of quality.  It's recommended to use an image with better resolution.",
			'bad': 		"This is likely too small.  Please use an image with better resolution."
		}
	};

	return thumb + baseComment + comment[this.imageUsage][this.result];
};

Image.prototype.getAssessmentResult = function() {
	var assessmentResult;
	if (this.meetsOrExceeds("best")) {
		assessmentResult = "best";
	}
	else if (this.meetsOrExceeds("better")) {
		assessmentResult = "better";
	}
	else if (this.meetsOrExceeds("good")) {
		assessmentResult = "good";
	}
	else {
		assessmentResult = "bad";
	}
	return assessmentResult;
};

Image.prototype.initialize = function() {
	this.w = {
		'px': this.width,
		'inches': this.width.px2in(PPI).roundTo(1)
	};

	this.h = {
		'px': this.height,
		'inches': this.height.px2in(PPI).roundTo(1)
	};

	this.area = {
		'px': this.width * this.height
	};

	this.aspectRatio = this.getAspectRatio();
};

Image.prototype.assess = function(ppi, selectedTrimSizeInPixels, imageUsage) {
	this.ppi = ppi;
	this.selectedTrimSize = selectedTrimSizeInPixels;
	this.imageUsage = imageUsage;

	this.benchmarks = this.getBenchmarks(selectedTrimSizeInPixels, imageUsage);

	this.resultProperties = {
		'best': {
			'colourStyle': "success",
			'progressBarValue': 100,
			'thumb': 'up'
		},
		'better': {
			'colourStyle': "info",
			'progressBarValue': 75,
			'thumb': 'up'
		},
		'good': {
			'colourStyle': "warning",
			'progressBarValue': 50,
			'thumb': 'down'
		},
		'bad': {
			'colourStyle': "danger",
			'progressBarValue': 25,
			'thumb': 'down'
		}
	};

	this.result = this.getAssessmentResult();
};

Image.prototype.meetsOrExceeds = function(benchmark) {
	console.log("Testing if image meets or exceeds", benchmark, "...");
	console.log("Width", this.width, this.benchmarks[benchmark]['width']);
	console.log("Height", this.height, this.benchmarks[benchmark]['height']);
	return Boolean(this.width >= this.benchmarks[benchmark]['width'] && this.height >= this.benchmarks[benchmark]['height'])
};

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
	if ( (actualWidthAsPctOfHeight * n) < targetWidthAsPctOfHeight ) {
		comment = 'Much taller and skinnier than the target print space.';
		labelStyle = 'label label-danger';
	} else if ( actualWidthAsPctOfHeight > (targetWidthAsPctOfHeight * n) ) {
		comment = 'Much shorter and wider than the target print space.';
		labelStyle = 'label label-danger';
	} else {
		comment = 'Actual dimensions are similar to target dimensions.';
		labelStyle = 'label label-success';
	}
	return {'comment': comment, 'labelStyle': labelStyle};
};


Image.prototype.getBenchmarks = function(selectedTrimSizeInPixels, imageUsage) {
	// build a dict of dicts, e.g. {'best':{'width':1000, 'height':800}, 'better': ... }
	// During the assessment, the width and area at each benchmark will be looked up
	// and compared against the image under assessment until a match is found.
	var benchmarks = {};
	for (var benchmark in BENCHMARK_DEFINITIONS[imageUsage]) { // e.g. good, better, best
		if (BENCHMARK_DEFINITIONS[imageUsage].hasOwnProperty(benchmark)) {
			var percentages = BENCHMARK_DEFINITIONS[imageUsage][benchmark]; // e.g. 0.5, 0.75, 1.0
			benchmarks[benchmark] = {};
			for (var prop in selectedTrimSizeInPixels) { // e.g. width, length, area
				if (selectedTrimSizeInPixels.hasOwnProperty(prop)) {
					benchmarks[benchmark]['width'] = selectedTrimSizeInPixels['width'] * percentages['width']; // e.g benchmarks['good']['width'] = 1500 * 0.5
					benchmarks[benchmark]['height'] = selectedTrimSizeInPixels['height'] * percentages['height'];
				}
			}
		}
	}
	return benchmarks;
};

Image.prototype.report = function() {
	$( ".width-value-in" ).text(this.w['inches']);
	$( ".height-value-in" ).text(this.h['inches']);
	$( ".aspect-ratio" ).text(this.aspectRatio);
	$( "#aspect-ratio-comment" )
		.text( this.getAspectRatioComment(1.5).comment ).show()
		.attr( {'class': this.getAspectRatioComment(1.5).labelStyle} );
	$( ".assessment-measurements" ).show();
	$( ".assessment-comment" ).html(this.getAssessmentComment()).show();

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
	$( ".ppi" ).text(PPI);

	if (window.File && window.FileReader) {
		// Great success! All the File APIs are supported.
	} else {
		// alert('The File APIs are not fully supported in this browser.');
		$( '#image-from-file' ).addClass('disabled');
	}

	// Build the trim size drop-down.
	for (var ts = 0; ts < AVAILABLE_TRIM_SIZES_IN_INCHES.length; ts++) {
		$( "#trim-size-options" ).append($('<option>', {
			value: ts,
			text: AVAILABLE_TRIM_SIZES_IN_INCHES[ts]['width'] + '" x ' + AVAILABLE_TRIM_SIZES_IN_INCHES[ts]['height'] + '"'
		}));
	}
}


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


    function previewImageFromURL(url) {
        var img = new Image;
        img.src = url;
        setTimeout(function() {
            img.initialize();
            $(".nailthumb-container").nailthumb({width: 100, height: 100, method: 'resize', fitDirection: 'center center'});
            $("#input-preview").attr('src', url);
            $(".aspect-ratio").text(img.getAspectRatio());
            $(".width-value-px").text(img.w['px']);
            $(".height-value-px").text(img.h['px']);
            $(".image-attribute").show(); // width in px, height in px, aspectRatio str
        }, 100);
    };

	$( "#preview-url" ).on( 'click', function() {
        var url = $("#input-url").val();
        previewImageFromURL(url);
	});

	$( "#assess-image-button" ).on( 'click', function() {
		$( "#flash" ).hide();
		// If the 'image from file' radio button is selected...
        var selectedTrimSizeInPixels = AVAILABLE_TRIM_SIZES_IN_PIXELS[$( "#trim-size-options" ).find(":selected").val()];
        var imageUsage  = $( "#image-use-form input[type='radio']:checked" ).val();

        if ($( "#image-source-form input[type='radio']:checked" ).val() == 'image-from-file') {
			var file = document.getElementById("input-file").files[0];
			var imageType = /image.*/;
			if (file.type.match(imageType)) {
	  			var reader = new FileReader();
	  			reader.onload = function() {
					var img = new Image();
					img.src = reader.result;
					img.initialize();
					img.assess(PPI, selectedTrimSizeInPixels, imageUsage);
					img.report();
				}; // end case where filetype is ok
				reader.readAsDataURL(file);
			} else {
				$( "#flash" ).show();
			}
		}
		// If the 'image from url' radio button is selected...
		else {
            var url = $("#input-url").val();
            var inputPreviewSrc = $("#input-preview").attr('src');
            if (url != inputPreviewSrc) {
                previewImageFromURL(url);
            }
			var img = new Image();
	    	img.src = url;
			img.onload = function() {
                img.initialize();
				img.assess(PPI, selectedTrimSizeInPixels, imageUsage);
				img.report();
			}
		}
	});
}); // end of document ready function
