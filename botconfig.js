// BotConfig.js: Main botkit configuration/initialization file
// use .env file
require('dotenv').config()
var Botkit = require('botkit');
var firebase_storage = require(__dirname + '/database/storage')({
    firebase_uri: process.env.FIREBASE_URI
});

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

module.exports = {
	controller: controller,
	bot: bot,
	firebase_storage: firebase_storage
}