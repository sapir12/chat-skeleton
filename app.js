// Site server
'use strict'
var port           = 3007;
var express        = require('express');
var app            = express();
var mongoose       = require('mongoose');
require("./server/models/account.js");
require("./server/models/domain.js");
require("./server/models/user.js");
require("./server/models/token.js");
require("./server/models/client.js");
require("./server/models/chat.js");
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
var Chat           = mongoose.model('Chat');
var Domain         = mongoose.model('Domain');
var Faye           = require('faye');
var RiveScript     = require('rivescript');
var bot            = new RiveScript({ debug: false });
var nodemailer     = require('nodemailer'); //new

var publicDir = process.cwd() + '/public';
console.log('Serving static files from:', publicDir);

mongoose.connect('mongodb://localhost/mrbooster');
var myChat = null;

app.use(cors({allowedOrigins: ['github.com', 'google.com', 'localhost']}));
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

  app
.get('/api/auth/validate_token', auth.validate_token ) /*auth.validate_token*/
.get('/profile', function(req, res){
  res.redirect('/');
})
.get('/chat', function(req, res){
  res.redirect('/');
})
.get('/admin', function(req, res){
  res.redirect('/');
})
.get('/live', function(req, res){
  res.redirect('/');
})
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
    user.user.loggedIn = true;
    user.user.save();
    res.send(user.user);
  })
})
.all('/api/auth/sign_out', function(req, res){
  req.logout();
  res.sendStatus(200);
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
    Token.findOne({
      key: req.headers.authorization.split(' ')[1]
    })
    .populate({path: 'user', model: 'User'})
    .populate('account')
    .exec(function(err, user){
      if (err){
        return res.sendStatus(401);
      }
      var myAccount = user.user.account;
      Chat.find({account: myAccount}, function(err, data){
        if (err){
          return res.sendStatus(401);
        }
        var finalData = [];
        var indicator = {};
        data.forEach(function(turn, idx){
          if(indicator[turn.support] != undefined){ //object exist
            var thisObject = finalData[indicator[turn.support] ];
            var chatObject = {}; //has "time", "conversation" keys.
            chatObject.time = turn.time;
            chatObject.conversation = turn.chat;
            thisObject.chats.push(chatObject);
          } else{ // no object
            indicator[turn.support] = finalData.length;
            var thisObject   = {};
            thisObject.id    = indicator[turn.support];
            thisObject.name  = turn.support;
            thisObject.chats = [];
            var chatObject   = {}; //has "time", "conversation" keys.
            chatObject.time  = turn.time;
            chatObject.conversation = turn.chat;
            thisObject.chats.push(chatObject);
            finalData[indicator[turn.support] ] = thisObject;
          }
        });
        // finalData is an object in this format.
        // finalData[0] = {
        //   id: 0, //same as index of finalData
        //   name: "AI", //name of the supporter
        //   time: "2015-03-30T19:52:00.746Z",
        //   chats: [
        //     {
        //       time: "2015-03-30T19:52:00.746Z",
        //       conversation: [
        //         {
        //             "myUserId" : "7041928430",
        //             "text" : "klix\n",
        //             "name" : "client",
        //             "time": "19:52:00"
        //         },
        //         {
        //             "name" : "support",
        //             "_name" : "AI",
        //             "text" : "Please go on.",
        //             "time": "19:52:07"
        //         }
        //       ]
        //     },
        //     {
        //       time: "2015-03-11T12:52:00.746Z",
        //       conversation: [
        //         {
        //             "myUserId" : "7041928430",
        //             "text" : "blix!\n",
        //             "name" : "client",
        //             "time": "19:55:00"
        //         },
        //         {
        //             "name" : "support",
        //             "_name" : "AI",
        //             "text" : "Cookie flookie",
        //             "time": "19:55:07"
        //         }
        //       ]
        //     }
        //   ]
        // };

        res.send(finalData);
      });
    });
  }
)

.get('/api/live',
  passport.authenticate('bearer', { session: false }),
  function(req, res){
    Token.findOne({
      key: req.headers.authorization.split(' ')[1]
    })
    .populate({path: 'user', model: 'User'})
    .populate('account')
    .exec(function(err, user){
      if (err){
        return res.sendStatus(401);
      }
      var account = user.user.account;
      User.find({account: account, isAdmin: false, isOnline: true}).exec(function(err, data){
        res.send(data);
      });
    });
  }
);

app.get("/api/livechat/:userID/:supportName",
  passport.authenticate('bearer', { session: false }),
  function(req, res){
    if
      (req.headers.authorization){
        Token.findOne({
          key: req.headers.authorization.split(' ')[1]
        })
        .populate({path: 'user', model: 'User'})
        .exec(function(err, data){
          User.findOne({name: req.params.supportName}).exec(function(err, user){
            if(!user){
              return res.status(204).send();
            }
            if(err){
              return res.status(500).send(err);
            }
            res.status(200).send(user.activeChatsInfo);
          });
        });
      }
    else if
      (req.headers.cookie) {
        var a = req.headers.cookie;
        var myRegex = new RegExp(/Bearer%20[a-z0-9-]{36}/);
        var b = a.match(myRegex)[0];
        b = b.slice(9);
        Token.findOne({
          key: b
        })
        .populate({path: 'user', model: 'User'})
        .exec(function(err, data){
          var account = data.user.account;
          User.findOne({_id: req.params.userID, account: account}).exec(function(err, user){
            if(!user){
              return res.status(204).send();
            }
            if(err){
              return res.status(500).send(err);
            }
            res.send(user.activeChatsInfo);
          });
        });
      }
  });


app.post("/api/updateDBForOnline",
  passport.authenticate('bearer', { session: false }),
  function(req, res){
    var isOnline = req.body.isOnline;
    if
      (req.headers.authorization){
        Token.findOne({
          key: req.headers.authorization.split(' ')[1]
        })
        .populate({path: 'user', model: 'User'})
        .exec(function(err, data){
          data.user.isOnline = isOnline;
          data.user.activeChats = 0;
          if(!isOnline){
            data.user.activeChatsInfo = {};
            data.user.markModified('activeChatsInfo');
          };
          data.user.save();
        });
      }
    else if
      (req.headers.cookie) {
        var a = req.headers.cookie;
        var myRegex = new RegExp(/Bearer%20[a-z0-9-]{36}/);
        var b = a.match(myRegex)[0];
        b = b.slice(9);
        Token.findOne({
          key: b
        })
        .populate({path: 'user', model: 'User'})
        .exec(function(err, data){
          data.user.isOnline = isOnline;
          data.user.activeChats = 0;
          if(!isOnline){
            data.user.activeChatsInfo = {};
            data.user.markModified('activeChatsInfo');
          };
          data.user.save();
        });
      }
    res.end();
  });

app.post('/api/setLoggedInFalseToDB', function(req, res){ // setting User's loggenIn key value in database to either true or false.
  res.setHeader("Access-Control-Allow-Origin", "*");
// @req.body.my_id -> String
// @req.body.isLoggedIn -> Boolean
  if
    (req.headers.authorization){
      Token.findOne({
        key: req.headers.authorization.split(' ')[1]
      })
      .populate({path: 'user', model: 'User'})
      .exec(function(err, data){
        data.user.loggedIn = false;
        data.user.activeChatsInfo = {};
        data.user.markModified('activeChatsInfo');
        data.user.save();
      });
    }
  else if
    (req.headers.cookie) {
      var a = req.headers.cookie;
      var myRegex = new RegExp(/Bearer%20[a-z0-9-]{36}/);
      var b = a.match(myRegex)[0];
      b = b.slice(9);
      Token.findOne({
        key: b
      })
      .populate({path: 'user', model: 'User'})
      .exec(function(err, data){
        data.user.loggedIn = false;
        data.user.activeChatsInfo = {};
        data.user.markModified('activeChatsInfo');
        data.user.save();
      });
    }
  res.end();
});

app.post('/api/removeChatInfo', function(req, res){ // setting User's loggenIn key value in database to either true or false.
  res.setHeader("Access-Control-Allow-Origin", "*");
  if
    (req.headers.authorization){
      Token.findOne({
        key: req.headers.authorization.split(' ')[1]
      })
      .populate({path: 'user', model: 'User'})
      .exec(function(err, data){
        if(data.user.activeChatsInfo[req.body.channel]){
          delete data.user.activeChatsInfo[req.body.channel];
        }
        data.user.markModified('activeChatsInfo');
        data.user.save();
      });
    }
  else if
    (req.headers.cookie) {
      var a = req.headers.cookie;
      var myRegex = new RegExp(/Bearer%20[a-z0-9-]{36}/);
      var b = a.match(myRegex)[0];
      b = b.slice(9);
      Token.findOne({
        key: b
      })
      .populate({path: 'user', model: 'User'})
      .exec(function(err, data){
        if(data.user.activeChatsInfo[req.body.channel]){
          delete data.user.activeChatsInfo[req.body.channel];
        }
        data.user.markModified('activeChatsInfo');
        data.user.save();
      });
    }
  res.end();
});

app.post("/api/updateDBForEmergencyExit", // no authentication, sets the request's user isOnline key to false.
  function(req, res){
    if
      (req.headers.authorization){
        Token.findOne({
          key: req.headers.authorization.split(' ')[1]
        })
        .populate({path: 'user', model: 'User'})
        .exec(function(err, data){
          data.user.isOnline = false;
          data.user.activeChats = 0;
          data.user.activeChatsInfo = {};
          data.user.markModified('activeChatsInfo');
          data.user.save();
        });
      }
    else if
      (req.headers.cookie) {
        var a = req.headers.cookie;
        var myRegex = new RegExp(/Bearer%20[a-z0-9-]{36}/);
        var b = a.match(myRegex)[0];
        b = b.slice(9);
        Token.findOne({
          key: b
        })
        .populate({path: 'user', model: 'User'})
        .exec(function(err, data){
          data.user.isOnline = false;
          data.user.activeChats = 0;
          data.user.activeChatsInfo = {};
          data.user.markModified('activeChatsInfo');
          data.user.save();
        });
      }
    res.end();
  });

app.post('/updateActiveChats', function(req, res){
  res.setHeader("Access-Control-Allow-Origin", "*");
// @req.body.my_id -> String
// @req.body.direction -> String
  var updateActiveChats = function(my_id, direction){ // updates this specific user's activeChats numerical key value
                            // of its specific User object in the DB
                            // by increasing by one or decreasing by one or setting to zero.
  // @my_id is a String of this specific supporter's _id key value of its User object in database.
  // @direction is a String. value of either "up", "down", "zero".
  // TODO: add this function with the value "zero" for direction parameter when a request is recieved for
    User.findOne({_id: my_id}).exec(function(err, supporter){
      if(direction == "up"){
        supporter.activeChats = supporter.activeChats+1;
        supporter.save();
        return res.send();
      }
      if(direction == "down"){
        supporter.activeChats = supporter.activeChats-1;
        supporter.save();
        return res.send();
      }
      if(direction == "zero"){
        supporter.activeChats = 0;
        supporter.save();
        return res.send();
      }
      res.send("bad parameters");
    });
  };
  updateActiveChats(req.body.my_id, req.body.direction);
});

app.post('/assignSupporterNameToDB', function(req, res){
  res.setHeader("Access-Control-Allow-Origin", "*");
// @req.body.my_id -> String
// @req.body.direction -> String
  var assignSupporterNameToDB = function(my_id, chat){
    // @chat is a String of a specific Chat object _id value in database.
    User.findOne({_id: my_id}).exec(function(err, data){
      if (err){
        throw err;
      }
      var myName = data.name;
      Chat.findOne({_id: chat}).exec(function(err, chat){
        if (err){
          throw err;
        }
        chat.support = myName;
        chat.save();
      });
    });
  };
  assignSupporterNameToDB(req.body.supporter_id, req.body.channel);
  res.send();
});


////////////////###########################################################////////////////////
////////////////###########################################################////////////////////
////////////////                        THIS IS NEW                        ////////////////////
////////////////###########################################################////////////////////
////////////////###########################################################////////////////////

  //Adding sentences into the chat's database
app.post('/addchat', function(req, res){
  res.setHeader("Access-Control-Allow-Origin", "*");
  addStringToChat(req.body.id ,req.body.text, req.body.from, req.body.name, req.body.time);
  res.send('message sent to database');
});

  //Saving a new chat object into database & returning a String of that object's _id
app.post('/newchat', function(req, res){ //create a new first time Chat;
  res.setHeader("Access-Control-Allow-Origin", "*");
  Domain.findOne({url: req.body.domain}).exec(function(err, myDomain){
    var myAccount = myDomain.account;
    var chatId = createNewChatId(req.body.domain, req.body.message, req.body.userId, myAccount);
    if(!chatId){
      res.sendStatus(401);
      return res.send("no domain defined!");
    }
    res.send(chatId); // chatId = String, the value of _id key of this conversation's Chat object on DB
  });
});
  //saving message object into database.
app.post('/savechat', function(req, res){ //saves message into database;
  res.setHeader("Access-Control-Allow-Origin", "*");
  var messageObject  = {}; // creating a message object to be saved on DB. due to different format.
  messageObject.text = req.body['message[text]'];
  messageObject.name = req.body['message[name]'];
  messageObject.time = new Date();
  if(req.body.firstTimeMessage){
    saveMsgToDB(req.body._id, messageObject, req.body.firstTimeMessage);
  }else{
    saveMsgToDB(req.body._id, messageObject);
  }
  //
  res.sendStatus(200);
});
  //saving supporter info into database
app.post('/savespp', function(req, res){ //create a new first time Chat;
  res.setHeader("Access-Control-Allow-Origin", "*");
  saveSppToDB(req.body._id, req.body.name);
  res.sendStatus(200);
});
  //Requesting an array of a specific chat's sentences.
app.get('/requestchat/:_id', function(req, res){
  res.setHeader("Access-Control-Allow-Origin", "*");
  requestChatArray(req._id, function(err, data){
    if(err) throw err;
    res.send(data);
  } );
});
app.param('_id', function(req, res, next, _id){
  req._id = _id;
  next();
});

////////////////// faye ///////////////////////////////////////////////////////////////////////////////////////////
var client = new Faye.Client('http://localhost:8001/');

app.post('/assignNewSupporter', function(req, res){
// @req.body.channel
//    is the channel where the client is listening to right now.
//    is also the _id for the specific Chat object on DataBase.
// @req.body.domain
//    is a String of the domain's url.   **NOT _id**
  checkForSupporter(req.body.domain, function(err, data){ // data is a string of the supporter's channel, either "ai" for auto respond or other channel for a specific suporter.
    if(err){
      res.sendStatus(500);
      return res.end();
    }
    var chosenId = data;
    res.setHeader("Access-Control-Allow-Origin", "*");
    orderNewChat(chosenId, req.body.channel, req.body.firstTimeMessage, req.body.domain); // domain should be req.headers.host
    res.send('message sent to database');
  });
});

app.post('/updateClientExit', function(req, res){ // req.body.channel = channel of the conversation the client just left
  res.setHeader("Access-Control-Allow-Origin", "*");
  var myDomain = req.body.domain;
  var myChannel = req.body.channel;
  //find the chat using the channel as _id, take supporter name.
  Chat.findOne({_id: myChannel}).exec(function(err, data){
    if (err){
      return false;
      // res.send("err: "+err);
      // throw err;
    }
    var supportName = data.support;
    //find Domain with url of myDomain, take account.
    Domain.findOne({url: myDomain}).exec(function(err, thisDomain){
      if (err){
        res.send("err: "+err);
        throw err;
      }
      var thisAccount = thisDomain.account; //String of the _id value of that account
      //find a user who has name of supportName + account of the taken account.
      User.findOne({name: supportName, account: thisAccount}).exec(function(err, thisUser){
        if (err){
          res.send("err: "+err);
          throw err;
        }
        //get thisUser._id and publish a message to a channel of that _id value.
        //with an object of {clientExit: true, clientChannel: myChannel}
        if(thisUser && thisUser._id){
          var supporterGlobalChannel = thisUser._id;
          client.publish("/"+supporterGlobalChannel, {
            clientExit: true,
            clientChannel: myChannel
          });
        }
        res.end();
      })
    })
  })
});

var randomTimeout = function(){
  var a = Math.floor(Math.random() * 10000);
  while(a > 5000 || a < 2000){
    a = Math.floor(Math.random() * 10000);
  }
  return a;
}
var currentClientNumber = 0;
var nextClientNumber = function(){
  var a = currentClientNumber;
  currentClientNumber++;
  return a.toString();
}
var returnFromAi = function(message, clientNumber, callback){
  async.waterfall([function(cb){
    var reply = null;
    bot.loadDirectory("brain", success_handler, error_handler);
    function success_handler (loadcount) {
      bot.sortReplies();
      reply = bot.reply(clientNumber, message);
      cb(null, reply);
    }

    function error_handler (loadcount, err) {
      cb(err)
      console.log("Error loading batch #" + loadcount + ": " + err + "\n");
    }
  }, function(reply){
    callback(null, reply);
  }], function(err){if (err) callback(err) } )
}
var activateAiSubscription = function(){
    var transporterObjectExist = false;
    var transporter = null;
    var createTransporter = function(){
      if(!transporterObjectExist){
        // create reusable transporter object using SMTP transport
        transporter = nodemailer.createTransport({
            service: 'Gmail',
            auth: {
                user: 'mrbooster.live@gmail.com',
                pass: 'Aa1234567890Ninja'
            }
        });
        // NB! No need to recreate the transporter object. You can use
        // the same transporter object for all e-mails
        transporterObjectExist = true;
      };
    };
    var sendMail = function(message, reciever){ //@param Object message {email: "", phone: ""}, @param String reciever
      createTransporter();
      // setup e-mail data with unicode symbols
      var email = function(){
        if(message.email){
          return message.email;
        }else{
          return "";
        }
      };
      var phone = function(){
        if(message.phone){
          return message.phone;
        }else{
          return "";
        }
      };
      var mailOptions = {
          from: 'mrbooster live <mrbooster.live@gmail.com>', // sender address ✔
          to: reciever, // list of receivers 'r.l.sapir@gmail.com, baz@blurdybloop.com'
          subject: 'A new client is looking for you', // Subject line
          text: 'email: '+email()+' , phone: '+phone()+'\n on '+ new Date() // plaintext body
      };

      // send mail with defined transport object
      transporter.sendMail(mailOptions, function(error, info){
          if(error){
              console.log(error);
          }
      });
    }

    var mailRegex = function(text){
      var regex = /(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))/;
      var res = regex.exec(text);
      if(res){
        res = res[0]
      };
      return res;
    };

    var phoneRegex = function(text){
      var regex = /[+]?[0-9]{10,12}/;
      var res = regex.exec(text);
      if(res){
        res = res[0]
      };
      return res;
    };

    var findReciever = function(domain, cb){//@param String domain, returns a String of the email of the domain's owner in which the message was sent to.
      Domain.findOne({
        url: domain
      })
      .populate('account')
      .exec(function(err, user){
        if (err){
          cb(true);
        }else{
          var email = user.account.email;
          cb(null, email);
        }
      });
    };

    var verifyMailOrPhone = function(text, domain, cb){ //@param String text , function cb
      var finalObject = {},
          finalEmail = "",
          finalPhone = "",
          finalReciever = "";

      if(mailRegex(text) ){
        finalEmail = mailRegex(text);
      };
      if(phoneRegex(text) ){
        finalPhone = phoneRegex(text);
      }
      if(mailRegex(text) || phoneRegex(text)){
        findReciever(domain, function(err, recieverMail){
          cb(null, {email: finalEmail, phone: finalPhone, reciever: recieverMail})
        });
      }else{ // case of no mail or phone
        cb(true);
      }
    };

    var mailOrPhoneCallback = function(err, data){
      if(err){ //no mail or phone appeared, that case return false.
        return false;
      }
      sendMail({email: data.email, phone: data.phone}, data.reciever);
    };

    client.subscribe('/ai', function(order){
      var t = nextClientNumber();
      verifyMailOrPhone(order.firstTimeMessage, order.domain, mailOrPhoneCallback);
      returnFromAi(order.firstTimeMessage, t, function(err, data){
        if (err){ throw err}
        setTimeout(function(){
          client.publish('/'+order.channel, {
                  name: 'support',
                  _name: 'AI',
                  text: data
              });
          }, randomTimeout() );
      });

      client.subscribe('/'+order.channel, function(message){
        if(message.name == 'support'){return false}
        else{
          var text = message.text;
          verifyMailOrPhone(text, message.domain, mailOrPhoneCallback);
          returnFromAi(text, t, function(err, data){
            if(err){throw err}
              setTimeout(function(){
                client.publish('/'+order.channel, {
                        name: 'support',
                        _name: 'AI',
                        text: data
                    });
                }, randomTimeout() );
          })
        }
      })

    });
}
var orderNewChat = function(chosenId, channel, message, domain){
  // @chosenId
  //    is a string of the chosen supporter's _id value.
  //    the supporter listens on a channel with the same addres as his _id value.
  //  if the supporter recieves a message with {from: "global"} he will subscribe to a new channel,
  //  with the value of "channel" key given in the request.
  if(chosenId == "ai"){
    client.publish('/ai', {
          channel: channel,
          firstTimeMessage: message,
          domain: domain
      });
  } else{
    client.publish('/'+chosenId, {
          channel: channel,
          firstTimeMessage: message
      });
  }
};
var checkForSupporter = function(domain, cb){ // returns the _id value of a specific supporter of the correct domain. or "ai" for automated response
  var requestedDomainDBId = null;
  Domain.findOne({url: domain}).exec(function(err, data){
    if (err){
      cb(err);
    }
    requestedDomainDBId = data._id;
    User.find({domains: requestedDomainDBId, isOnline: true}).sort({activeChats: 1})/*.limit(1)*/.exec(function(err, data){
      if (err){
        cb(err);
      }
      if(data.length == 0){
        cb(null, "ai");
      } else { // SENDS ONE SUPPORTER'S _id KEY VALUE, THE SUPPORTER WITH THE LEAST ACTIVE CHATS.
               // IN THE FORMAT OF callback(null, data[0]._id);
        cb(null, data[0]._id); // the _id channel of the supporter where he listens to new calls for new private chats.
      }
    });
  })
};
var createNewChatId = function(domain, msg, userId, account){
  // @DOMAIN - string (address website where user coming from)
  // @msg - string - the user's message ..

  // the function insert new chat into the database
  // and reutrns cheat id.

  // TODO: lets test whats domain reutrns and with that object i'll check that database to get the domain's objectID and from that
  //objectID i'll make a query to find out who is the relevent supporters.
  if(!domain){
    return false;
  }
  var myTime  = new Date();
  var newChat = null;
  newChat     = new Chat(
    {   chat: [
        {
                "name" : "client",
                "text" : msg,
                "myUserId" : userId,
                "time" : myTime
            }
      ],
      time: myTime,
      fromIP: "undefined",
      domain: domain,
      account: mongoose.Types.ObjectId(account) //account ObjectId
    }
  );
  newChat.save();
  return newChat._id;
}
var saveMsgToDB = function(idNumber, message, firstTimeMessage){ //saves message into database
  Chat.findOne({ '_id': idNumber }, function (err, chat) {
    if (err) throw err;
    chat.chat.push(message);
    chat.save();
    if(chat.support != "unassigned"){
      User.findOne({
        name: chat.support,
        account: chat.account
      }).exec(function(err, data){
        if(err){
          throw err;
        }
        if(data.activeChatsInfo[chat._id]){
          var myObject = data.activeChatsInfo[chat._id];
          myObject.conversation.push(message);
          data.activeChatsInfo[chat._id] = myObject;
        } else{
          var myObject = {};
          var firstTimeObject = false;
          if(firstTimeMessage){
            firstTimeObject = {};
            firstTimeObject.time = new Date();
            firstTimeObject.text = firstTimeMessage;
            firstTimeObject.name = "client";
          };
          myObject.time = new Date();
          myObject.chatChannel = chat._id;
          myObject.name = chat.support;
          myObject.conversation = [];
          if(firstTimeObject){
            myObject.conversation.push(firstTimeObject);
          }
          myObject.conversation.push(message);
          data.activeChatsInfo[chat._id] = myObject;
        }
        data.markModified('activeChatsInfo');
        data.save(function(err){
          if(err){
            console.log("err", err);
          }
        });
      });
    }
  });
};
var saveSppToDB = function(idNumber, name, cb){ //saves the name of the supporter of the current chat to the database
  Chat.findOne({ '_id': idNumber }, function (err, chat) {
    if (err) throw err;
    chat.support = name;
    chat.save();
    if(cb){
      cb();
    }
  });
};
var findById = function(idNumber ,callback){
  Chat.findOne({ '_id': idNumber }, function (err, chat) {
    if (err) throw err;
    myChat = chat;
    callback();
  })
}
var requestChatArray = function(idNumber, callback){
  Chat.findOne({ '_id': idNumber }, function (err, chat) {
    if (err) {callback(err); throw err};
    callback(null, chat.chat);
  })
}
var addStringToChat = function(idNumber, newChatMessage, from, name, time){
  var hour = moment(time).format('HH:mm:ss');
  async.series([
    function(callback){
      findById(idNumber,callback);
    },
    function(callback){
      myChat.chat.push({time: hour, text: newChatMessage, from: from, name: name});
      myChat.save(callback);
    }
  ]);
}

////////////////////////////////////     calling functions     ////////////////////////////////
activateAiSubscription();


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
