
color_names = ['Violet', 'Blue', 'Red', 'Green', 'Purple', 'Pink', 'Black', 'Grey', 'White', 'Orange'];
colors = ['#2ecc71', '#3498db', '#9b59b6', '#34495e', '#e67e22', '#c0392b', '#7f8c8d'];


function getColorName() {
	return color_names[Math.floor(Math.random() * color_names.length)];
}

function getUniqueID() {
	return getColorName() + Math.floor(Math.random() * 100).toString();
}

module.exports = {

	getColor: function() {
		return colors[Math.floor(Math.random() * colors.length)];
	},
	getColorName: getColorName,
	getUniqueID: getUniqueID

};