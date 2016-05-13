var octopus = require('../botconfig');
var Task = require('../schemas/Task');


/* Remove a task through natural language */

octopus.controller.hears(['remove a task', 'remove task', 'remove my task', 'remove from tasks'], ['ambient', 'direct_message', 'direct_mention', 'mention'], function(bot, message) {
  octopus.bot.startConversation(message, function(err, convo) {
    if (!err) {
      convo.ask('Okay, what\'s the id of the task you want to remove?', function(response, convo) {
        convo.ask('You want to remove task *' + response.text + '*?', [
            {
              pattern: 'ye',
              callback: function(response, convo) {
                convo.next();
              }
            },
            {
              pattern: 'no',
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
                  octopus.bot.reply(message, 'Sorry, I couldn\'t add your task!');
                }
                else {
                  var exists = false;

        if (data) {
          data.map(function(task) {
            if (task_id == task.id) {
              // DELETE function here
              octopus.firebase_storage.teams.del(task_id);
              octopus.bot.reply(message, 'Okay! Task ' + task_id + ' removed!');
              exists = true;
            }
          });
          if (!exists) {
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

octopus.controller.hears('%remove', ['ambient', 'direct_message', 'direct_mention', 'mention'], function(bot, message) {
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
          octopus.bot.reply(message, 'Okay, task ' + task_id + ' removed!');
          exists = true;
        }
      });
      if (!exists) {
        octopus.bot.reply(message, 'I couldn\'t find a task with that ID!');
      }
    }
  })
});

