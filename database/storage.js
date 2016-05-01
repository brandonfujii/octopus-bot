// Firebase database for bots

var Firebase = require('firebase');

module.exports = function(config) {

    if (!config && !config.firebase_uri)
        throw new Error('Need to provide firebase address. This should look something like ' +
            '"https://botkit-example.firebaseio.com/"');

    var rootRef = new Firebase(config.firebase_uri);
    var teamsRef = rootRef.child('teams');
    var usersRef = rootRef.child('users');
    var channelsRef = rootRef.child('channels');

    var get = function(firebaseRef) {
        return function(id, cb) {
            firebaseRef.child(id).once('value',
                function(records) {
                    cb(undefined, records.val());
                },
                function(err) {
                    cb(err, undefined);
                }
            );
        };
    };

    var save = function(firebaseRef) {
        return function(data, cb) {
            var firebase_update = {};
            firebase_update[data.id] = data;
            firebaseRef.update(firebase_update, cb);
        };
    };


    var all = function(firebaseRef) {
        return function(cb) {
            firebaseRef.once('value',
                function(records) {
                    var list = [];
                    for (key of Object.keys(records.val())) {
                        list.push(records.val()[key]);
                    }
                    cb(undefined, list);
    
                },
                function(err) {
                    cb(err, undefined);
                }
            );
        };
    };

    var del = function(firebaseRef) {
        return function(id) {
            firebaseRef.child(id).remove();
        };
    };

    var updateAssignee = function(firebaseRef) {
        return function(id, user) {
            firebaseRef.child(id).update({ assignee: user, status: 'Claimed' });
        };
    };

    var storage = {
        teams: {
            get: get(teamsRef),
            save: save(teamsRef),
            all: all(teamsRef),
            del: del(teamsRef),
            updateAssignee: updateAssignee(teamsRef)
        },
        channels: {
            get: get(channelsRef),
            save: save(channelsRef),
            all: all(channelsRef),
            del: del(channelsRef),
            updateAssignee: updateAssignee(teamsRef)
        },
        users: {
            get: get(usersRef),
            save: save(usersRef),
            all: all(usersRef),
            del: del(usersRef),
            updateAssignee: updateAssignee(teamsRef)
        }
    };

    return storage;

};
