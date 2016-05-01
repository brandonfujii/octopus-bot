
var octopus = require('./botconfig');

var army_codes = ['alpha', 'bravo', 'charlie', 'delta', 'echo', 'foxtrot', 'golf', 'hotel', 'india', 'juliet', 'kilo', 'lima', 'mike', 'november', 'oscar', 'papa', 'quebec', 'romeo', 'sierra', 'uniform', 'victor', 'whiskey', 'xray', 'yankee', 'zulu'];

function getArmyCode() {
	return army_codes[Math.floor(Math.random() * army_codes.length)];
}

function getUniqueID(code_str) {
	return code_str + Math.floor(Math.random() * 100).toString();
}

function checkDBForExistingID() {
	var army_code = getArmyCode();
	var new_id = getUniqueID(army_code);

	octopus.firebase_storage.teams.all(function(err, data) {
		if (err) {
			console.log("Cannot access database");
			return;
		}


		if (data) {
			data.map(function(task) {
				if (new_id == task.id) {
					checkDBForExistingID();
				}
			})
		}
	});

	return new_id;
}


module.exports = {

	getArmyCode: getArmyCode,
	getUniqueID: getUniqueID,
	checkDBForExistingID: checkDBForExistingID
	
}