// App.js: contains all Slack commands and interactions
// with tasks

// define database and botkit controller
var octopus = require('./botconfig');
var botloader = require('./botloader');

botloader.With({
	slack: 'slackvalue'
});
// get unique ID functions
var uniquify = require('./codify');
// Slack package to get data from Slack
var Slack = require('slack-node');
slack = new Slack(process.env.SLACK_ACCESS_TOKEN);

// Functions 
var AddTask = require('./functions/AddTask');
var UnclaimTask = require('./functions/UnclaimTask');
var ClaimTask = require('./functions/ClaimTask');
var AssignTask = require('./functions/AssignTask');
var ShowTasks = require('./functions/ShowTasks');
var RemoveTask = require('./functions/RemoveTask');
var CompleteTask = require('./functions/CompleteTask');
var Help = require('./functions/Help');
var Reactions = require('./functions/ReactionFunctions');
var ClearTasks = require('./functions/ClearTasks');
var Discourse = require('./functions/Discourse');