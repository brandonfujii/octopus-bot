function getUserName(userID, callback) {
  slack.api("users.list", function(err, response) {
    var memberdata = response.members;
    console.log(userID);
    for(var i = 0; i < memberdata.length; i++) {
      if (memberdata[i].id == userID) {
          return callback(memberdata[i].name);
        }
    }
    return callback("usernameNotFound");
  });
}


module.exports = {

  getUserName: getUserName
  
}
