var SAMPLE_IMAGE_URL = 'http://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/Shakespeare.jpg/800px-Shakespeare.jpg';
var PPI = 300;

// The number represents the % of the width & area of the selected trim size that
// the image must meet or exceed in order to meet the definition.
var BENCHMARK_DEFINITIONS = {
	'cover': {
		'good': 		0.5,
		'better': 	0.75,
		'best': 		1.0
	},
	'interior': {
		'good': 		0.4,
		'better':		0.5,
		'best':			0.75
	}
};

var AVAILABLE_TRIM_SIZES_IN_INCHES = [
{'width': 5, 		'height': 5, 		'area': 25},
{'width': 5.5, 	'height': 8.5, 	'area': 46.75},
{'width': 6, 		'height': 9, 		'area': 54},
{'width': 7, 		'height': 10, 	'area': 70},
{'width': 8.5, 	'height': 8.5, 	'area': 72.25},
{'width': 8.5, 	'height': 11, 	'area': 93.5}
];

// MAPS AVAILABLE TRIM SIZES FROM INCHES (USER-FRIENDLY) TO PIXELS (COMPUTER-FRIENDLY).
var AVAILABLE_TRIM_SIZES_IN_PIXELS = [];
for (var tsInches = 0; tsInches < AVAILABLE_TRIM_SIZES_IN_INCHES.length; tsInches++) {
	d = {}
	for (var key in AVAILABLE_TRIM_SIZES_IN_INCHES[tsInches]) {
		d[key] = AVAILABLE_TRIM_SIZES_IN_INCHES[tsInches][key] * PPI;
	}
	AVAILABLE_TRIM_SIZES_IN_PIXELS.push(d);
}


var MyImage = function(img) {
	this.width = img.width;
	this.height = img.height;
	this.area = this.width * this.height;
}


MyImage.prototype.assess = function(selectedTrimSizeInPixels, imageUsage) {
	if (imageUsage == 'cover') {
		var commentBest = "The resolution of this image is high.";
		var commentBetter = "The resolution of this image may be acceptable, however enlargement may be required.";
		var commentGood = "The resolution of this image is too low.";
		var commentBad = "The resolution of this image is too low.";
	} else if (imageUsage == 'interior') {
		var commentBest = "The resolution of this image is high.";
		var commentBetter = "This image should be acceptable assuming typical layout.";
		var commentGood = "The image may be acceptable as an author image or internal image.  Consider using an image with better resolution.";
		var commentBad = "The resolution of this image is too low. Please use an image with better resolution.";
	} else { // Should never happen.
		alert('Error.')
	}

	// build a dict of dicts, e.g. {'best':{'width':1000, 'height':800}, 'better': ... }
	// During the assessment, the width and area at each benchmark will be looked up
	// and compared against the image under assessment until a match is found.
	var benchmarks = {};
	for (var mark in BENCHMARK_DEFINITIONS[imageUsage]) { // e.g. good, better, best
		var mark_val = BENCHMARK_DEFINITIONS[imageUsage][mark];
		benchmarks[mark] = {};
		for (var prop in selectedTrimSizeInPixels) { // e.g. width, length, height
			var prop_val = selectedTrimSizeInPixels[prop];
			benchmarks[mark][prop] = prop_val * mark_val;
		}
	}

	widthInPixels 			= this.width;
	heightInPixels 			= this.height;
	areaInPixels 				= this.area;

	widthInInchesRounded 	= Math.round((widthInPixels / PPI) * 10) / 10;
	heightInInchesRounded 	= Math.round((heightInPixels / PPI) * 10) / 10;
	widthInCmRounded 		= Math.round(widthInInchesRounded * 2.54 * 10) / 10;
	heightInCmRounded 		= Math.round(heightInInchesRounded * 2.54 * 10) / 10;

	$( ".width-value-in" ).text(widthInInchesRounded);
	$( ".width-value-cm" ).text(widthInCmRounded);
	$( ".width-value-px" ).text(widthInPixels)
	$( ".height-value-in" ).text(heightInInchesRounded);
	$( ".height-value-cm" ).text(heightInCmRounded);
	$( ".height-value-px" ).text(heightInPixels);
	$( ".assessment-measurements" ).show();

	var thumbsUp = '<i class="fa fa-fw fa-thumbs-up"></i>';
	var thumbsDown = '<i class="fa fa-fw fa-thumbs-down"></i>';

	if (widthInPixels >= benchmarks['best']['width'] && areaInPixels >= benchmarks['best']['area']) {
		console.log("Assessment: ", 'best,', "Actual width: ", widthInPixels, "Benchmark width (good, better, best): ", benchmarks['good']['width'], benchmarks['better']['width'], benchmarks['best']['width']);
		$( ".progress-bar" ).attr({ 'class': "progress-bar progress-bar-success", 'aria-valuenow': 100, style: "width:100%" });
		$( ".assessment-comment" ).html(thumbsUp + commentBest).show();
	}
	else if (widthInPixels >= benchmarks['better']['width'] && areaInPixels >= benchmarks['better']['area']) {
		console.log("Assessment: ", 'better,', "Actual width: ", widthInPixels, "Benchmark width (good, better, best): ", benchmarks['good']['width'], benchmarks['better']['width'], benchmarks['best']['width']);
		$( ".progress-bar" ).attr({	'class': "progress-bar progress-bar-info", 'aria-valuenow': 75, style: "width:75%" });
		$( ".assessment-comment" ).html(thumbsUp + commentBetter).show();

	}
	else if (widthInPixels >= benchmarks['good']['width'] && areaInPixels >= benchmarks['good']['area']) {
		console.log("Assessment: ", 'good,', "Actual width: ", widthInPixels, "Benchmark width (good, better, best): ", benchmarks['good']['width'], benchmarks['better']['width'], benchmarks['best']['width']);
		$( ".progress-bar" ).attr({	'class': "progress-bar progress-bar-warning", 'aria-valuenow': 50, style: "width:50%" });
		$( ".assessment-comment" ).html(thumbsDown + commentGood).show();
	}
	else {
		console.log("Assessment: ", 'bad,', "Actual width: ", widthInPixels, "Benchmark width (good, better, best): ", benchmarks['good']['width'], benchmarks['better']['width'], benchmarks['best']['width']);
		$( ".progress-bar" ).attr({	'class': "progress-bar progress-bar-danger", 'aria-valuenow': 25, style: "width:25%" });
		$( ".assessment-comment" ).html(thumbsDown + commentBad).show();
	}
} // end function MyImage.assess()


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
						var image = new Image();
						image.src = reader.result;
						var img = new MyImage(image);
						img.assess(selectedTrimSizeInPixels, imageUsage);
					} // end case where filetype is ok
					reader.readAsDataURL(file);
			} else {
				$( "#flash" ).show();
			}
		}

		// If the 'image from url' radio button is selected...
		else {
			var image = new Image();
	    	url = $( "#input-url" ).val();
	    	image.src = url;
			image.onload = function() {
				var img = new MyImage(image);
				img.assess(selectedTrimSizeInPixels, imageUsage);	    	}
		}
	});
});
