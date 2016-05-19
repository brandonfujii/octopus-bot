var octopus = require('../botconfig');

// Bot listens for '@slacktopus: help', then shows documentation for octopus
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
    value: '`@slacktopus: add (your task)`',
    short: true,
  });

  showTasksHelp.fields.push({
    label: 'ShowTask',
    value: '`@slacktopus: show tasks`',
    short: true,
  });

  removeTaskHelp.fields.push({
    label: 'RemoveTask',
    value: '`@slacktopus: remove (task id)`',
    short: true,
  });

  completeTaskHelp.fields.push({
    label: 'CompleteTask',
    value: '`@slacktopus: complete (task id)`',
    short: true,
  });

  claimTaskHelp.fields.push({
    label: 'ClaimTask',
    value: '`@slacktopus: claim (task id)`',
    short: true,
  });

  assignTaskHelp.fields.push({
    label: 'AssignTask',
    value: '`@slacktopus: assign (task id) to @person`',
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