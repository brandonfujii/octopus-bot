require('dotenv').config()
var Botkit = require('botkit');
var firebase_storage = require(__dirname + '/database/storage')({
    firebase_uri: process.env.FIREBASE_URI
});

flat_colors = [{name: 'Green', hex: '2ecc71'}, {name:'Purple', hex: '9b59b6'}, {name: 'Red', hex: 'e74c3c'}, {name: 'Orange', hex: 'e67e22'}, {name: 'Grey', hex: '95a5a6'}, {name: 'Yellow', hex: 'f1c40f'}, {name:'Blue', hex: '2980b9'}, {name: 'Navy', hex: '2c3e50'}]

// getColor: gets a random color out of the global flat_colors object array;
function getColor() {
	return flat_colors[Math.floor(Math.random() * flat_colors.length)];
}

// getUniqueID: generates a new id of the following Schema: [color][one to two digit integer from 0-99]
function getUniqueID(color_str) {
	return color_str + Math.floor(Math.random() * 100).toString();
}

// checkDBForExistingID: checks if newly made task ID already exists in database
// if exists: run function again, generating a new task id and color
function checkDBForExistingID() {
	var colorObj = getColor();
	var new_id = getUniqueID(colorObj.name);
	firebase_storage.teams.all(function(err, data) {
		if (err) {
			console.log("Cannot access database");
			return;
		}

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

module.exports = {

	getColor: getColor,
	getUniqueID: getUniqueID,
	checkDBForExistingID: checkDBForExistingID

};