// App.js: contains all Slack commands and interactions
// with tasks

// define database and botkit controller
var octopus = require('./botconfig');
// get unique ID functions
var uniquify = require('./uniquify');
// Slack package to get data from Slack
var Slack = require('slack-node');

slack = new Slack(process.env.SLACK_ACCESS_TOKEN);

function getUserName(userID, callback) {
  slack.api("users.list", function(err, response) {
    var memberdata = response.members;
    for(var i = 0; i < memberdata.length; i++) {
      if (memberdata[i].id == userID) {
          return callback(memberdata[i].name);
        }
    }
    return callback("usernameNotFound");
  });
}

function doesUserExist(userID, callback) {
  slack.api("users.list", function(err, response) {
    var memberdata = response.members;
    for(var i = 0; i < memberdata.length; i++) {
      if (memberdata[i].id == userID) {
          return true;
        }
    }
    return false;
  });
}


// Task Object Constructor
function Task(id, body, author, assignee, color, hex, channel, status) {
  this.id = id;
  this.body = body;
  this.author = author;
  this.assignee = assignee;
  this.color = color;
  this.hex = hex;
  this.channel = channel;
  this.status = status;
}

// Parses command to get task user wants to interact with
// Pattern: COMMAND [space] (TASKBODY)
function getTaskBody( str ) {
  if (/\w+\s\([^)]+\)/g.test(str)) {
    return str.match(/\(([^)]+)\)/)[1];
  }
  else {
    return;
  }
}

function getChannel( str ) {
  if (/#\w+/g.test(str)) {
    return str.match(/#(\w+)/)[1]
  }
  else {
    return;
  }
}

// HELP: Bot listens for 'help', then shows documentation for octopus
octopus.controller.hears('help', ['ambient', 'direct_message', 'direct_mention', 'mention'], function(bot, message) {
  var attachments = [];
  var addTaskHelp = {
    title: 'Adding a task:',
    color: '#FF7E82',
    fields: [],
    mrkdwn_in: ['text', 'pretext', 'fields']
  };

  var showTasksHelp = {
    title: 'Viewing your team\'s tasks:',
    color: '#FF7E82',
    fields: [],
    mrkdwn_in: ['text', 'pretext', 'fields']
  };

  var removeTaskHelp = {
    title: 'Removing a task:',
    color: '#FF7E82',
    fields: [],
    mrkdwn_in: ['text', 'pretext', 'fields']
  };

  var completeTaskHelp = {
    title: 'Completing a task:',
    color: '#FF7E82',
    fields: [],
    mrkdwn_in: ['text', 'pretext', 'fields']
  };

  var claimTaskHelp = {
    title: 'Claiming a task:',
    color: '#FF7E82',
    fields: [],
    mrkdwn_in: ['text', 'pretext', 'fields']
  };

  var assignTaskHelp = {
    title: 'Assigning a task:',
    color: '#FF7E82',
    fields: [],
    mrkdwn_in: ['text', 'pretext', 'fields']
  };

  addTaskHelp.fields.push({
    label: 'AddTask',
    value: '`%add (your_task)`',
    short: true,
  });

  showTasksHelp.fields.push({
    label: 'ShowTask',
    value: '`%show`',
    short: true,
  });

  removeTaskHelp.fields.push({
    label: 'RemoveTask',
    value: '`%remove (task_id)`',
    short: true,
  });

  completeTaskHelp.fields.push({
    label: 'CompleteTask',
    value: '`%complete (task_id)`',
    short: true,
  });

  claimTaskHelp.fields.push({
    label: 'ClaimTask',
    value: '`%claim (task_id)`',
    short: true,
  });

  assignTaskHelp.fields.push({
    label: 'AssignTask',
    value: '`%assign (task_id) to @person`',
    short: true,
  });




  attachments.push(addTaskHelp);
  attachments.push(showTasksHelp);
  attachments.push(removeTaskHelp);
  attachments.push(completeTaskHelp);
  attachments.push(claimTaskHelp);
  attachments.push(assignTaskHelp);

  octopus.bot.reply(message,{
    text: 'Here are some commands you can perform with Octopus:',
    attachments: attachments,
  },function(err,resp) {
    console.log(err,resp);
  });
});


octopus.controller.hears(['add', 'add a task', 'add task', 'add meeting', 'add to tasks'], ['ambient', 'direct_message', 'direct_mention', 'mention'], function(bot, message) {
  octopus.bot.startConversation(message, function(err, convo) {
    if (!err) {
      convo.ask('What do you want to add?', function(response, convo) {
        convo.ask('You want to add *' + response.text + '*?', [
            {
              pattern: 'yes',
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
      }, {'key': 'taskbody'});

      convo.on('end', function(convo) {
                if (convo.status == 'completed') {
                  var body = convo.extractResponse('taskbody');
                    var id_tag = uniquify.checkDBForExistingID();
          var task_id = id_tag.id;
          var colorObj = id_tag.color;
          var task = new Task(task_id, body, message.user, null, colorObj.name, colorObj.hex, null, null);
                    
                    octopus.firebase_storage.teams.save(task, function(err) {
                      if (err) {
                        octopus.bot.reply(message, 'Sorry, I couldn\'t add your task!');
                      }
                      else {
                        octopus.bot.reply(message, 'Nice! You\'ve added a task called \"' + task.body + '\" with the id, _' + task.id + '_');
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

// ADD: Bot listens for 'add' to add a task to firebase
octopus.controller.hears('%add', ['ambient', 'direct_message', 'direct_mention' ,'mention'], function(bot, message) {

  if (message.text.split(" ")[0].indexOf('#') != -1) {
    // TODO: make a check to see if channel exists in team
    var channel = getChannel(message.text);
    var body = getTaskBody(message.text);
    var id_tag = uniquify.checkDBForExistingID();
    var task_id = id_tag.id;
    var colorObj = id_tag.color;
    var task = new Task(task_id, body, message.user, null, colorObj.name, colorObj.hex, channel, null);

    octopus.firebase_storage.channels.save(task, function(err) {
      if (err) {
        octopus.bot.reply(message, 'Sorry, I couldn\'t add your task!');
      }
      else {

        octopus.bot.reply(message, 'Task added to #' + channel + '!');
      }
    })
  }
  else {
    var command = message.text.split(" ")[0];
    var body = getTaskBody(message.text);
    var id_tag = uniquify.checkDBForExistingID();
    var task_id = id_tag.id;
    var colorObj = id_tag.color;
    var task = new Task(task_id, body, message.user, null, colorObj.name, colorObj.hex, null, null);

    octopus.firebase_storage.teams.save(task, function(err) {
      if (err) {
        octopus.bot.reply(message, 'Sorry, I couldn\'t add your task!');
      }
      else {

        octopus.bot.reply(message, 'Nice! You\'ve added a task called \"' + task.body + '\" with the id, _' + task.id + '_');
      }
    })
  }
  
});



octopus.controller.hears(['remove a task', 'remove task', 'remove my task', 'remove from tasks'], ['ambient', 'direct_message', 'direct_mention', 'mention'], function(bot, message) {
  octopus.bot.startConversation(message, function(err, convo) {
    if (!err) {
      convo.ask('Okay, what\'s the id of the task you want to remove?', function(response, convo) {
        convo.ask('You want to remove task *' + response.text + '*?', [
            {
              pattern: 'yes',
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


// REMOVE/COMPLETE: Bot listens for 'remove' or 'complete' and a (task_id), then deletes
// task with id from database
// TODO: give different responses to remove and complete
// For example, 'Task completed!', instead of 'Task removed' on complete
octopus.controller.hears('%remove', ['ambient', 'direct_message', 'direct_mention', 'mention'], function(bot, message) {
  var command = message.text.split(" ")[0];
  var task_id = getTaskBody(message.text);

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
          octopus.bot.reply(message, 'Task removed'); 
          exists = true;
        }
      });
      if (!exists) {
        octopus.bot.reply(message, 'I couldn\'t find a task with that ID!');
      }
    }
  })
});

octopus.controller.hears('%complete', ['ambient', 'direct_message', 'direct_mention', 'mention'], function(bot, message) {
  var command = message.text.split(" ")[0];
  var task_id = getTaskBody(message.text);

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
          octopus.bot.reply(message, 'Task completed!'); 
          exists = true;
        }
      });
      if (!exists) {
        octopus.bot.reply(message, 'I couldn\'t find a task with that ID!');
      }
    }
  })

});


// SHOW TASKS: Bot listens for 'show tasks' to retrieve and display tasks from firebase
octopus.controller.hears(['%show', 'show', 'see tasks', 'show tasks', 'see my tasks', 'show my tasks', 'task list', 'show me my tasks', 'show me the tasks', 'show me tasks'], ['ambient', 'direct_message', 'direct_mention','mention'], function(bot, message) {

  octopus.firebase_storage.teams.all(function(err, data) {
    if (err) {
      octopus.bot.reply(message, 'Sorry, I couldn\'t retrieve tasks!');
      return;
    }

/*
<<<<<<< HEAD
    if (data) {
      octopus.bot.reply(message, {
        text: '\tclaim: :raised_hand:\t delete: :x:\t complete: :white_check_mark:', 
      }, function(err, resp) {
        console.log(err, resp);
      });
      data.forEach(function(task) {
        var TaskItem = {
          title: 'Task ' + task.id,
          color: '#' + task.hex,
          fields: [],
        };
        
        TaskItem.fields.push({
          label: 'TaskItem',
          value: task.body,
          short: true,
        });
        octopus.bot.reply(message, {
          attachments: [TaskItem],
        }, function(err, resp) {
          console.log(err, resp);
          octopus.bot.api.reactions.add({
            timestamp: resp.ts,
            channel: resp.channel,
            name: 'raised_hand',
          }, function (err, message) {
            if (err) {
              bot.botkit.log('Failed to add CLAIM emoji reaction.');
            }
            octopus.bot.api.reactions.add({
              timestamp: resp.ts,
              channel: resp.channel,
              name: 'x',
            }, function (err, message) {
              if (err) {
                bot.botkit.log('Failed to add DELETE emoji reaction.');
              }
              octopus.bot.api.reactions.add({
                timestamp: resp.ts,
                channel: resp.channel,
                name: 'white_check_mark',
              }, function (err, message) {
                if (err) {
                  bot.botkit.log('Failed to add COMPLETE emoji reaction.');
                }
              })
            })
          })
        }); //
      })
    }
=======
*/
    if (data) {
      var claimed = [];
      var unclaimed = [];

      data.map(function(task) {
        var TaskItem = {
            title: 'Task ' + task.id,
            color: '#' + task.hex,
            fields: [],
            mrkdwn_in: ['text', 'pretext', 'fields'],
          };

      if (task.assignee) {

        TaskItem.fields.push({
            label: 'TaskItem',
            value: '*Task*: ' + task.body,
            short: true,
          });

          TaskItem.fields.push({
            label: 'AssignedTo',
            value: '*Assigned to*: @' + task.assignee,
            short: true,
          });

          claimed.push(TaskItem);
          
        }

        else {
          TaskItem.fields.push({
            label: 'TaskItem',
            value: '*Task*: ' + task.body,
            short: true,
          });

          unclaimed.push(TaskItem);
        }
        
      });

      octopus.bot.reply(message, {
        text: 'Claimed Tasks:', 
      }, function(err, resp) {
        console.log(err, resp);
      })

      for (var i = 0; i < claimed.length; i++) {
        octopus.bot.reply(message, {
          attachments: [claimed[i]],
        }, function(err, resp) {
          console.log(err, resp);

          octopus.bot.api.reactions.add({
            timestamp: resp.ts,
            channel: resp.channel,
            name: 'raised_hand',
          }, function (err, message) {
            if (err) {
              bot.botkit.log('Failed to add CLAIM emoji reaction.');
            }

            octopus.bot.api.reactions.add({
              timestamp: resp.ts,
              channel: resp.channel,
              name: 'x',
            }, function (err, message) {
              if (err) {
                bot.botkit.log('Failed to add DELETE emoji reaction.');
              }

              octopus.bot.api.reactions.add({
                timestamp: resp.ts,
                channel: resp.channel,
                name: 'white_check_mark',
              }, function (err, message) {
                if (err) {
                  bot.botkit.log('Failed to add COMPLETE emoji reaction.');
                }
              })
            })
          })
        }); //
      }

      octopus.bot.reply(message, {
        text: 'Unclaimed Tasks:', 
      }, function(err, resp) {
        console.log(err, resp);
      })

      for (var i = 0; i < unclaimed.length; i++) {
        octopus.bot.reply(message, {
          attachments: [unclaimed[i]],
        }, function(err, resp) {
          console.log(err, resp);

          octopus.bot.api.reactions.add({
            timestamp: resp.ts,
            channel: resp.channel,
            name: 'raised_hand',
          }, function (err, message) {
            if (err) {
              bot.botkit.log('Failed to add CLAIM emoji reaction.');
            }

            octopus.bot.api.reactions.add({
              timestamp: resp.ts,
              channel: resp.channel,
              name: 'x',
            }, function (err, message) {
              if (err) {
                bot.botkit.log('Failed to add DELETE emoji reaction.');
              }

              octopus.bot.api.reactions.add({
                timestamp: resp.ts,
                channel: resp.channel,
                name: 'white_check_mark',
              }, function (err, message) {
                if (err) {
                  bot.botkit.log('Failed to add COMPLETE emoji reaction.');
                }
              })
            })
          })
        }); //
      }

      /*
      octopus.bot.reply(message,{
        text: 'Claimed Tasks:',
        attachments: claimed,
      }, function(err,resp) {
        console.log(err,resp);
      });
      octopus.bot.reply(message,{
        text: 'Unclaimed Tasks:',
        attachments: unclaimed,
      }, function(err,resp) {
        console.log(err,resp);
      */
    }

//>>>>>>> c9ef4545e3ad160bad7980ac1f90e79f7fb3be60
  })
});


octopus.controller.hears(['claim a task', 'claim it', 'claim my task', 'claim that task'], ['ambient', 'direct_message', 'direct_mention', 'mention'], function(bot, message) {
  octopus.bot.startConversation(message, function(err, convo) {
    if (!err) {
      convo.ask('What\'s the task id of the task you want to claim?', function(response, convo) {
        convo.ask('You want to claim task *' + response.text + '*?', [
            {
              pattern: 'yes',
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
                        data.map(function(task) {
                          if (task_id == task.id) {
                            getUserName(message.user, function(username) {
                              octopus.firebase_storage.teams.updateAssignee(task_id, username);
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
});

// CLAIM: Bot listens for 'claim' to have the user claim a task
octopus.controller.hears('%claim', ['ambient', 'direct_message', 'direct_mention', 'mention'], function(bot, message) {
  var command = message.text.split(" ")[0];
  var task_id = getTaskBody(message.text);

  //TODO: assign task to user
  octopus.firebase_storage.teams.all(function(err, data) {
    if (err) {
      octopus.bot.reply(message, 'Sorry, I couldn\'t access task database!');
      return;
    }

    var exists = false;

    if (data) {
      data.map(function(task) {
        if (task_id == task.id) {
          // PATCH function here
          getUserName(message.user, function(username) {
            octopus.firebase_storage.teams.updateAssignee(task_id, username);
            octopus.bot.reply(message, username + " has claimed task " + task.id);
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

// ASSIGN: Bot listens for 'assign' to have a task assigned to a specific user
octopus.controller.hears('%assign', ['ambient', 'direct_message', 'direct_mention', 'mention'], function(bot, message) {
  var command = message.text.split(" ")[0];
  var task_id = getTaskBody(message.text);
  var assignedUserID = message.text.split(" ")[3].substring(2, message.text.split(" ")[3].length-1);

  //TODO: assign task to user
  octopus.firebase_storage.teams.all(function(err, data) {
    if (err) {
      octopus.bot.reply(message, 'Sorry, I couldn\'t access task database!');
      return;
    }

    var exists = false;

    if (data) {
      data.map(function(task) {
        if (task_id == task.id) {

          getUserName(assignedUserID, function(username) {
            console.log("username is " + username);
            if(username == "usernameNotFound") {
              octopus.bot.reply(message, 'I couldn\'t find that user!');
              return;
            }
            octopus.firebase_storage.teams.updateAssignee(task_id, username);
            octopus.bot.reply(message, task.id + " has been assigned to " + username);
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
