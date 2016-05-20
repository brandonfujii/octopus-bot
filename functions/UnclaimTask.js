var octopus = require('../botconfig');
var Task = require('../schemas/Task');


/* Sets a task's assignee to null through natural language */

octopus.controller.hears(['unclaim a task', 'unclaim task', 'unclaim my task'], ['ambient', 'direct_message', 'direct_mention', 'mention'], function(bot, message) {
  octopus.bot.startConversation(message, function(err, convo) {
    if (!err) {
      convo.ask('Okay, what\'s the id of the task you want to unclaim?', function(response, convo) {
        convo.ask('You want to unclaim *' + response.text + '*?', [
            {
              pattern: bot.utterances.yes,
              callback: function(response, convo) {
                convo.next();
              }
            },
            {
              pattern: bot.utterances.no,
              callback: function(response, convo) {
                convo.stop();
              }
            },
            {
              default: true,
              callback: function(response, convo) {
                  convo.repeat();
                  convo.next();
              }
            }
          ]);
          convo.next();

      }, {'key': 'taskid'});

      convo.on('end', function(convo) {
          if (convo.status == 'completed') {
            var task_id = convo.extractResponse('taskid');

              octopus.firebase_storage.teams.all(function(err, data) {
                if (err) {
                  octopus.bot.reply(message, 'Sorry, I couldn\'t unclaim your task!');
                }
                else {
                  var exists = false;
                  var isUnclaimed = false;

                  if (data) {
                    data.map(function(task) {
                      if (task_id == task.id) {
                        if (task.assignee && task.status) { 
                          octopus.firebase_storage.teams.updateAssignee(task.uuid, null);
                          octopus.bot.reply(message, 'Okay! Task ' + task_id + ' is now unclaimed!');
                          isUnclaimed = true;
                        }
                        else {
                          octopus.bot.reply(message, "This task is already unclaimed!");
                          isUnclaimed = true;

                        }
                        exists = true;
                      }
                    });
                    octopus.bot.reply(message, isUnclaimed);
                    if (!exists && !isUnclaimed) {
                      octopus.bot.reply(message, 'I couldn\'t find a task with that ID!');
                    }
                  }
              }

              });

          } else {
              // this happens if the conversation ended prematurely for some reason
              bot.reply(message, 'Okay, nevermind!');
          }
      });
    }
  });
});

/* Remove a task through command %remove (this is a task id) */

octopus.controller.hears('unclaim', ['direct_message', 'direct_mention', 'mention'], function(bot, message) {
  var command = message.text.split(" ")[0];
  var task_id = Task.getTaskBody(message.text);

  octopus.firebase_storage.teams.all(function(err, data) {
    if (err) {
      octopus.bot.reply(message, 'Sorry, I couldn\'t access your tasks!');
      return;
    }

    var exists = false;
    var isUnclaimed = false;

    if (data) {
      data.map(function(task) {
        if (task_id == task.id) {
          if (task.assignee && task.status) {
            octopus.firebase_storage.teams.updateAssignee(task.uuid, null);
            octopus.bot.reply(message, 'Okay, task ' + task_id + ' is now unclaimed!');
            isUnclaimed = true;
          }
          else {
            octopus.bot.reply(message, "This task is already unclaimed!");
            isUnclaimed = true;
          }
        }
      });
      if (!exists && !isUnclaimed) {
        octopus.bot.reply(message, 'I couldn\'t find a task with that ID! Type `@slacktopus: help` to view all the things you can do unclaim!');
      }
    }
  })
});


