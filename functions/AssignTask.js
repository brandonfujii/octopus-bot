var octopus = require('../botconfig');
var uniquify = require('../codify');
var Task = require('../schemas/Task');
var User = require('../schemas/User');

/* Assign a task to someone through natural language */
octopus.controller.hears(['assign a task', 'assign task', 'assign my task', 'assign that task'], ['ambient', 'direct_message', 'direct_mention', 'mention'], function(bot, message) {
  octopus.bot.startConversation(message, function(err, convo) {
    if (!err) {
      convo.ask('What\'s the task id of the task you want to assign?', function(response, convo) {
        convo.ask('You want to assign task *' + response.text + '*?', [
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

      convo.ask('Who do you want to assign it to?', function(response, convo) {
        convo.ask('Do you want to assign it to *' + response.text + '* ?', [
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
      }, {'key' : 'assignee'});

      convo.on('end', function(convo) {
          if (convo.status == 'completed') {
            var task_id = convo.extractResponse('taskid');
            var assignee = convo.extractResponse('assignee');
            var assigneeArraySize = assignee.split(" ").length-1;
            var assigneeID = assignee.split(" ")[assigneeArraySize].substring(2, assignee.split(" ")[assigneeArraySize].length-1);
            octopus.firebase_storage.teams.all(function(err, data) {
              if (err) {
                octopus.bot.reply(message, 'Sorry, I couldn\'t access task database!');
                return;
              }

              var exists = false;

              if (data) {
                data.map(function(task) {
                  if (task_id == task.id) {

                    User.getUserName(assigneeID, function(username) {
                      if(username == "usernameNotFound") {
                        octopus.bot.reply(message, 'I couldn\'t find that user!');
                        return;
                      }
                      octopus.firebase_storage.teams.updateAssignee(task.uuid, username);
                      octopus.bot.reply(message, task.id + " has been assigned to @" + username);
                    })
                    exists = true;
                  }
                });
                if (!exists) {
                  octopus.bot.reply(message, 'I couldn\'t find a task with that ID!');
                }
              }
            })

          } else {
              // this happens if the conversation ended prematurely for some reason
              bot.reply(message, 'Okay, nevermind!');
          }
      });
    }
  });
});


/* Assign a task using command %assign (task_id) to @username */
octopus.controller.hears('%assign', ['ambient', 'direct_message', 'direct_mention', 'mention'], function(bot, message) {
  var command = message.text.split(" ")[0];
  var task_id = Task.getTaskBody(message.text);
  var messageArraySize = message.text.split(" ").length-1;
  var assignedUserID = message.text.split(" ")[messageArraySize].substring(2, message.text.split(" ")[messageArraySize].length-1);

  octopus.firebase_storage.teams.all(function(err, data) {
    if (err) {
      octopus.bot.reply(message, 'Sorry, I couldn\'t access task database!');
      return;
    }

    var exists = false;

    if (data) {
      data.map(function(task) {
        if (task_id == task.id) {

          User.getUserName(assignedUserID, function(username) {
            if(username == "usernameNotFound") {
              octopus.bot.reply(message, 'I couldn\'t find that user!');
              return;
            }
            octopus.firebase_storage.teams.updateAssignee(task.uuid, username);
            octopus.bot.reply(message, task.id + " has been assigned to @" + username);
          })
          exists = true;
        }
      });
      if (!exists) {
        octopus.bot.reply(message, 'I couldn\'t find a task with that ID!');
      }
    }
  })
});