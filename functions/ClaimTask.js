var octopus = require('../botconfig');
var uniquify = require('../codify');
var Task = require('../schemas/Task');
var User = require('../schemas/User');


/* handleClaim */
function handleClaim(data, err, bot, message, task_id) {

    var exists = false;

    if (data) {
      data.map(function(task) {
        if (task_id == task.id) {
          User.getUserName(message.user, function(username) {
            if(task.assignee==username) {
              octopus.bot.reply(message, 'Looks like you\'re already in charge of this task!');
          return;
            }
            else if(task.assignee) {
        octopus.bot.startConversation(message, function(err, convo) {
          if (!err) {
            convo.ask('Looks like ' + task.id + ' is already claimed by ' + task.assignee + '. Are you sure you want to claim this task?', [
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

            convo.on('end', function(convo) {
                if (convo.status == 'completed') {
                    octopus.firebase_storage.teams.all(function(err, data) {
                      if (err) {
                        octopus.bot.reply(message, 'Sorry, I couldn\'t access task database!');
                        return;
                      }

                      var exists = false;

                      if (data) {
                        data.map(function(task) {
                          if (task_id == task.id) {
                            User.getUserName(message.user, function(username) {
                              octopus.firebase_storage.teams.updateAssignee(task.uuid, username);
                              octopus.bot.reply(message, username + " has claimed task " + task.id);
                            });
                            exists = true;
                          }
                        });

                        if (!exists) {
                          octopus.bot.reply(message, 'I couldn\'t find a task with that ID!');
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
            }
            else {
              octopus.firebase_storage.teams.updateAssignee(task.uuid, username);
              octopus.bot.reply(message, username + " has claimed task " + task.id);
          }
          })
          exists = true;
        }
      });
      if (!exists) {
        octopus.bot.reply(message, 'I couldn\'t find a task with that ID!');
      }
    }
}


/* Claim a task through natural language */
octopus.controller.hears(['claim a task', 'claim it', 'claim my task', 'claim that task'], ['ambient', 'direct_message', 'direct_mention', 'mention'], function(bot, message) {
  octopus.bot.startConversation(message, function(err, convo) {
    if (!err) {
      convo.ask('What\'s the task id of the task you want to claim?', function(response, convo) {
        convo.ask('You want to claim task *' + response.text + '*?', [
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
                  octopus.bot.reply(message, 'Sorry, I couldn\'t access task database!');
                  return;
                }

                var exists = false;

                if (data) {
                	handleClaim(data, err, bot, message, task_id);
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


octopus.controller.hears('claim', ['direct_message', 'direct_mention', 'mention'], function(bot, message) {
  var command = message.text.split(" ")[0];
  var task_id = Task.getTaskBody(message.text);

  if (command == 'claim') {
    octopus.firebase_storage.teams.all(function(err, data) {
      if (err) {
        octopus.bot.reply(message, 'Sorry, I couldn\'t access task database!');
        return;
      }
      if (task_id) {
        handleClaim(data, err, bot, message, task_id);
      }
      else {
        octopus.bot.reply(message, "I couldn't find that task ID you specified! Type `@slacktopus: help` to view all the things you can do lol!");
      }
    })
  }
});

