// use .env file
require('dotenv').config()
var Botkit = require('botkit');
var firebase_storage = require(__dirname + '/database/storage')({
    firebase_uri: process.env.FIREBASE_URI
});
var uniquify = require('./uniquify');


// Intialize botkit controller
var controller = Botkit.slackbot();

// Define a slack bot based on unique access token
var bot = controller.spawn({
  token: process.env.SLACK_ACCESS_TOKEN
})

// Start bot and handle error if it fails
bot.startRTM(function(err, bot, payload) {
  if (err) {
    throw new Error('Could not connect to Slack');
  }
});

// Task Object Constructor
function Task(id, body, author, assignee) {
	this.id = id;
	this.body = body;
	this.author = author;
	this.assignee = assignee;
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
controller.hears('help', 'direct_message,direct_mention,mention', function(bot, message) {
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

  bot.reply(message,{
    text: 'Here are some commands you can perform with Octopus:',
    attachments: attachments,
  },function(err,resp) {
    console.log(err,resp);
  });
});

// ADD: Bot listens for 'add' to add a task to firebase
controller.hears('add', 'direct_message,direct_mention,mention', function(bot, message) {
	var command = message.text.split(" ")[0];
	var body = getTaskBody(message.text);
	var task_id = uniquify.getUniqueID();
	var task = new Task(task_id, body, message.user, null);

	firebase_storage.teams.save(task, function(err) {
		if (err) {
			bot.reply(message, 'Sorry, I couldn\'t add your task!');
		}
		else {
			bot.reply(message, 'Task added!');
		}
	})
});

// DELETE: Bot listens for 'delete' and a (task_id), then deletes
// task with id from database
controller.hears('delete', 'direct_message,direct_mention,mention', function(bot, message) {
	var command = message.text.split(" ")[0];
	var task_id = parseInt(getTaskBody(message.text));

	firebase_storage.teams.get(task_id, function(err, team) {

	})

});


// SHOW TASKS: Bot listens for 'show tasks' to retrieve and display tasks from firebase
controller.hears('show tasks', 'direct_message,direct_mention,mention', function(bot, message) {
	firebase_storage.teams.all(function(err, data) {
		if (err) {
			bot.reply(message, 'Sorry, I couldn\'t retrieve tasks!');
			return;
		}

		if (data) {
			var attachments = [];

			data.map(function(task) {
				var TaskItem = {
			  	title: 'Task ' + task.id,
			    color: uniquify.getColor(),
			    fields: [],
			  };

				TaskItem.fields.push({
			    label: 'TaskItem',
			    value: task.body,
			    short: true,
			  });

			  attachments.push(TaskItem);
			});



			bot.reply(message,{
		    text: 'Your Team\'s Tasks:',
		    attachments: attachments,
		  }, function(err,resp) {
		    console.log(err,resp);
		  });

		}

	})

});

// CLAIM: Bot listens for 'claim' to have the user claim a task
controller.hears('claim', 'direct_message,direct_mention,mention', function(bot, message) {
	var command = message.text.split(" ")[0];
	var task_id = getTaskBody(message.text);

	//TODO: assign task to user

	firebase_storage.teams.get(task_id, function(err, team) {
		if (err) {
			bot.reply(message, 'Sorry, I couldn\'t add your task!');
		}
		else {
			bot.reply(message, "[" + team.body + "] has been claimed.");
		}
	})
});



