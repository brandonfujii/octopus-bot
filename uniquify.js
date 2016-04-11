// Uniquify.js: Functions for creating unique IDs for tasks

// define database and botkit controller
var octopus = require('./botconfig');

// Colors Object Array:
// used for generating unique id's for each task
flat_colors = [{name: 'Green', hex: '2ecc71'}, {name:'Purple', hex: '9b59b6'}, {name: 'Red', hex: 'e74c3c'}, {name: 'Orange', hex: 'e67e22'}, {name: 'Grey', hex: '95a5a6'}, {name: 'Yellow', hex: 'f1c40f'}, {name:'Blue', hex: '2980b9'}, {name: 'Navy', hex: '2c3e50'}]

// getColor: none -> object
// gets a random color object out of the global flat_colors array;
function getColor() {
	return flat_colors[Math.floor(Math.random() * flat_colors.length)];
}

// getUniqueID: string -> string
// generates a new id of the following Schema: [color][one to two digit integer from 0-99]
function getUniqueID(color_str) {
	return color_str + Math.floor(Math.random() * 100).toString();
}

// checkDBForExistingID: none -> object with id and color
// checks if newly made task ID already exists in database
// if exists: run function again, generating a new task id and color
function checkDBForExistingID() {
	var colorObj = getColor();
	var new_id = getUniqueID(colorObj.name);
	octopus.firebase_storage.teams.all(function(err, data) {
		if (err) {
			console.log("Cannot access database");
			return;
		}

		// if there are tasks in the database, check the database for existing id
		// if task id is present, run function again to generate new id and check again
		if (data) {
			data.map(function(task) {
				if (new_id == task.id) {
					checkDBForExistingID();
				}
			});
		}

	});

	return { id: new_id, color: colorObj };
}

// Make ID functions available to other js files
module.exports = {

	getColor: getColor,
	getUniqueID: getUniqueID,
	checkDBForExistingID: checkDBForExistingID

};