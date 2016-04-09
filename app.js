// use .env file
require('dotenv').config()
var Botkit = require('botkit');

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

controller.hears('hello', 'direct_message,direct_mention,mention', function(bot, message) {
	bot.reply(message, 'Yoo!');
});