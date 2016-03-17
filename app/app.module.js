angular.module('mr-chat-manager', [])
    .directive('mrChatManager', [
        '$q',
        '$timeout',
        '$rootScope',
        '$document',
        '$http',
        function($q, $timeout, $rootScope, $document, $http) {
            return {
                require: '?ngModel',
                restrict: 'E',
                templateUrl: 'partials/main.html',
                replace: true,
                link: function(scope, element, attrs, ngModel) {

                    //////////////////// building functions ///////////////////////////////
                    
                    scope.scrollDown = function(){ //scrolls the chat window to bottom.
                        //var chatWindow = document.getElementById("chatWindow");
                        //chatWindow.scrollTop = chatWindow.scrollHeight;
                    }

                    scope.activateSubscription = function(){
                        var thisChannel = scope.currentChat;
                        client.subscribe('/'+scope.currentChat, function(sentence){
                            scope.$apply(function(){
                                scope.addNewMessage(thisChannel, sentence);
                            });
                            if(scope.currentChat == thisChannel){
                                //scope.scrollDown();
                            } else{
                                scope.showNotification(thisChannel);
                            }
                        });
                        activeSubscriptions[scope.currentChat] = true;
                    }

                    scope.activateSubscriptionParam = function(thisChannel){
                        subscribedChannels.push(thisChannel);
                        client.subscribe('/'+thisChannel, function(sentence){
                            scope.$apply(function(){
                                scope.addNewMessage(thisChannel, sentence);
                            });
                            if(scope.currentChat == thisChannel){
                                //scope.scrollDown();
                            } else{
                                scope.showNotification(thisChannel);
                            }
                        });
                        activeSubscriptions[thisChannel] = true;
                    }

                    scope.activateGlobalSubscription = function(){
                        client.subscribe('/global', function(order){
                            if(order.chosenId == myUserId){
                                scope.$apply(function(){
                                    scope.addNewChat(order.channel);
                                    scope.chats[order.channel].push({user: "client", body: order.firstTimeMessage, color: "red"});
                                    scope.activateSubscriptionParam(order.channel);
                                    scope.activeChats++;
                                });
                            }
                        });
                    }

                    scope.deactivateGlobalSubscription = function(){
                        client.unsubscribe('/global', function(succesful){
                          // console.log("unsubscribed global", succesful);
                        });
                    }

                    scope.sendMessage = function(){
                        if(!scope.chats[scope.currentChat]){
                            scope.chats[scope.currentChat] = [];  
                        }               
                        client.publish('/'+scope.currentChat, {
                            name: 'support',
                            text: scope.compose
                        });
                        jQuery('#userinput').val('');
                        jQuery('#userinput').focus();
                    }

                    scope.addNewMessage = function(channel, sentence){
                        var color = null;
                        if (sentence.name == "support"){
                            color = "blue";
                        } else{
                            color = "red";
                        }
                        scope.chats[channel].push({
                            user: sentence.name,
                            body: sentence.text,
                            color: color
                        });
                    }

                    scope.addNewChat = function(channelString){
                        if(!scope.chats[channelString]){
                            scope.chats[channelString] = [];
                        }
                    }

                    scope.applyEnterKeyEvents = function(){
                        jQuery('#userinput').keyup(function(e){
                            if(e.keyCode == 13){
                                if(jQuery('#userinput').val()!='\n'){
                                    scope.$apply(function(){
                                        scope.sendMessage();
                                    });
                                }
                            }
                        });
                    }

                    scope.selectChatroom = function(chatroom){
                        if(scope.currentChat != chatroom){
                            scope.currentChat = chatroom;
                            if(!activeSubscriptions[scope.currentChat] ){
                                scope.activateSubscription();
                            }

                        }
                    }

                    scope.clickedChatroom = function(channel){
                        if(scope.currentChat != channel){
                            scope.selectChatroom(channel);
                            scope.removeNotification(channel);
                            //scope.scrollDown();
                            //jQuery(".users-item").removeClass("users-list-color");
                            //jQuery("#"+channel).addClass("users-list-color");
                            jQuery('#userinput').focus();
                        }
                    }

                    scope.showNotification = function(channel){
                        jQuery("#"+channel).addClass("bold");
                    }

                    scope.removeNotification = function(channel){
                        jQuery("#"+channel).removeClass("bold");
                    }

                    scope.updateActiveChats = function(){
                        client.publish('/watch', {
                            userId: myUserId,
                            activeChats: scope.activeChats,
                            isOnline: true
                        });
                    };

                    scope.watchForActiveChats = function(){
                        scope.$watch('activeChats', function(newValue, oldValue) {
                            scope.updateActiveChats();
                        });
                    };

                    scope.closeChat = function(channel){
                        scope.currentChat = "empty";
                        jQuery(".chat-player-container").remove();
                        jQuery("#"+channel).remove();
                        scope.activeChats--;
                        client.publish('/clients', {
                            clientId: channel,
                            isAlone: true
                        });
                        delete scope.chats[channel];
                    }

                    scope.onExit = function(){
                        window.onbeforeunload = function () {
                            scope.activeChats = 0;
                            jQuery.post("http://localhost:8007/update_on_exit/", {
                                myUserId: myUserId
                            }, function(data){
                                // console.log(data);
                            });
                        };
                    }

                    scope.deactivateChatSubscriptions = function(){
                        for (var i = subscribedChannels.length - 1; i >= 0; i--) {
                            client.unsubscribe('/'+subscribedChannels[i], function(succesful){
                                console.log("succesful", succesful);
                            });
                        };
                    };

                    scope.isOnline = false;

                    scope.tellServerImOffline = function(myId){
                        client.publish("/watch", {
                            userId: myId,
                            isOnline: false
                        })
                    }

                    scope.goOnline = function(){
                      if(scope.online == "online"){ //go online
                        scope.activateGlobalSubscription();
                        scope.isOnline = true;
                        scope.online = "offline";
                        client.publish("/lifeServer", {
                            userId: myUserId
                        });
                        return
                      }
                      if(scope.online == "offline"){ //go offline
                        scope.tellServerImOffline(myUserId);
                        scope.activeChats = 0;
                        jQuery.post("http://localhost:8007/update_on_exit/", {
                            myUserId: myUserId
                        }, function(data){
                            console.log(data);
                        });
                        scope.deactivateGlobalSubscription();
                        scope.deactivateChatSubscriptions();
                        scope.isOnline = false;
                        scope.online = "online";
                      }
                    };

                    scope.syncLife = function(){
                        client.subscribe("/life", function(call){
                            if(call.order == "showLife"){
                                client.publish("/lifeServer", {
                                    userId: myUserId
                                });
                            }
                        });
                    };

                    scope.init = function(callback){
                        console.log("running init", $rootScope.hasInitializedOnce);
                        if(!$rootScope.hasInitializedOnce){
                            $http.get('/api/profile')
                            .success(function(data, status, headers, config) {
                                // console.log("account is:", data.of_account);
                                client = new Faye.Client('http://localhost:8001/'+data.of_account);
                                    //creating a current conversation identifier;
                                myUserId = Math.floor(Math.random() * 10000000000);
                                while(myUserId.toString().length != 10){
                                    myUserId = Math.floor(Math.random() * 10000000000);
                                }
                                scope.syncLife();
                                scope.watchForActiveChats();
                                // scope.activateGlobalSubscription();
                                scope.applyEnterKeyEvents();
                                scope.onExit();
                                callback(null, data);
                            })
                            .catch(function(data, status, headers, config) {
                                callback(data);
                                // console.log("err requesting GET /api/try", data);
                            })
                            $rootScope.hasInitializedOnce = true;
                            // console.log("initialized once");
                        }
                    };

                    ////////////////////////// Variables ///////////////////////////////
                   
                    var activeSubscriptions = {
                        "5439c3afa5f30c881536d87d": false,
                        "543a91d701e3abf407622e36": false
                    }
                    var subscribedChannels = [];
                    var myUserId = null;
                    var client = null;
                    var myId = null;
                    scope.currentChat = null;
                    scope.activeChats = 0;
                    scope.chats = {};
                    scope.online = "online";
                    

                    /////////////////// calling functions //////////////////////////////

                    scope.init();

                }
            };
        }
    ]);

angular.module('mr-chat-manager').run(['$templateCache', function($templateCache) {
  'use strict';

  $templateCache.put('partials/main.html',
    "<div class=\"mr-chat-manager\">\r" +
    "\n" +
    "<button ng-click=\"goOnline()\">go {{online}}</button>" +  
    "\n" +
    "\t<!--<div id=\"list-header\" class=\"font_indie\"><h3>users list</h3></div>-->\r" +
    "\n" +
    "\t<!--<div id=\"users-list\">\r" +
    "\n" +
    "\t\t<div class=\"users-infi\" ng-repeat=\"(channel, value) in chats\">\r" +
    "\n" +
    "\t\t\t<div class=\"{{channel}}\">\r" +
    "\n" +
    "\t\t\t\t<div class=\"users-item bold\" id=\"{{channel}}\" ng-click=\"clickedChatroom(channel)\">{{channel}}</div> <div class=\"exit-user\" ng-click=\"closeChat(channel)\"><div class=\"inside-text-user\">x</div></div>\r" +
    "\n" +
    "\t\t\t</div>\r" +
    "\n" +
    "\t\t</div>\r" +
    "\n" +
    "\t</div>\r" +
    "\n" +
    "\r" +
    "\n" +
    "\t<div id=\"chatWindow\" class=\"chatWindow\">\r" +
    "\n" +
    "\t  \t<div ng-repeat=\"message in chats[currentChat]\">\r" +
    "\n" +
    "\t\t    <strong class=\"{{message.color}}\">{{message.user}} says:</strong>\r" +
    "\n" +
    "\t\t    {{message.body}}\r" +
    "\n" +
    "\t\t</div>\r" +
    "\n" +
    "\t</div>\r" +
    "\n" +
    "\t<div id=\"compose\">\r" +
    "\n" +
    "\t\t<textarea id=\"userinput\" ng-model=\"compose\" placeholder=\"type and press enter to send\"></textarea>\r" +
    "\n" +
    "\t    <button id=\"managerSend\" class=\"font_indie\" ng-click=\"sendMessage()\">Send</button>\r" +
    "\n" +
    "\t</div>\r" +
    "\n" +
    "\r" +
    "\n" +
    "-->\r" +
    "\n" +
    "\r" +
    "\n" +
    "\r" +
    "\n" +
    // "    <section class='heading-section z-depth-2'>\r" +
    // "\n" +
    // "      <div class=\"container\">\r" +
    // "\n" +
    // "        <h2>Operator</h2>\r" +
    // "\n" +
    // "      </div>\r" +
    // "\n" +
    // "    </section>\r" +
    "\n" +
    "\t<div ng-show=\"isOnline\" class=\"container\">\r" +
    "\n" +
    "      <div class=\"row\">\r" +
    "\n" +
    "\r" +
    "\n" +
    "        <div class=\"col s3\">\r" +
    "\n" +
    "          <ul class=\"card-panel collection with-header\">\r" +
    "\n" +
    "            <li class=\"collection-header\">\r" +
    "\n" +
    "              <h5>Active Chats</h5>\r" +
    "\n" +
    "            </li>\r" +
    "\n" +
    "            <!--<div ng-repeat=\"(channel, value) in chats\">\r" +
    "\n" +
    "\t\t\t\t<div class=\"{{channel}}\">\r" +
    "\n" +
    "\t\t\t\t\t<div class=\"users-item bold\" id=\"{{channel}}\" ng-click=\"clickedChatroom(channel)\">{{channel}}</div> <div class=\"exit-user\" ng-click=\"closeChat(channel)\"><div class=\"inside-text-user\">x</div></div>\r" +
    "\n" +
    "\t\t\t\t</div>\r" +
    "\n" +
    "\t\t\t</div>-->\r" +
    "\n" +
    "            <a ng-repeat=\"(channel, value) in chats\" href=\"#!\" id=\"{{channel}}\" class=\"collection-item\" ng-click=\"clickedChatroom(channel)\">{{\"Client\"}}<span class=\"badge\">4:33</span><span class=\"exit-user\" ng-click=\"closeChat(channel)\"><div class=\"inside-text-user\">x</div></span></a>\r" +
    "\n" +
    "          </ul>\r" +
    "\n" +
    "\r" +
    "\n" +
    "        </div>\r" +
    "\n" +
    "\r" +
    "\n" +
    "        <div class=\"col s9\">\r" +
    "\n" +
    "          <div class=\"chat-player-container card-panel white\" ng-repeat=\"message in chats[currentChat]\">\r" +
    "\n" +
    "            \r" +
    "\n" +
    "            <div class=\"card-panel grey lighten-5 z-depth-1\">\r" +
    "\n" +
    "              <div class=\"row valign-wrapper\">\r" +
    "\n" +
    "                <div class=\"col s1\">\r" +
    "\n" +
    "                  <img src=\"images/user.png\" alt=\"\" class=\"circle responsive-img\">\r" +
    "\n" +
    "                  <!-- notice the \"circle\" class -->\r" +
    "\n" +
    "                </div>\r" +
    "\n" +
    "                <div class=\"col s11\">\r" +
    "\n" +
    "                  <span class=\"black-text\">\r" +
    "\n" +
    "                    <strong>{{message.user}}:</strong>\r" +
    "\n" +
    "                    {{message.body}}\r" +
    "\n" +
    "                  </span>\r" +
    "\n" +
    "                </div>\r" +
    "\n" +
    "              </div>\r" +
    "\n" +
    "            </div>\r" +
    "\n" +
    "\r" +
    "\n" +
    "          </div>\r" +
    "\n" +
    "\r" +
    "\n" +
    "            <div class=\"card-panel grey lighten-5 z-depth-1\">\r" +
    "\n" +
    "            <div class=\"row valign-wrapper\" style=\"margin-bottom: 0;\">\r" +
    "\n" +
    "              <div class=\"input-field col s10\">\r" +
    "\n" +
    "                <textarea class=\"materialize-textarea\" cols=\"30\" rows=\"10\" id=\"userinput\" ng-model=\"compose\"></textarea>\r" +
    "\n" +
    "                <label>Your Message</label>\r" +
    "\n" +
    "              </div>\r" +
    "\n" +
    "              <div class=\"col s2\">\r" +
    "\n" +
    "                <button id=\"managerSend\" ng-click=\"sendMessage()\" class=\"btn waves-effect waves-light btn-large\" type=\"submit\" name=\"action\">Submit\r" +
    "\n" +
    "                  <i class=\"mdi-content-send right\"></i>\r" +
    "\n" +
    "                </button>\r" +
    "\n" +
    "              </div>\r" +
    "\n" +
    "            </div>\r" +
    "\n" +
    "          </div>\r" +
    "\n" +
    "        \r" +
    "\n" +
    "        </div>\r" +
    "\n" +
    "\r" +
    "\n" +
    "      </div>\r" +
    "\n" +
    "\r" +
    "\n" +
    "    </div>\r" +
    "\n" +
    "\r" +
    "\n" +
    "\t\r" +
    "\n" +
    "</div>"
  );

}]);
// Declare app level module which depends on filters, and services
angular.module('app', ['ngSanitize', 'ngResource', 'ui.router', 'oc.modal', 'ng-token-auth', 'mr-chat-manager'])
	.constant('VERSION', '0.7.0')
	.config(["$authProvider", "$stateProvider", "$locationProvider", "$urlRouterProvider", "$rootScopeProvider", function appConfig($authProvider, $stateProvider, $locationProvider, $urlRouterProvider, $rootScopeProvider) {
        $locationProvider.hashPrefix('!');
		$urlRouterProvider.otherwise("/"); //should be '/login'
		$stateProvider
		.state('login', {
			url: "/", // root route //should be '/login'
			views: {
				"mainView": {
					templateUrl: "partials/login.html",
					controller: 'LoginCtrl',
					controllerAs: 'login'
				}
			}
		}).state('view', {
			url: "/view",
			views: {
				"mainView": {
					templateUrl: "partials/view.html",
					controller: 'ViewCtrl',
					controllerAs: 'view'
				}
			}
		}).state('chat', {
            url: "/chat",
            views: {
                "mainView": {
                    templateUrl: "partials/chat.html",
                    controller: 'ChatCtrl',
                    controllerAs: 'chat'
                }
            }
        }).state('profile', {
			url: "/profile",
			views: {
				"mainView": {
					templateUrl: "partials/profile.html",
					controller: 'ProfileCtrl',
					controllerAs: 'profile'
				}
			}
		}).state('admin', {
            url: "/admin",
            views: {
                "mainView": {
                    templateUrl: "partials/admin.html",
                    controller: 'AdminCtrl',
                    controllerAs: 'admin'
                }
            }
    }).state('live', {
        url: "/live",
        views: {
            "mainView": {
                templateUrl: "partials/live.html",
                controller: 'LiveCtrl',
                controllerAs: 'live'
            }
        }
    }).state('support', {
      url: "/support",
      views: {
        "mainView": {
          templateUrl: "partials/support.html",
          controller: 'SupportCtrl',
          controllerAs: 'support'
        }
      }
    }); //goSupport

    $authProvider.configure({
      apiUrl:                  '/api',
      emailSignInPath:         '/auth/sign_in',
      tokenValidationPath:     '/auth/validate_token',
      signOutUrl:              '/auth/sign_out',
      emailRegistrationPath:   '/auth',
      accountUpdatePath:       '/auth',
      accountDeletePath:       '/auth',
      confirmationSuccessUrl:  window.location.href,
      passwordResetPath:       '/auth/password',
      passwordUpdatePath:      '/auth/password',
      passwordResetSuccessUrl: window.location.href,
      storage:                 'cookies',
      proxyIf:                 function() { return false; },
      proxyUrl:                '/proxy',
      authProviderPaths: {
        github:   '/auth/github',
        facebook: '/auth/facebook',
        google:   '/auth/google'
      },
      tokenFormat: {
        "Authorization": "Bearer {{ token }}",
        "client":       "{{ clientId }}",
        "expiry":       "{{ expiry }}",
        "uid":          "{{ uid }}"
      },
      parseExpiry: function(headers) {
        // convert from UTC ruby (seconds) to UTC js (milliseconds)
        return (parseInt(headers['expiry']) * 1000) || null;
      },
      handleLoginResponse: function(response) {
        return response.data;
      },
      handleAccountResponse: function(response) {
        return response.data;
      },
      handleTokenValidationResponse: function(response) {
        return response.data;
      }
    });

		// /!\ Without server side support html5 must be disabled.
		return $locationProvider.html5Mode(true);

	}])
    .run(["$rootScope", "$http", "$q", function($rootScope, $http, $q){
        $rootScope.hasInitializedOnce = false;
          function Exit()
        {
            Stop();
            // document.body.onunload       = ""; // when set to "" the onunload function will not happen more then once.
            // document.body.onbeforeunload = ""; // when set to "" the onbeforeunload function will not happen more then once.
            return "you are about to leave the chat";
        }  
        function Stop()
        {
            var request = new XMLHttpRequest();
            request.open("POST","http://localhost:3007/api/updateDBForEmergencyExit",false);
            request.setRequestHeader("content-type","application/x-www-form-urlencoded");
            request.send("isOnline=false");
        }
        function askBeforeExit(){
            return "you are about to leave MrBooster";
        }
        window.onbeforeunload = askBeforeExit;
        window.onunload = Exit;
    }])
    .factory("mongoose", ["$http", function($http){
        
        var mongoose = {};
        return mongoose;
    }])
    .factory("fayeClient", ["$http", "$rootScope", function($http, $rootScope){
        var fayeClient = {};
        var client = null;/*new Faye.Client('http://localhost:8001');*/
        var subscription = null;
        var empty = true;
        // var disconnected = false;
        // var loggedInOnce = false;
        // var connected = !disconnected;
        // var subscribed = false;
        var alreadySubscribed = false;
        var isGlobalSubscribed = false;
        fayeClient.status = "offline";
        fayeClient.goStatus = "online";
        fayeClient.chat = [];
        fayeClient.conversations = {};
        fayeClient.allowInput = false;
        fayeClient.banList = {};
        fayeClient.leftUsers = {};
        fayeClient.activeChat = null;
        fayeClient.init = function(cb){
            function getMy_id(){
                $http.get("http://localhost:3007/api/profile")
                .success(function(data, status, headers, config){
                    $rootScope.my_id = data._id;
                    if(cb){
                        cb();
                    }
                })
                .catch(function(data, status, headers, config){
                    console.log("error getting api/profile", status, data);
                    if(cb){
                        cb();
                    }
                })
            }
            getMy_id();
        }
        var deactivateMyGlobalSubscription = function(){
            if(client){
                client.disconnect();
            };
            isGlobalSubscribed = false;
            fayeClient.conversations = null;
            fayeClient.conversations = {};
        };
        var activateMyGlobalSubscription = function(cb){ //cb here is a refresh function
            if (!isGlobalSubscribed){
                client = null;
                client = new Faye.Client('http://localhost:8001');
                isGlobalSubscribed = true;
            }else{
                console.log("GlobalSubscription is already active");
                return false;
            }
            client.subscribe("/"+ $rootScope.my_id, function(call){ // DESCRIPTION:
                                                                    //  every call recieved in this channel will open a new
                                                                    //  conversation with a specific client using all the
                                                                    //  needed information from the call object.
                if(call.clientExit){ // in case a call is ment to tell of a client's exit from chat, 
                                     // a message should be sent to the supporter.
                    if(fayeClient.conversations[call.clientChannel]){
                        var thisTime = new Date();
                        var minute   = thisTime.toString().slice(16, 24);
                        thisTime     = ""+minute;
                        if(fayeClient.activeChat != call.clientChannel) {
                            fayeClient.conversations[call.clientChannel].userLeft = true;
                        };
                        fayeClient.conversations[call.clientChannel].specificConversation.push({
                            text: "has left the conversation",
                            name: "client",
                            minute: "SYSTEM"+thisTime
                        });
                        $http.post("http://localhost:3007/updateActiveChats",{
                            my_id: $rootScope.my_id,
                            direction: "down"
                        });
                        fayeClient.leftUsers[call.clientChannel] = true;
                        cb();
                        return false;
                    }
                    return false
                }
                $http.post("http://localhost:3007/assignSupporterNameToDB", // this request sets this supporter's name in supporter_id
                                                                            // into the Chat object's "supporter" value.
                                                                            // using the "channel" key in this request who is the _id 
                                                                            // value of the specific Chat object.
                                                                            // making it possible to organize chats by the user who 
                                                                            // was in charge of them, the user who answered them.
                    {
                        supporter_id: $rootScope.my_id,
                        channel: call.channel
                    }
                );
                var thisTime = new Date();
                var minute   = thisTime.toString().slice(16, 24);
                thisTime     = ""+minute;
                fayeClient.conversations[call.channel] = {
                    channel: call.channel,
                    minute: thisTime,
                    specificConversation: []
                };
                var thisTime = new Date(); 
                var minute   = thisTime.toString().slice(16, 24);
                thisTime     = ""+minute;
                fayeClient.conversations[call.channel].specificConversation.push({
                    text: call.firstTimeMessage,
                    name: "client",
                    minute: thisTime
                });
                fayeClient.conversations[call.channel].newConversation = true;

                client.subscribe("/"+call.channel, function(specificCall){ // this is the specific conversation
                    //specificCall has 3 keys:
                    // name     {String either "client" or "support"},
                    // text     {String of the message},
                    // myUserId {Number only Client side messages send this} // **not in use, might be removed in the future
                    var specificChannel = call.channel;
                    if(fayeClient.banList[specificChannel]){ // when fayeClient.banList[specificChannel] is true, this channel is banned.
                                                  // so we dont want any more messages displayed from this client. 
                        return false;
                    }
                    if(!fayeClient.conversations[specificChannel]){// if no specific conversation Object exist in conversations
                                                                   // Object of the supporter's currently active chats list
                                                                   //** happens when a suppoter closes a chat with a client, 
                                                                   //** and the client send another message,
                        var thisTime = new Date(); 
                        var minute   = thisTime.toString().slice(16, 24);
                        thisTime     = ""+minute; // creating the Time for the new conversation                 
                        fayeClient.conversations[specificChannel] = { // we will create a new Object.
                            channel: specificChannel,
                            minute: thisTime,
                            specificConversation: [],
                            unreadMessage: true
                        };
                        $http.post("http://localhost:3007/updateActiveChats",{
                            my_id: $rootScope.my_id,
                            direction: "up"
                        });
                    }
                    var thisTime = new Date(); 
                    var minute   = thisTime.toString().slice(16, 24);
                    thisTime     = ""+minute;
                    if(specificCall.name == "support"){
                        specificCall.name = "you"
                    }
                    if(fayeClient.activeChat != specificChannel) {
                        fayeClient.conversations[specificChannel].unreadMessage = true;
                    };
                    fayeClient.conversations[specificChannel].specificConversation.push({
                        text:   specificCall.text,
                        name:   specificCall.name,
                        minute: thisTime
                    });
                    if(cb){cb() }; // calling the refresh function from callback
                } );
                modifyActiveChats("up"); // letting the database know of this new active chat.
            })
        };
        fayeClient.banChatFromActiveChats = function(channel){
            if(fayeClient.conversations[channel]){
                delete fayeClient.conversations[channel];
                fayeClient.banList[channel] = true;
                if(fayeClient.leftUsers[channel]){ // if user has left already, means that activeChats has decreased by one and shouldnt be decreased again
                    return false;
                }
                $http.post("http://localhost:3007/updateActiveChats",{ // updating activeChats in DB, decreasing activeChat's value by one.
                    my_id: $rootScope.my_id,
                    direction: "down"
                });
            }else {
                fayeClient.banList[channel] = true;
            }
        };
        fayeClient.unBanChatFromActiveChats = function(channel){
            fayeClient.banList[channel] = false;
        };
        fayeClient.removeChatFromActiveChats = function(channel){
            if(fayeClient.conversations[channel]){
                delete fayeClient.conversations[channel];
                if(fayeClient.leftUsers[channel]){ // if user has left already, means that activeChats has decreased by one and shouldnt be decreased again
                    return $http.post("http://localhost:3007/api/removeChatInfo",{
                        channel: channel
                    });
                }
                $http.post("http://localhost:3007/updateActiveChats",{
                    my_id: $rootScope.my_id,
                    direction: "down"
                });
                $http.post("http://localhost:3007/api/removeChatInfo",{
                    channel: channel
                });
            };
        };
        var modifyActiveChats = function(direction){ // @direction recieves one of the Strings "up", "down", or "zero".
                                                     // DESCRIPTION:
                                                     //  setting the User object's activeChats key value of the currently 
                                                     //  logged in supporter in the DataBase. increasing by one, decreasing
                                                     //  by one, or setting to zero.
            $http.post("http://localhost:3007/updateActiveChats",
                {
                    my_id: $rootScope.my_id,
                    direction: direction
                }
            );
        };
        var updateDBForOnline = function(isOnline, cb){
            $http.post("http://localhost:3007/api/updateDBForOnline",
                {
                    isOnline: isOnline
                }
            )
            .success(function(data, status, headers, config) {
                if(cb){
                    return cb();              
                };
            })
            .error(function(data, status, headers, config) {
                if(cb){
                    return cb();
                };
            });
        }; 

        var updateDBForLoggedInFalse = function(){
            $http.post("http://localhost:3007/api/setLoggedInFalseToDB", {});
        };
 
        fayeClient.goOnline = function(refreshFunction){
            if(!isGlobalSubscribed){
                activateMyGlobalSubscription(refreshFunction);
                fayeClient.goStatus = "offline";
                fayeClient.status = "online";
                fayeClient.allowInput = true;
                updateDBForOnline(true);
                return false;
            }else{
                fayeClient.goStatus = "online";
                fayeClient.status = "offline";
                fayeClient.conversations = {};
                deactivateMyGlobalSubscription();
                fayeClient.allowInput = false;
                updateDBForOnline(false);
                return false;
            };
        };
        fayeClient.clearChat = function(cb){
            fayeClient.conversations = null;
            fayeClient.conversations = {};
            if(cb){
                cb();
            }
        };

        var loggedInOnce = false;
        fayeClient.hasLoggedInOnce = function(){
            return loggedInOnce;
        };
        fayeClient.setLoggedInOnce = function(myBoolean){
            loggedInOnce = myBoolean;
        };

        fayeClient.disconnect = function(){
            updateDBForLoggedInFalse();
            deactivateMyGlobalSubscription();
            if(window.metaFaye){ // disconnecting from the meta channel that listens to website events called in ProfileCtrl.js since the moment where the user loggs in to the webssite.
                window.metaFaye.disconnect();
                window.metaFaye = null;
            }
            fayeClient.goStatus = "online";
            fayeClient.status = "offline";
            fayeClient.allowInput = false;
            updateDBForOnline(false);
            loggedInOnce = false;
            $rootScope.isAdmin = false;
        };
        fayeClient.send = function(channel, message){
            if(isGlobalSubscribed){
                client.publish("/"+channel, {
                    text: message,
                    name: "support",
                    time: new Date()
                });
            }
        };
        return fayeClient;
    }])
    .factory("fayeAdmin", ["$http", "$rootScope", function($http, $rootScope){
        var fayeAdmin = {};
        var client = new Faye.Client('http://localhost:8001');
        fayeAdmin.subscriptions = {};
        fayeAdmin.activeSupporter = null;
        fayeAdmin.activeChat = null;
        fayeAdmin.supporters = {};
        fayeAdmin.displayedSupporter = null;
        fayeAdmin.show = false;
        fayeAdmin.showChatList = false;

        // fayeAdmin.addListener = function(channel){
        //     fayeAdmin.subscriptions[channel] = client.subscribe(channel, function(call){
        //         console.log(call);
        //     });
        // };

        return fayeAdmin;
    }]);
