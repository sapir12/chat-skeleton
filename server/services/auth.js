'use strict';
require('../models/account.js');
require('../models/domain.js');
var mongoose           = require('mongoose'),
_                      = require('lodash'),
User                   = mongoose.model('User'),
Client                 = mongoose.model('Client'),
Token                  = mongoose.model('Token'),
Domain                 = mongoose.model('Domain'),
Account                = mongoose.model('Account'),
async                  = require('async'),
lodash                 = require('lodash'),
passport               = require('passport'),
LocalStrategy          = require('passport-local').Strategy,
BasicStrategy          = require('passport-http').BasicStrategy,
ClientPasswordStrategy = require('passport-oauth2-client-password').Strategy,
BearerStrategy         = require('passport-http-bearer').Strategy,
uuid                   = require('uuid'),
Faye                   = require('faye'),
metaFaye               = new Faye.Client('http://localhost:8001'),
moment                 = require('moment');
///////////////////////////////////////

// var idans = null;
// Account.findOne({
//   name: "Idan's"
// }).exec(function(err, account){
//   if (err) return console.log(err);
//   idans=account;
//   var idansUsers = idans.getUsers(function(err, data){
//     if (err) {return console.log("err", err)}
//     idans = data;
//   });
// });

// var myUser = new User({
//   email: "test3@test.com",
//   password: "1",
//   name: "Jake Bake",
//   username: "test3@test.com",
//   account: mongoose.Types.ObjectId("54f465111c0715e402252d80"),
//   isAdmin: false,
//   domains: [
//     mongoose.Types.ObjectId("54f465111c0715e402252d81"),
//     mongoose.Types.ObjectId("552ce5db6d8f504a21f1015e")
//   ]
// });
// myUser.save(function(err){
//   if (err){console.log('err with new user', err)}
//     else{
//       console.log("saved new User");
//     }
// });
// var myAccount = new Account({
//   name: "Idan's"
// });
// var myDomain  = new Domain({
//   account: "Idan's"
// });
// 
// myDomain.save(function(err){
//   if (err){console.log('err with new domain', err)}
//     else{
//       console.log("saved new domain");
//     }
// });
// myAccount.save(function(err){
//   if (err){console.log('err with new account', err)}
//     else{
//       console.log("saved new account");
//     }
// });

/////////////////////////////////////////
/*

/**
 * BasicStrategy & ClientPasswordStrategy
 *
 * These strategies are used to authenticate registered OAuth clients. They are
 * employed to protect the `token` endpoint, which consumers use to obtain
 * access tokens. The OAuth 2.0 specification suggests that clients use the
 * HTTP Basic scheme to authenticate. Use of the client password strategy
 * allows clients to send the same credentials in the request body (as opposed
 * to the `Authorization` header). While this approach is not recommended by
 * the specification, in practice it is quite common.
 **/


passport.use(new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password'
  },
  function(email, password, done) {
    User.findOne({
      email: email
    })
    .populate('account')
    .populate('domains')
    .exec(function(err, user) {
      if (err) {
        return done(err);
      }
      if (!user) {
        return done(null, false, {
          message: 'Unknown user ' + email
        });
      }

      if(user.authenticate(password) ){
        return done(null, user);
      } else {
        return done(null, false, {
          message: 'Invalid password'
        });
      }
    });
  }
));


/**
 * BearerStrategy
 *
 * This strategy is used to authenticate users based on an access token (aka a
 * bearer token). The user must have previously authorized a client
 * application, which is issued an access token to make requests on behalf of
 * the authorizing user.
 **/
passport.use(new BearerStrategy(
  function(accessToken, done) {
    Token.findOne({
      key: accessToken
    })
    .populate({path: 'user', model: 'User'})
    .populate('account')
    .populate('domains')
    .exec(function(err, token) {
      if (err) {
        return done(err);
      }
      if (!token) {
        return done(null, false);
      }
      var info = {
        scope: '*'
      }
      done(null, token.user);
    });
  }
));

/*
passport.use(new BasicStrategy({
    usernameField: 'email',
    passwordField: 'password'
  },
  function(username, password, done) {
    Client.findById(username, function(err, client) {
      if (err) {
        return done(err);
      }
      if (!client) {
        return done(null, false);
      }
      if (client.clientSecret != password) {
        return done(null, false);
      }
      return done(null, client);
    });
  }
));



passport.use(new ClientPasswordStrategy({
    usernameField: 'email',
    passwordField: 'password'
  },
  function(clientId, clientSecret, done) {
    Client.findById(clientId, function(err, client) {
      if (err) {
        return done(err);
      }
      if (!client) {
        return done(null, false);
      }
      if (client.clientSecret != clientSecret) {
        return done(null, false);
      }
      return done(null, client);
    });
  }
));
*/

function isAdmin(user){
  if(user.level === "admin" || user.level === "Admin"){
    return true;
  } else {
    return false;
  }
}

function isUser(user){
  if(user.level === "user" || user.level === "User"){
    return true;
  } else{
    return false;
  }
}

var service = {
  update_profile: [
    function(req, res, next){
      var myBearer = req.headers.authorization.split(' ')[1];
      var myUpdate = req.body;
      Token.findOne({
        key: myBearer
      })
      .populate({path: 'user', model: 'User'}).exec(function(err, user) {
        if (err){
          return res.sendStatus(500);
        }
        if(!user){
          return res.sendStatus(401);
        }
        User.findOne({_id: user.user._id}, function(err, finalUser){
          if (err){
            return res.sendStatus(500);
          }
          if (!finalUser){
            return res.sendStatus(401);
          }
          // succes:
          if(myUpdate){
            User.findOne({email: myUpdate.email}, function(err, retrievedUser){
              if (err){
                return res.sendStatus(500);
              }
              if(!retrievedUser || retrievedUser._id == finalUser._id){
                if (myUpdate.email){
                  finalUser.email = myUpdate.email;
                  finalUser.username = myUpdate.email;
                }
                if(myUpdate.name){
                  finalUser.name  = myUpdate.name;
                }    
                finalUser.save();
                return res.status(200).jsonp({name: finalUser.name, email: finalUser.email, data: "success"} );
              }else{
                return res.status(200).jsonp({data: "Email already exist"});
              }
            });
            // if (myUpdate.email){
            //   finalUser.email = myUpdate.email;
            //   finalUser.username = myUpdate.email;
            // }
            // if(myUpdate.name){
            //   finalUser.name  = myUpdate.name;
            // }
          }
        })
      })
    }
  ],
  sign_out: [
    function(req, res, next) {
      req.logout();
      res.status(200).jsonp({
        status: 200,
        success: true,
        messages: ["You have successfully signed out"]
      });
    }
  ],
  validate_token: [
    function(req, res, next) {
      // console.log("is authenticated 1:",req.isAuthenticated() );
      var user = false;

      async.series([
        function(callback){
          passport.authenticate('bearer', { session: false }, function(err, loggedInUser){
            // console.log("is authenticated 2:", req.isAuthenticated() );
            if (err){
              return res.status(500).jsonp({
                status: 500,
                success: false,
                data: "server internal error"
              });
            }
            if (!loggedInUser){
              return res.status(401).jsonp({
                status: 401,
                success: false,
                data: "you are not logged in"
              });
            }
            user = loggedInUser;
            callback();
          })(req, res, next);
        },
        function(callback){
            res.setHeader('Authorization', req.headers.authorization);
            res.setHeader('Client', user._id);
            res.setHeader('Expiry', moment().add(30, 'days').utc().valueOf());
            res.setHeader('Uid', user.email);
            res.setHeader('Access-Control-Allow-Credentials', true);
            res.setHeader('Access-Control-Expose-Headers', "authorization, expiry, uid, client");

            callback();
        }
      ],
      function(err, callback){
        if(err || !user){
          return res.status(500).jsonp({
            status: 500,
            success: false,
            data: "Server internal FATAL ERROR"
          });
        }
        res.status(200).jsonp({
          status: 200,
          success: true,
          data: user
        });
      });
    }
    //  passport.authenticate('bearer', { session: false }),
    // function(req, res, next) {
    //   async.series([
    //     function(callback){
    //       var myAuthorization = req.headers['authorization'].split(' ')[1];
    //       Token.findOne({key: myAuthorization}).exec(function(err, token){
    //         if (err){
    //           console.log("ERROR", err);
    //           res.status(401).jsonp({
    //             status: 401,
    //             success: false,
    //             data: null
    //           });
    //           return false;
    //         }
    //         // res.setHeader('Authorization', req.headers.authorization);
    //         // //res.setHeader('Access-Token', token.key);
    //         // //res.setHeader('Token-Type', 'Bearer');
    //         // res.setHeader('Client', req.user._id);
    //         // res.setHeader('Expiry', moment().add(30, 'days').utc().valueOf());
    //         // res.setHeader('Uid', req.user.email);
    //         // res.setHeader('Access-Control-Allow-Credentials', true);
    //         // res.setHeader('Access-Control-Expose-Headers', "access-token, expiry, , uid, client");
    //         callback();
    //       });
    //     },
    //     function(callback){
    //       res.status(200).jsonp({
    //         status: 200,
    //         success: true,
    //         data: req.user
    //       });
    //     }
    //   ])
    // }
  ],
  sign_in: [
    function(req, res, next) {
      res.setHeader("Access-Control-Allow-Origin", "*"); // this line can be removed, this line only used for one computer for api+client
      passport.authenticate('local', function(err, user, info) {
        if (err) {
          return next(err)
        }

        if (!user) {
          // req.session.messages = [info.message];
          return res.status(401).jsonp({
            status: 401,
            success: false,
            errors: ["Authentication failed"]
          });
        }
        ////////////////////////////// BUILDING NEW FUNCTION ///////////////////
        // if this user is already online, disconnect him. 
        // by sending a message with a disconnect order to that user's global channel,
        if(user.loggedIn){
          metaFaye.publish("/meta"+user._id, {
            fatalExit: true
          });
        }
        ////////////////////////////// END of   NEW FUNCTION ///////////////////
        req.logIn(user, function(err) {
          if (err) {
            return next(err);
          }

          var token = new Token({
            key: uuid.v4(),
            user: user,
            client: null
          });

          token.save(function(err){
            //console.log("TOKEN KEY",token.key);
            if(err){console.log("err", err)}
            res.setHeader('Authorization', 'Bearer ' + token.key);
            res.setHeader('Access-Token', token.key);
            res.setHeader('Token-Type', 'Bearer');
            res.setHeader('Client', user._id);
            res.setHeader('Expiry', moment().add(30, 'days').utc().valueOf());
            res.setHeader('Uid', user.email);
            res.setHeader('Access-Control-Allow-Credentials', true);
            res.setHeader('Access-Control-Expose-Headers', "authorization, expiry, uid, client, access-token, token-type");
            //console.log("new req.headers", req.headers);
            //
              // console.log("req.headers", req.headers);
              // console.log("req.headers.authorization", req.headers.authorization);
            //

              
            // if(isAdmin(user) ) {
            //   //create adminData
            //   res.status(200).jsonp({
            //     status: 200,
            //     success: true,
            //     data: adminData
            //   });
            // }
            // else if(isUser(user) ) {
            //   //create userData by adding user some extra if needed values.
            //   res.status(200).jsonp({
            //     status: 200,
            //     success: true,
            //     data: userData
            //   });
            // }
            // else{
              res.status(200).jsonp({
                status: 200,
                success: true,
                data: user // null
              });  
            // }
          });
        });
        // console.log("is authenticated 3:",req.isAuthenticated() );
      })(req, res, next);
    }
    //passport.authenticate('local'),
    //server.token(),
    //server.errorHandler()
  ],
  sign_up: [
    function(req, res, next) {
      res.setHeader("Access-Control-Allow-Origin", "*"); // this line can be removed, this line only used for one computer for api+client
      User.findOne({"email": req.body.email}, function(err, data){
        if (err){
          throw err;
        }
        if (data){
          res.send("this email is already in use");
          return false;
        }
        if(data == null){
          var user = new User({
            email: req.body.email,
            name: req.body.email,
            username: req.body.email,
            password: req.body.password
          });
          user.save();
        }
        res.send("successfully created account");
      });
    }
    //passport.authenticate('local'),
    //server.token(),
    //server.errorHandler()
  ]
  //passport.authenticate('local', { successReturnToOrRedirect: '/', failureRedirect: '/login' });
};

module.exports = service;