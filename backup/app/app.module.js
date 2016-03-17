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
                          console.log("unsubscribed global", succesful);
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
                                console.log(data);
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
                            console.log("initialized once");
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
                    /*scope.chats = {
                      '5439c3afa5f30c881536d87d': [
                        {user:'bob', body:'test'},
                        {user:'george', body:'aha!'},
                        {user:'bob', body:'yes'}
                      ]
                    }*/
                    

                    /////////////////// calling functions //////////////////////////////

                    scope.init();
                    // var client = new Faye.Client('http://localhost:8001/');
                    // var myId = null;
                    //     //creating a current conversation identifier;
                    // var myUserId = Math.floor(Math.random() * 10000000000);
                    // while(myUserId.toString().length != 10){
                    //     myUserId = Math.floor(Math.random() * 10000000000);
                    // }

                    // console.log("myUserId", myUserId);

                    // scope.watchForActiveChats();
                    // // scope.activateGlobalSubscription();
                    // scope.applyEnterKeyEvents();

                    // /*client.publish('/watch', {
                    //         userId: myUserId,
                    //         activeChats: scope.activeChats,
                    //         isOnline: false
                    //     });*/
                    // scope.onExit();
                    

                    ///////////////////////////// Faye /////////////////////////////////////

                    //currentSub.cancel(); //will stop this subscription.
                    /*var currentSub = client.subscribe('/'+scope.currentChat, function(sentence){
                        scope.$apply(function(){
                            //if(!sentence.from == "support"){
                                scope.addNewMessage(sentence);
                            //}
                        });
                        scope.scrollDown();
                    });*/

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
      /* tokenFormat: {
        "access-token": "{{ token }}",
        "token-type":   "Bearer",
        "client":       "{{ clientId }}",
        "expiry":       "{{ expiry }}",
        "uid":          "{{ uid }}"
      }, */
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

	}]).run(["$rootScope", function($rootScope){
        $rootScope.hasInitializedOnce = false;
    }]);
