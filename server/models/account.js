// 'use strict';
// require('./user.js');
// require('./domain.js');
var mongoose = require('mongoose'),
    Schema   = mongoose.Schema;
    // User     = mongoose.model('User'),
    // Domain   = mongoose.model('Domain'),
    // async    = require('async'),
    // crypto   = require('crypto');

var Account = new Schema({
  name: { type: String, unique:true, default: '' },
  email: {type: String, default: ''}
});

// Account.methods = {
// 	getUsers: function(cb){
// 		User.find( {account: "Idan's"/*this.name*/}, function(err, users){
// 			if (err){
// 				console.log("error finding users", err)
// 				return cb(err);
// 			};
// 			if (!users){
// 				console.log("no users found")
// 				return cb(null, []);
// 			};
// 			console.log("succes part 1");
// 			return cb(null, users);
// 		})
// 	},
// 	getDomains: function(){
// 		Domain.find({account: this.name}).exec(function(err, domains){
// 			if (err)      {
// 				console.log("error finding domains", err)
// 				return [];
// 			};
// 			if (!domains){
// 				console.log("no domains found")
// 				return [];
// 			};
// 			return domains;
// 		})
// 	}
// }

mongoose.model('Account', Account);