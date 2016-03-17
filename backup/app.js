'use strict'
var port           = 3007;
var express        = require('express');
var app            = express();
var mongoose       = require('mongoose');
require("./server/models/user.js");
require("./server/models/token.js");
require("./server/models/client.js");
var db             = mongoose.connection;
var Schema         = mongoose.Schema;
var async          = require('async');
var cors           = require('express-cors');
var bodyParser     = require('body-parser');
var mainDB         = require('./server/database/main-database.js');
var passport       = require('passport');
var LocalStrategy  = require('passport-local').Strategy;
var expressSession = require('express-session');
var auth           = require('./server/services/auth.js');
var User           = mongoose.model('User');
var crypto         = require('crypto');
var createHash     = crypto.createHash;
var Token          = mongoose.model('Token');

var publicDir = process.cwd() + '/public';
console.log('Serving static files from:', publicDir);

mongoose.connect('mongodb://localhost/mrbooster');

app.use(cors());
app.use(bodyParser.json());       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({extended: false})); // to support URL-encoded bodies
app.use(express.static(publicDir));
// Configuring Passport
app.use(expressSession({secret: 'mrbooster-secret', resave: false, saveUninitialized: false}));
app.use(passport.initialize());
// app.use(passport.session());

passport.serializeUser(function(user, done) {
  done(null, user._id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});


//defining functions:
  function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()){
      console.log("AUTHENTICATED :)");
      return next();
    }
    else {
      return console.log("NOT AUTHENTICATED");
      // Return error content: res.jsonp(...) or redirect: res.redirect('/login')
    }
  }

/*
passport.use(new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password'
  },
  function(username, password, done) {
    User.findOne({
      username: username
    }, function(err, user) {
      if (err) {
        return done(err);
      }
      if (!user) {
        return done(null, false, {
          message: 'Unknown user ' + username
        });
      }

      if(user.authenticate(password)){
        return done(null, user);
      } else {
        return done(null, false, {
          message: 'Invalid password'
        });
      }
    });
  }
));

passport.use('signup', new LocalStrategy({
    passReqToCallback : true
  },
  function(req, username, password, done) {
    findOrCreateUser = function(){
      // find a user in Mongo with provided username
      User.findOne({'username':username},function(err, user) {
        // In case of any error return
        if (err){
          console.log('Error in SignUp: '+err);
          return done(err);
        }
        // already exists
        if (user) {
          console.log('User already exists');
          return done(null, false,
             req.flash('message','User Already Exists'));
        } else {
          // if there is no user with that email
          // create the user
          var newUser = new User();
          // set the user's local credentials
          newUser.username = username;
          newUser.password = createHash(password);
          newUser.email = req.param('email');
          newUser.firstName = req.param('firstName');
          newUser.lastName = req.param('lastName');

          // save the user
          newUser.save(function(err) {
            if (err){
              console.log('Error in Saving user: '+err);
              throw err;
            }
            console.log('User Registration succesful');
            return done(null, newUser);
          });
        }
      });
    };

    // Delay the execution of findOrCreateUser and execute
    // the method in the next tick of the event loop
    process.nextTick(findOrCreateUser);
  })
);

var isAuthenticated = function (req, res, next) {
  if (req.isAuthenticated() ){
    return next();
  }
  else{
    res.send("you are not logged in!");
  }
}

app.get('/try', isAuthenticated, function(req, res){
  res.send("you are authenticated!");
});
*/
  app
.get('/api/auth/validate_token', auth.validate_token ) /*auth.validate_token*/

.post('/api/auth/sign_in', auth.sign_in ) /*auth.sign_in*/
.get('/api/auth/sign_in', auth.sign_in)
.post('/api/auth', auth.sign_up)
.put('/api/auth', passport.authenticate('bearer', { session: false }), auth.update_profile)
.post('/api/auth/db', passport.authenticate('bearer', { session: false }), function(req, res){
  
  //res.send(req.headers.authorization);
})
.get('/api/profile', passport.authenticate('bearer', { session: false }), function(req, res){
  Token.findOne({
    key: req.headers.authorization.split(' ')[1]
  })
  .populate({path: 'user', model: 'User'}).exec(function(err, user) {
    if (err){
      return res.sendStatus(401);
    }
    res.send(user.user);
  })
})
.all('/api/auth/sign_out', function(req, res){
  req.logout();
  res.sendStatus(200);
  console.log("sigend out");
}) /*auth.sign_out*/

/* Handle Login POST */
.post('/login', passport.authenticate('login', {
  failureFlash : true
}))

.post('/sign', passport.authenticate('signup', {
  failureFlash : true
}))

.get('/api/admin', 
  passport.authenticate('bearer', { session: false }),
  function(req, res){
    res.send([
      {
        id: 132,
        name: "Adam",
        conversations: [
          { 
            date: "3/8/2015 16:25",
            conversation: [
              {from: "Adam", message: "hello", time: "16:25"},
              {from: "Client", message: "i need help, can you help me?", time: "16:25"},
              {from: "Adam", message: "yes i can", time: "16:26"},
              {from: "Adam", message: "what can i do for you?", time: "16:26"}
            ]
          },
          { 
            date: "3/8/2015 16:28",
            conversation: [
              {from: "Adam", message: "hi", time: "16:28"},
              {from: "Client", message: "i need help, can you help me?", time: "16:29"},
              {from: "Adam", message: "yup", time: "16:29"},
              {from: "Adam", message: "what do you need?", time: "16:29"}
            ]
          }
        ]
      },
      {
        id: 12,
        name: "Jacob",
        conversations: [
          { 
            date: "3/8/2015 16:32",
            conversation: [
              {from: "Jacob", message: "welcome!", time: "16:32"},
              {from: "Client", message: "i need help, can you help me?", time: "16:32"},
              {from: "Jacob", message: "of course!", time: "16:33"},
              {from: "Jacob", message: "how may i be of an aid to you dir sir?", time: "16:33"}
            ]
          },
          { 
            date: "3/8/2015 16:35",
            conversation: [
              {from: "Jacob", message: "greetings!", time: "16:35"},
              {from: "Client", message: "i need help, can you help me?", time: "16:36"},
              {from: "Jacob", message: "thats why im here :)", time: "16:36"},
              {from: "Jacob", message: "would u like some donuts?", time: "16:36"}
            ]
          }
        ]
      },
    ]);
  }
);



//////////////////////////////////// creating functions ///////////////////////////////////////



//////////////////////////////////// calling functions ////////////////////////////////////////
/*var user = new User({
  email: "test2@test2.com",
  name: "test2@test2.com",
  username: "test2@test2.com",
  provider: '',
  hashed_password: "1fdse32sdf",
  salt: '',
  authToken: '' ,
  facebook: {},
  twitter: {},
  github: {},
  google: {},
  linkedin: {}
});
console.log(user);
user.save(function (err,uInfo) {
  if (err) console.log ('Error on save!', err);
});
*/

////////////////////////////////////     variables     ////////////////////////////////////////
app.param('searchString', function(req, res, next, searchString){
  req.searchString = searchString;
  next();
});
app.param('itemID', function(req, res, next, itemID){
  req.itemID = itemID;
  next();
});



app.listen(port);
console.log('server listening on port '+port);