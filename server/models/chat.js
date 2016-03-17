'use strict'

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var ChatSchema = new Schema({
	account: {type: Schema.ObjectId, ref: 'Account'},
	domain: {type: String, default: "undefined"},
	chat: {type: Array},
    time: {type: Date, default: Date.now},
    fromIP: {type: String, default: "undefined"},
    support: {type: String, default: "unassigned"}
});

mongoose.model('Chat', ChatSchema);