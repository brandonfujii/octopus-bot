
function With(contextObj) {
	for (var property in contextObj) {
		if (contextObj.hasOwnProperty(property)) {
        	console.log(contextObj[property]);
    	}
	}
}

module.exports = {
	With: With
}