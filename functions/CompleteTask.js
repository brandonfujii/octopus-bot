var octopus = require('../botconfig');
var Task = require('../schemas/Task');

// Complete a task through command %complete (this is a task id)
octopus.controller.hears('%complete', ['ambient', 'direct_message', 'direct_mention', 'mention'], function(bot, message) {
  var command = message.text.split(" ")[0];
  var task_id = Task.getTaskBody(message.text);

  octopus.firebase_storage.teams.all(function(err, data) {
    if (err) {
      octopus.bot.reply(message, 'Sorry, I couldn\'t access task database!');
      return;
    }

    var exists = false;

    if (data) {
      data.map(function(task) {
        if (task_id == task.id) {
          // DELETE function here
          octopus.firebase_storage.teams.del(task_id);
          octopus.bot.reply(message, 'Task ' + task_id +' completed!');
          exists = true;
        }
      });
      if (!exists) {
        octopus.bot.reply(message, 'I couldn\'t find a task with that ID!');
      }
    }
  })

});