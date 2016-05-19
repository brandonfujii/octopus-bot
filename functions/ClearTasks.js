var octopus = require('../botconfig');

/* Listens for @slacktopus: clear to clear all tasks  */
octopus.controller.hears('clear', ['direct_message', 'direct_mention', 'mention'], function(bot, message) {
  var command = message.text.split(" ")[1];

  octopus.firebase_storage.teams.all(function(err, data) {
    if (err) {
      octopus.bot.reply(message, 'Sorry, I couldn\'t access task database!');
      return;
    }

    if (data) {
      data.map(function(task) {
          octopus.firebase_storage.teams.del(task.uuid);
      });
    }
    octopus.bot.reply(message, 'All tasks cleared!');
  })
});
