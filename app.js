// use .env file
require('dotenv').config()
var Botkit = require('botkit');
var firebase_storage = require(__dirname + '/database/storage')({
    firebase_uri: 'https://nuvention.firebaseio.com'
});

testObj0 = {id: 'TEST0', foo: 'bar0'};
testObj1 = {id: 'TEST1', foo: 'bar1'};

// Intialize botkit controller
var controller = Botkit.slackbot();

// Define a slack bot based on unique access token
var bot = controller.spawn({
  token: process.env.SLACK_ACCESS_TOKEN
})

// Start bot and handle error if it fails
bot.startRTM(function(err, bot, payload) {
  if (err) {
    throw new Error('Could not connect to Slack');
  }
});

// Bot listens for 'add' to add a task to firebase
controller.hears('add', 'direct_message,direct_mention,mention', function(bot, message) {
	firebase_storage.teams.save(testObj1, function(err) {
		if (err) {
			bot.reply(message, 'Sorry, I couldn\'t add your task!');
		}
	})
});

// Bot listens for 'show tasks' to retrieve and display tasks from firebase
controller.hears('show tasks', 'direct_message,direct_mention,mention', function(bot, message) {
	firebase_storage.teams.all(function(err, data) {
		if (err) {
			bot.reply(message, 'Sorry, I couldn\'t retrieve tasks!');
			return;
		}

		if (data) {

			data.map(function(task) {
				bot.reply(message, task.foo);
			});

		}

	})

});


