$(document).ready(function() {
	$('.a').css({top: '10px', left: '10px'});
	$('.b').css({top: '10px', left: '120px'});
	$('.c').css({top: '10px', left: '230px'});
	$('.d').css({top: '10px', left: '340px'});
});

var animationOn = false;
function toggleAnimation() {
	animationOn = !animationOn;
	var button = $('#playPauseBtn');
	if (animationOn) {
		button.html('<i class="fas fa-pause"></i>');
		animateDiv('.a');
		animateDiv('.b');
		animateDiv('.c');
		animateDiv('.d');
	} else {
		button.html('<i class="fas fa-play"></i>');
	}
}
function openEnvelop(event) {
	// Check if click is on the player name link
	if (event && event.target && event.target.tagName === 'A') {
		return; // Don't open envelope if clicking on link
	}
	
	if(!$('.envelope').hasClass('open')){
			$('.envelope').addClass('open');
			setTimeout(function() {
				// Animation complete
			}, 6000);
		}else{
			$('.envelope').removeClass('open');
		}
}
function makeNewPosition($myclass) {

	var $container = $myclass.parent()
	console.log($container.offset())

	var startinPt = $container.offset();
	var h = $container.height();
	var w = $container.width();
	var maxTop = h - $myclass.height();
	var maxLeft = w - $myclass.width();

	// var nTop = Math.floor(startinPt.top + (Math.random() * maxTop));
	// var nLeft = Math.floor(startinPt.left + (Math.random() * maxLeft));

	var nTop = Math.floor(Math.random() * maxTop);
	var nLeft = Math.floor(Math.random() * maxLeft);

	return [nTop, nLeft];

}

function choseThis(thisDivObj) {

	if($(".selected").length > 0){
		return;
	}

	$thisDiv = $(thisDivObj);
	$thisDiv.addClass('selected');
	$thisDiv.css('z-index', '1000'); // Bring to front

	

	

	var $container = $thisDiv.parent().parent();
	var myPos = $thisDiv.offset();

	
	var h = $container.height();
	var w = $container.width();
	$thisDiv.attr('t',(myPos.top));
	$thisDiv.attr('l',(myPos.left));
	var nh = (h - $thisDiv.height())/2;
	var nw = (w - $thisDiv.width());

	// var step1T = startinPt.top + nh;
	// var step1L = startinPt.left + nw;

	var step1T = nh;
	var step1L = nw;

	$thisDiv.animate({ top: step1T, left: step1L }, "slow", function () {
		
		var $stage = $("#stage");
		var stagePos = $stage.offset();
		var startinPt = $container.offset();
		

		// var step2L = myPos.left + (stagePos.left - (startinPt.left + $container.width()) + $thisDiv.width()) + ($stage.width() - $thisDiv.width())/2
		 var step2T = (stagePos.top - startinPt.top) + ($stage.height() - $thisDiv.height())/2;

		var step2L = $container.width() + (stagePos.left - (startinPt.left + $container.width())) + ($stage.width() - $thisDiv.width())/2;

		//var step1T = stagePos.top + ($stage.height() - $thisDiv.height())/2;
		//var step1L = stagePos.left + ($stage.width() - $thisDiv.width())/2;

		// var step1T = ($stage.height() - $thisDiv.height())/2;
		// var step1L = ($stage.width() - $thisDiv.width())/2;
		$thisDiv.animate({ top: step2T, left: step2L },"slow", function()  {
			$thisDiv.hide();
			$("#wrapper").show();
		});
	});


}

function sendBack() {
	$thisDiv = $('.selected');
	var $container = $thisDiv.parent().parent();
	$('.envelope').removeClass('open');
	$("#wrapper").hide();
	$thisDiv.show();
	$thisDiv.css('z-index', '1000'); // Bring to front during return
	
	// Get original position stored in attributes
	var originalTop = parseFloat($thisDiv.attr('t'));
	var originalLeft = parseFloat($thisDiv.attr('l'));
	
	// Step 1: Move back to center of container (reverse of step 2 in choseThis)
	var h = $container.height();
	var w = $container.width();
	var nh = (h - $thisDiv.height())/2;
	var nw = (w - $thisDiv.width());
	
	$thisDiv.animate({ top: nh, left: nw }, "slow", function() {
		// Step 2: Move back to original position (reverse of step 1 in choseThis)
		var containerOffset = $container.offset();
		var finalTop = originalTop - containerOffset.top;
		var finalLeft = originalLeft - containerOffset.left;
		
		$thisDiv.animate({ top: finalTop, left: finalLeft }, "slow", function() {
			$thisDiv.removeClass('selected');
			$thisDiv.css('z-index', ''); // Reset z-index
		});
	});
}

function populatePlayerData(playerName) {
	// Sample player data - you can replace with actual data source
	var playerData = {
		'Lionel Messi': {
			name: 'Lionel Messi',
			jerseyNumber: 10,
			position: 'Forward',
			age: 36,
			team: 'Inter Miami',
			nationality: 'Argentina'
		},
		'Cristiano Ronaldo': {
			name: 'Cristiano Ronaldo',
			jerseyNumber: 7,
			position: 'Forward',
			age: 38,
			team: 'Al Nassr',
			nationality: 'Portugal'
		}
	};
	
	var player = playerData[playerName] || {
		name: playerName,
		jerseyNumber: '',
		position: '',
		age: '',
		team: '',
		nationality: ''
	};
	
	// Populate form fields
	$('input[placeholder="Enter player name"]').val(player.name);
	$('input[placeholder="Enter jersey number"]').val(player.jerseyNumber);
	$('select.form-control').val(player.position);
	$('input[placeholder="Enter age"]').val(player.age);
	$('input[placeholder="Enter team name"]').val(player.team);
	$('input[placeholder="Enter nationality"]').val(player.nationality);
}
function animateDiv(myclass) {
	if (animationOn) {
		var newq = makeNewPosition($(myclass));
		$(myclass).animate({ top: newq[0], left: newq[1] }, 20, function () {
			animateDiv(myclass)
		});
	} else {
		return;
	}
};