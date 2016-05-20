var octopus = require('../botconfig');

octopus.controller.hears(['hey', 'hello', 'hi', 'what up', 'sup', 'whaddup'],['direct_message', 'direct_mention', 'mention'], function(bot,message) {
	var greet = function(response, convo) {
	  convo.ask("Hey, how's it going?", function(response, convo) {
	    convo.say("Glad to hear!");
	    convo.next();
	  });
	}
  	octopus.bot.startConversation(message, greet);
});

