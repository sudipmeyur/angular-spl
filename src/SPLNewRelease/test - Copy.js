var animationOn = false;
function animateDivs(){
	animationOn = !animationOn;
	animateDiv('.a');
    animateDiv('.b');
    animateDiv('.c');
    animateDiv('.d');
}
function makeNewPosition(){
    
    // Get viewport dimensions (remove the dimension of the div)
    var h = $(window).height() - 50;
    var w = $(window).width() - 50;
    
    var nh = Math.floor(Math.random() * h);
    var nw = Math.floor(Math.random() * w);
    
    return [nh,nw];    
    
}

function animateDiv(myclass){
	if(animationOn){
		var newq = makeNewPosition();
		$(myclass).animate({ top: newq[0], left: newq[1] }, 100,function () {
			animateDiv(myclass)
		});
	}else{
		return;
	}
    
    
};