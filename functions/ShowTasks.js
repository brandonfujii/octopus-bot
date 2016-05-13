var octopus = require('../botconfig');


/* Loops and prints out all Claimed Tasks */
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

/* Loops and prints out all Unclaimed Tasks */
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

// Bot listens for 'show tasks' to retrieve and display tasks from firebase
octopus.controller.hears(['%show', 'see tasks', 'show tasks', 'see my tasks', 'show my tasks', 'task list', 'show me my tasks', 'show me the tasks', 'show me tasks'], ['ambient', 'direct_message', 'direct_mention','mention'], function(bot, message) {
  showTasks(message);
});
