$.getScript("Img.js");

var SAMPLE_IMAGE_URL = 'http://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/Shakespeare.jpg/800px-Shakespeare.jpg';

var COVER_YARDSTICK_DEFS = [0.5, 0.75, 1.0]; // IMAGE AS % OF ACTUAL TRIM SIZE
var INTERIOR_YARDSTICK_DEFS = [0.4, 0.5, 0.75];

var PPI = 300;

var ACCEPTABLE_RESIZE = 1.25;

// W, H, AREA
var AVAILABLE_TRIM_SIZES_IN_INCHES = [
		[5, 5, 25],
		[5.5, 8.5, 46.75],
		[6, 9, 54],
		[7, 10, 70],
		[8.5, 8.5, 72.25],
		[8.5, 11, 93.5]
	];

// This converts the AVAILABLE TRIM SIZES FROM INCHES (USER-FRIENDLY) TO PIXELS (COMPUTER-FRIENDLY).
var AVAILABLE_TRIM_SIZES_IN_PIXELS = [];
for (var i = 0; i < AVAILABLE_TRIM_SIZES_IN_INCHES.length; i++) {
	var t = [];
	for (var j = 0; j < AVAILABLE_TRIM_SIZES_IN_INCHES[i].length; j++) {
		t.push(AVAILABLE_TRIM_SIZES_IN_INCHES[i][j] * PPI);
	}
	AVAILABLE_TRIM_SIZES_IN_PIXELS.push(t);
}



// Instantiate new objects with 'new'
//var person = new Person("Bob", "M");

// Invoke methods like this
//person.speak(); // alerts "Howdy, my name is Bob"


function init() {
	$( "#image-source-form" ).hide()

	// Builds the trim size drop-down.
	for (var ts = 0; ts < AVAILABLE_TRIM_SIZES_IN_INCHES.length; ts++) {
		$( "#trim-size-options" ).append($('<option>', {
			value: ts,
			text: AVAILABLE_TRIM_SIZES_IN_INCHES[ts][0] + ' x ' + AVAILABLE_TRIM_SIZES_IN_INCHES[ts][1]
		}));
	}

	$( ".ppi" ).text(PPI);
	$( "#input-url-group" ).hide();
	$( ".assessment-measurements" ).hide();
	$( ".assessment-comment" ).hide();
	$( "#flash" ).hide();
    $( ".nailthumb-container" ).nailthumb({width:100,height:100,method:'resize',fitDirection:'center center'});
}


function assessResolution(img) {
	var selectedTrimSizeInPixels 	= AVAILABLE_TRIM_SIZES_IN_PIXELS[$( "#trim-size-options" ).find(":selected").val()];
	var widthInPixels 				= img.width;
	var heightInPixels 				= img.height;
	var areaInPixels 				= img.getArea();

	var widthInInchesRounded 		= img.;
	var heightInInchesRounded 		= Math.round((heightInPixels / PPI) * 10) / 10;
	var widthInCmRounded 			= Math.round(widthInInchesRounded * 2.54 * 10) / 10;
	var heightInCmRounded 			= Math.round(heightInInchesRounded * 2.54 * 10) / 10;



	$( ".width-value-in" ).text( img.width['in'] );
	$( ".width-value-cm" ).text( img.width['cm'] );
	$( ".width-value-px" ).text( img.width['px'] );
	$( ".height-value-in" ).text( img.height['in'] );
	$( ".height-value-cm" ).text( img.height['cm'] );
	$( ".height-value-px" ).text( img.height['px'] );
	$( ".aspect-value" ).text( img.getAspectRatio() );

	$( ".assessment-measurements" ).show();

	var thumbsUp = '<i class="fa fa-fw fa-thumbs-up"></i>';
	var thumbsDown = '<i class="fa fa-fw fa-thumbs-down"></i>';

	// This determines the assessment of the image by measuring the actual image's pixels against the predefined yardstick
	// YARDSTICK[2][0], [2] means the best bracket def (e.g. 0.75), [0] means the width.
	if (widthInPixels >= YARDSTICK[2][0] && areaInPixels >= YARDSTICK[2][2]) {
		$( ".progress-bar" ).attr({ 'class': "progress-bar progress-bar-success", 'aria-valuenow': 100, style: "width:100%" });
		$( ".assessment-comment" ).html(thumbsUp + commentBest).show();
	}
	else if (widthInPixels >= YARDSTICK[1][0] && areaInPixels >= YARDSTICK[1][2]) {
		$( ".progress-bar" ).attr({	'class': "progress-bar progress-bar-info", 'aria-valuenow': 75, style: "width:75%" });
		$( ".assessment-comment" ).html(thumbsUp + commentBetter).show();

	}
	else if (widthInPixels >= YARDSTICK[0][0] && areaInPixels >= YARDSTICK[0][2]) {
		$( ".progress-bar" ).attr({	'class': "progress-bar progress-bar-warning", 'aria-valuenow': 50, style: "width:50%" });
		$( ".assessment-comment" ).html(thumbsDown + commentGood).show();
	}
	else {
		$( ".progress-bar" ).attr({	'class': "progress-bar progress-bar-danger", 'aria-valuenow': 25, style: "width:25%" });
		$( ".assessment-comment" ).html(thumbsDown + commentBad).show();
	}
} // end function assessResolution




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
			var imageType = /image.*/;
			if (file.type.match(imageType)) {
	  			var reader = new FileReader();
	  			reader.onload = function() {
					var img = new Image();
					img.src = reader.result;
					assessResolution(img);
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
				assessResolution(img);
	    	}
		}
	});
});
