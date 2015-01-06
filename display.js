/**
 * Created by dlaberge on 05/01/15.
 */

function drawProgressBar(img) {
	var result = img.result;
	$( ".progress-bar" ).attr(
		{ 	'class': "progress-bar progress-bar-"+img.resultProperties[result]['colourStyle'],
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
}

function assessmentCommentToHTML(comment) {
    var thumb = "<i class=\"fa fa-fw fa-thumbs-" + this.resultProperties[this.result]['thumb'] + "\"></i>";
    return thumb + comment;



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
}