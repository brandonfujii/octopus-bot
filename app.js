// App.js: contains all Slack commands and interactions
// with tasks

// define database and botkit controller
var octopus = require('./botconfig');
// get unique ID functions
var uniquify = require('./codify');
// Slack package to get data from Slack
var Slack = require('slack-node');
var async = require('async');

slack = new Slack(process.env.SLACK_ACCESS_TOKEN);

function getUserName(userID, callback) {
  slack.api("users.list", function(err, response) {
    var memberdata = response.members;
    console.log(userID);
    for(var i = 0; i < memberdata.length; i++) {
      if (memberdata[i].id == userID) {
          return callback(memberdata[i].name);
        }
    }
    return callback("usernameNotFound");
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
octopus.controller.hears('help', ['direct_message', 'direct_mention', 'mention'], function(bot, message) {
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

octopus.controller.hears('clear', ['direct_message', 'direct_mention', 'mention'], function(bot, message) {
  var command = message.text.split(" ")[0];
  var task_id = getTaskBody(message.text);

  octopus.firebase_storage.teams.all(function(err, data) {
    if (err) {
      octopus.bot.reply(message, 'Sorry, I couldn\'t access task database!');
      return;
    }

    if (data) {
      data.map(function(task) {
          octopus.firebase_storage.teams.del(task.id);
      });
    }

    octopus.bot.reply(message, 'All tasks cleared!');
  })
});


octopus.controller.hears(['add a task', 'add task', 'add meeting', 'add to tasks'], ['ambient', 'direct_message', 'direct_mention', 'mention'], function(bot, message) {
  octopus.bot.startConversation(message, function(err, convo) {
    if (!err) {
      convo.ask('What do you want to add?', function(response, convo) {
        convo.ask('You want to add *' + response.text + '*?', [
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
      }, {'key': 'taskbody'});

      convo.on('end', function(convo) {
          if (convo.status == 'completed') {
            var body = convo.extractResponse('taskbody');
            var task_id = uniquify.checkDBForExistingID();
            var task = new Task(task_id, body, message.user, null, null, null, null, null);

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
    var task_id = uniquify.checkDBForExistingID();
    var task = new Task(task_id, body, message.user, null, null, null, channel, null);

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
    var task_id = uniquify.checkDBForExistingID();
    var task = new Task(task_id, body, message.user, null, null, null, null, null);

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
          octopus.bot.reply(message, 'Task ' + task_id + ' removed');
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

function loopClaimedTasks(arr, message, callback) {
  for (var i = 0; i < arr.length; i++) {
    octopus.bot.reply(message, {
      attachments: [arr[i]],
    }, function(err, resp) {
      console.log(err, resp);

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
    });
  }

  if (callback) {
    callback(message)
  }
}

function loopUnclaimedTasks(arr, message, callback) {
  for (var i = 0; i < arr.length; i++) {
    octopus.bot.reply(message, {
      attachments: [arr[i]],
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
    });
  }

  if (callback) {
    callback(message)
  }
}

function botreply(message) {
  octopus.bot.reply(message, {
    text: 'Unclaimed Tasks:',
  }, function(err, resp) {
    console.log(err, resp);
  })
}

function showTasks(message) {
  octopus.firebase_storage.teams.all(function(err, data) {
    if (err) {
      octopus.bot.reply(message, 'Sorry, I couldn\'t retrieve tasks!');
      return;
    }

    if (data) {
      var claimed = [];
      var unclaimed = [];

      data.map(function(task) {
        if (task.assignee) {
          task.hex = '54D260';
        }
        else {
          task.hex = 'E85D4C';
        }

        var TaskItem = {
            title: 'Task ' + task.id,
            color: '#' + task.hex,
            fields: [],
            mrkdwn_in: ['text', 'pretext', 'fields'],
        };

      if (task.assignee) {

          TaskItem.fields.push({
            label: 'TaskItem',
            value: task.body,
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
            value: task.body,
            short: true,
          });

          unclaimed.push(TaskItem);
        }

      });

      function startUnclaimed() {
        if (unclaimed.length != 0) {
           octopus.bot.reply(message, {
            text: '*Unclaimed Tasks*',
          }, loopUnclaimedTasks(unclaimed, message));
        }
        else {
          octopus.bot.reply(message, "*Unclaimed Tasks:*");
          octopus.bot.reply(message, "No unclaimed tasks.");
        }
      }

      if (claimed.length != 0) {
        octopus.bot.reply(message, {
          text: '*Claimed Tasks:*',
        }, loopClaimedTasks(claimed, message));
      }
      else {
        octopus.bot.reply(message, "*Claimed Tasks:*");
        octopus.bot.reply(message, "No claimed tasks.");
      }

      setTimeout(startUnclaimed, 1000);
    }

    else {
      octopus.bot.reply(message, "There are no tasks available.");
    }
  })
}
// SHOW TASKS: Bot listens for 'show tasks' to retrieve and display tasks from firebase
octopus.controller.hears(['%show', 'show', 'see tasks', 'show tasks', 'see my tasks', 'show my tasks', 'task list', 'show me my tasks', 'show me the tasks', 'show me tasks'], ['ambient', 'direct_message', 'direct_mention','mention'], function(bot, message) {
  showTasks(message);
});

//handleClaim -- simplifies claim functions
function handleClaim(data, err, bot, message, task_id) {

    var exists = false;

    if (data) {
      data.map(function(task) {
        if (task_id == task.id) {
          getUserName(message.user, function(username) {
          	if(task.assignee==username) {
          		octopus.bot.reply(message, 'Looks like you\'re already in charge of this task!');
			    return;
          	}
          	else if(task.assignee) {
			  octopus.bot.startConversation(message, function(err, convo) {
			    if (!err) {
			      convo.ask('Looks like ' + task.id + ' is already claimed by ' + task.assignee + '. Are you sure you want to claim this task?', [
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
          	}
          	else {
	            octopus.firebase_storage.teams.updateAssignee(task_id, username);
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

// CLAIM: Bot listens for 'claim' to have the user claim a task
octopus.controller.hears('%claim', ['ambient', 'direct_message', 'direct_mention', 'mention'], function(bot, message) {
  var command = message.text.split(" ")[0];
  var task_id = getTaskBody(message.text);


  octopus.firebase_storage.teams.all(function(err, data) {
    if (err) {
      octopus.bot.reply(message, 'Sorry, I couldn\'t access task database!');
      return;
    }
    handleClaim(data, err, bot, message, task_id);
  })
});

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

                    getUserName(assigneeID, function(username) {
                      if(username == "usernameNotFound") {
                        octopus.bot.reply(message, 'I couldn\'t find that user!');
                        return;
                      }
                      octopus.firebase_storage.teams.updateAssignee(task_id, username);
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

// ASSIGN: Bot listens for 'assign' to have a task assigned to a specific user
octopus.controller.hears('%assign', ['ambient', 'direct_message', 'direct_mention', 'mention'], function(bot, message) {
  var command = message.text.split(" ")[0];
  var task_id = getTaskBody(message.text);
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

          getUserName(assignedUserID, function(username) {
            if(username == "usernameNotFound") {
              octopus.bot.reply(message, 'I couldn\'t find that user!');
              return;
            }
            octopus.firebase_storage.teams.updateAssignee(task_id, username);
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

function getTaskID(channel_id, timestamp, callback) {
  slack.api("channels.history", {
      channel: channel_id,
      latest: timestamp,
      count: 1,
      inclusive: 1
    }, function(err, response) {
      if (response.messages[0].attachments) {
         return callback(parseTask(response.messages[0].attachments[0].title));
      }
      else {
        return callback("NotATask");
      }
  });
}

function parseTask(title) {
  return title.split(" ")[1];
}


// REACTION CONTROLLERS
octopus.controller.on('reaction_added', function(bot, event) {
    if (event.user != event.item_user) {
      if (event.reaction == 'x') {
        // Get task ID and run remove function
        getTaskID(event.item.channel, event.item.ts, function(taskid) {
          if (taskid == "NotATask") {
            bot.reply(event.item, "The post you tried to claim is not a task");
          }
          else {
            octopus.firebase_storage.teams.all(function(err, data) {
              if (err) {
                octopus.bot.reply(event.item, 'Sorry, I couldn\'t access task database!');
                return;
              }

              var exists = false;

              if (data) {
                data.map(function(task) {
                  if (taskid == task.id) {
                    // DELETE function here
                    octopus.firebase_storage.teams.del(taskid);
                    octopus.bot.reply(event.item, 'Task ' + taskid + ' removed!');
                    // showTasks(event.item);
                    exists = true;
                  }
                });
                if (!exists) {
                  octopus.bot.reply(event.item, 'I couldn\'t find a task with that ID!');
                }
              }
            })
          }
        });
      }

     else if (event.reaction == 'hand') {
       // Get task ID and user ID and run claim function
        getTaskID(event.item.channel, event.item.ts, function(taskid) {
          if (taskid == "NotATask") {
            bot.reply(event.item, "The post you tried to claim is not a task");
          }
          else {
            octopus.firebase_storage.teams.all(function(err, data) {
              if (err) {
                octopus.bot.reply(event.item, 'Sorry, I couldn\'t access task database!');
                return;
              }

              var exists = false;

              if (data) {
                data.map(function(task) {
                  if (taskid == task.id) {
                    // PATCH function here
                    getUserName(event.user, function(username) {
                      octopus.firebase_storage.teams.updateAssignee(taskid, username);
                      octopus.bot.reply(event.item, username + " has claimed task " + task.id);
                      // showTasks(event.item);
                    })
                    exists = true;
                  }
                });
                if (!exists) {
                  octopus.bot.reply(event.item, 'I couldn\'t find a task with that ID!');
                }
              }
            })
          }
        });
     }

     else if (event.reaction == 'white_check_mark') {
       // Get task ID and run complete function
       getTaskID(event.item.channel, event.item.ts, function(taskid) {
          if (taskid == "NotATask") {
            bot.reply(event.item, "The post you tried to claim is not a task");
          }
          else {
            octopus.firebase_storage.teams.all(function(err, data) {
              if (err) {
                octopus.bot.reply(event.item, 'Sorry, I couldn\'t access task database!');
                return;
              }

              var exists = false;

              if (data) {
                data.map(function(task) {
                  if (taskid == task.id) {
                    // DELETE function here
                    octopus.firebase_storage.teams.del(taskid);
                    getUserName(event.user, function(username) { bot.reply(event.item, "Task " + taskid + " has been claimed by " + username + "!"); } );

                    exists = true;
                  }
                });
                if (!exists) {
                  octopus.bot.reply(event.item, 'I couldn\'t find a task with that ID!');
                }
              }
            })
          }
        });
     }
     else {
       // do nothing
       bot.reply(event.item, ":" + event.reaction + ": back at you!");
     }
   }
});

