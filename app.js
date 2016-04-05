var Botkit = require('botkit');

var controller = Botkit.slackbot();

var bot = controller.spawn({
  token: process.env.SLACK_ACCESS_TOKEN
})

bot.startRTM(function(err, bot, payload) {
  if (err) {
    throw new Error('Could not connect to Slack');
  }
});