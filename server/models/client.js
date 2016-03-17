'use strict';

/**
 * Module dependencies.
 **/
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var clientSchema = new Schema({
  name: String,
  clientId: String,
  clientSecret: String
});

mongoose.model('Client', clientSchema);