var octopus = require('../botconfig');
var uniquify = require('../codify');
var Task = require('../schemas/Task');

/* Add a task through natural language */
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
            var task = new Task.TaskItem(Date.now(), task_id, body, message.user, null, null, null, null, null);

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

/* Add a task through command %add 
Example: %add (this is my task) */
octopus.controller.hears('add', ['direct_message', 'direct_mention' ,'mention'], function(bot, message) {

    
    var command = message.text.split(" ")[0];
    var body = Task.getTaskBody(message.text);
    var task_id = uniquify.checkDBForExistingID();
    var task = new Task.TaskItem(Date.now(), task_id, body, message.user, null, null, null, null, null);

    octopus.firebase_storage.teams.save(task, function(err) {
      if (err) {
        octopus.bot.reply(message, 'Sorry, I couldn\'t add your task!');
      }
      else {

        octopus.bot.reply(message, 'Nice! You\'ve added a task called \"' + task.body + '\" with the id, _' + task.id + '_');
      }
    })

});


