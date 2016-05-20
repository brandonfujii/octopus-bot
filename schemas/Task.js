var octopus = require('../botconfig');

// Task Object Constructor
function TaskItem(uuid, id, body, author, assignee, color, hex, channel, status) {
  this.uuid = uuid;
  this.id = id;
  this.body = body;
  this.author = author;
  this.assignee = assignee;
  this.color = color;
  this.hex = hex;
  this.channel = channel;
  this.status = status;
}

/* Parses command to get task user wants to interact with
   Pattern: COMMAND [space] (TASKBODY)
*/
function getTaskBody( str ) {
  if (/\w+\s\([^)]+\)/g.test(str)) {
    return str.match(/\(([^)]+)\)/)[1];
  }
  else {
    return null;
  }
}


/* Retrieves a task's ID from it's timestamp */
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

module.exports = {
	TaskItem: TaskItem,
	getTaskBody: getTaskBody,
	getTaskID: getTaskID
}
