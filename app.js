// App.js: contains all Slack commands and interactions
// with tasks

// define database and botkit controller
var octopus = require('./botconfig');
// get unique ID functions
var uniquify = require('./uniquify');

// Task Object Constructor
function Task(id, body, author, assignee, color, hex) {
	this.id = id;
	this.body = body;
	this.author = author;
	this.assignee = assignee;
	this.color = color;
	this.hex = hex;
}

// Parses command to get task user wants to interact with
// Pattern: COMMAND [space] (TASKBODY)
function getTaskBody( str ) {
	if (/\w+\s\([^)]+\)/g.test(str)) {
		return str.match(/\(([^)]+)\)/)[1];
	}
	else {
		return "Command not found";
	}
}

// HELP: Bot listens for 'help', then shows documentation for octopus
octopus.controller.hears('help', 'direct_message,direct_mention,mention', function(bot, message) {
  var attachments = [];
  var addTaskHelp = {
  	title: 'Adding a task:',
    color: '#FF7E82',
    fields: [],
  };

  var showTasksHelp = {
  	title: 'Viewing your team\'s tasks:',
    color: '#FF7E82',
    fields: [],
  };

  addTaskHelp.fields.push({
    label: 'AddTask',
    value: '@slacktopus: add (your_task)',
    short: true,
  });

  showTasksHelp.fields.push({
    label: 'ShowTask',
    value: '@slacktopus: show tasks',
    short: true,
  });

  attachments.push(addTaskHelp);
  attachments.push(showTasksHelp);

  octopus.bot.reply(message,{
    text: 'Here are some commands you can perform with Octopus:',
    attachments: attachments,
  },function(err,resp) {
    console.log(err,resp);
  });
});

// ADD: Bot listens for 'add' to add a task to firebase
octopus.controller.hears('add', 'direct_message,direct_mention,mention', function(bot, message) {
	var command = message.text.split(" ")[0];
	var body = getTaskBody(message.text);
	var id_tag = uniquify.checkDBForExistingID();
	var task_id = id_tag.id;
	var colorObj = id_tag.color;
	var task = new Task(task_id, body, message.user, null, colorObj.name, colorObj.hex);

	octopus.firebase_storage.teams.save(task, function(err) {
		if (err) {
			octopus.bot.reply(message, 'Sorry, I couldn\'t add your task!');
		}
		else {
			octopus.bot.reply(message, 'Task added!');
		}
	})
});

// REMOVE/COMPLETE: Bot listens for 'remove' or 'complete' and a (task_id), then deletes
// task with id from database
// TODO: give different responses to remove and complete
// For example, 'Task completed!', instead of 'Task removed' on complete
octopus.controller.hears(['remove', 'complete'], 'direct_message,direct_mention,mention', function(bot, message) {
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


// SHOW TASKS: Bot listens for 'show tasks' to retrieve and display tasks from firebase
octopus.controller.hears('show tasks', 'direct_message,direct_mention,mention', function(bot, message) {
	octopus.firebase_storage.teams.all(function(err, data) {
		if (err) {
			octopus.bot.reply(message, 'Sorry, I couldn\'t retrieve tasks!');
			return;
		}

		if (data) {
			var attachments = [];

			data.map(function(task) {
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

			  attachments.push(TaskItem);
			});

			octopus.bot.reply(message,{
		    text: 'Your Team\'s Tasks:',
		    attachments: attachments,
		  }, function(err,resp) {
		    console.log(err,resp);
		  });

		}

	})

});

// CLAIM: Bot listens for 'claim' to have the user claim a task
octopus.controller.hears('claim', 'direct_message,direct_mention,mention', function(bot, message) {
	var command = message.text.split(" ")[0];
	var task_id = getTaskBody(message.text);

	//TODO: assign task to user

	octopus.firebase_storage.teams.get(task_id, function(err, team) {
		if (err) {
			octopus.bot.reply(message, 'Sorry, I couldn\'t add your task!');
		}
		else {
			octopus.bot.reply(message, "[" + team.body + "] has been claimed.");
		}
	})
});



