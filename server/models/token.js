'use strict';

/**
 * Module dependencies.
 **/
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var tokenSchema = new Schema({
  user: Schema.Types.ObjectId,
  client: Schema.Types.ObjectId,
  key: String
});

mongoose.model('Token', tokenSchema);