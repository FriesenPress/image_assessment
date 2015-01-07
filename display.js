/**
 * Created by dlaberge on 05/01/15.
 */

function drawProgressBar(values) {
	$( ".progress-bar" ).attr(
		{ 	'class': "progress-bar progress-bar-"+values.colourStyle,
			'aria-valuenow': values.progressBarValue,
			'style': "width:"+values.progressBarValue+"%" }
	);
}

function assessmentCommentToHTML(comment) {
    var thumb = "<i class=\"fa fa-fw fa-thumbs-" + formatValues.thumb + "\"></i>";
    return thumb + comment;
}

function formatValues(resizeRequire) {
    var colourStyle, progressBarValue, thumb;
    if (resizeRequire < 0) {
        colourStyle = "success";
        progressBarValue = 100;
        thumb = 'up';
    } else if (resizeRequire < 0.25) {
        colourStyle = "info";
        progressBarValue = 75;
        thumb = 'up';
    } else if (resizeRequire < 0.5) {
        colourStyle = "warning";
        progressBarValue = 50;
        thumb = 'down';
    } else {
        colourStyle = "danger";
        progressBarValue = 25;
        thumb = 'down';
    }
    return {'colourStyle': colourStyle, 'progressBarValue': progressBarValue, 'thumb': thumb};
}

