'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    crypto = require('crypto');

var Domain = new Schema({
  name:    { type: String, default: "" },
  url:     { type: String, default: "" },
  key:     { type: String, default: Math.round((new Date().valueOf() * Math.random()))+'' },
  account: { type: Schema.ObjectId, ref: 'Account' }
});

Domain.methods = {
	generateKey: function(){
	    return Math.round((new Date().valueOf() * Math.random())) + '';
	}
};

mongoose.model('Domain', Domain);