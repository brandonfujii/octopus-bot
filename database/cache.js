var Slack = require('slack-node');
slack = new Slack(process.env.SLACK_ACCESS_TOKEN);
var NodeCache = require('node-cache');
var octopusCache = new NodeCache();

function cacheTeamUrl() {
    slack.api("team.info", function(err, response) {
        var team_url = response.team.domain;
        octopusCache.set("url", team_url);
        console.log("octopusCache url is set to: " + octopusCache.get("url"));
    });
}

function getTeamUrl() {
	return octopusCache.get("url");
}

module.exports = {
	cacheTeamUrl : cacheTeamUrl,
	getTeamUrl : getTeamUrl
}