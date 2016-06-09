
/* Registers a "getter" for a resource identified by "name". 
For instance, getter.register('teamUrl', getTeamUrlFromSlackAPI) registers 
the function getTeamUrlFromSlackAPI as a getter for teamUrl. */

function register(name, getFn) {

}

/* Multiple receives the number of functions to register */
function multiple(methodsNum) {

}

/* Runs a function after all values are retrieved */
function onAllComplete(Fn) {

}

module.exports = {
	register: register,
	multiple: multiple,
	onAllComplete: onAllComplete
}