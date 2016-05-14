var octopus = require('../botconfig');
var Task = require('../schemas/Task');
var User = require('../schemas/User');

/* Provides functionality for Claim, Remove, and Complete emoji buttons
   on each task */
octopus.controller.on('reaction_added', function(bot, event) {
    if (event.user != event.item_user) {
      if (event.reaction == 'x') {
        // Get task ID and run remove function
        Task.getTaskID(event.item.channel, event.item.ts, function(taskid) {
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
                    octopus.firebase_storage.teams.del(task.uuid);
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
        Task.getTaskID(event.item.channel, event.item.ts, function(taskid) {
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
                    User.getUserName(event.user, function(username) {
                      octopus.firebase_storage.teams.updateAssignee(task.uuid, username);
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
       Task.getTaskID(event.item.channel, event.item.ts, function(taskid) {
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
                    octopus.firebase_storage.teams.del(task.uuid);
                    User.getUserName(event.user, function(username) { bot.reply(event.item, "Task " + taskid + " has been completed by " + username + "!"); } );

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
