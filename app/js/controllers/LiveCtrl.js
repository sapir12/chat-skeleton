angular.module('app').controller('LiveCtrl', ["$scope", "$http", "$auth", "$state", "fayeAdmin", function LiveCtrl($scope, $http, $auth, $state, fayeAdmin) {
	var live = this;
	// need:
	// fayeAdmin.addListener(channel) to add a subscription object to the fayeAdmin.subscriptions object in the form of fayeAdmin.subscriptions[channel] = subscription for later canceling subscriptions using only channel String as a parameter in the form of fayeAdmin.subscriptions[channel].cancel()
	// fayeAdmin.removeListener(channel) to remove a subscription, in the form of fayeAdmin.subscriptions[channel].cancel()
	// fayeAdmin.conversations
	live.supporters      = fayeAdmin.supporters;
	live.activeSupporter = fayeAdmin.activeSupporter;
	live.activeChat      = fayeAdmin.activeChat;
	live.show            = fayeAdmin.show;
	live.showChatList    = fayeAdmin.showChatList;
	live.displayedSupporter = "please choose a supporter"
	live.displayedChat   = null;

	var refresh = function(){ //refreshes the display of data
		setTimeout(function(){
			$scope.$digest();
		}, 20);
	};
	live.init = function(){
		$http.get('http://localhost:3007/api/live')
		.success(function(data, status, headers, config) { //data is an array of User objects, the ones who are yours, online, and not admins.
			data.forEach(function(itteration){
				fayeAdmin.supporters[itteration._id] = {};
				fayeAdmin.supporters[itteration._id].name = itteration.name;
				fayeAdmin.supporters[itteration._id]._id = itteration._id;
				fayeAdmin.supporters[itteration._id].activeChatsInfo = itteration.activeChatsInfo;
				// changing the time value into a string of only HH:MM:SS
				for (var key in fayeAdmin.supporters[itteration._id].activeChatsInfo) {
				   if (fayeAdmin.supporters[itteration._id].activeChatsInfo.hasOwnProperty(key)) {
				       var obj = fayeAdmin.supporters[itteration._id].activeChatsInfo[key];
				        for (var prop in obj) {
				          if(prop == "time"){
				          	var thisTime = obj[prop];
	                        var minute   = thisTime.toString().slice(11, 19);
	                        thisTime     = ""+minute;
	                        obj[prop]    = thisTime;
				          }
				       }
				    }
				}
			});
			fayeAdmin.activeChat = null;
			live.activeChat = fayeAdmin.activeChat;
			live.setActiveSupporter(live.supporters);
		})
		.catch(function(data, status, headers, config) {
			console.log("error initializing", status, data);
		});
		var initialization = function(){
			$http.get('http://localhost:3007/api/live')
			.success(function(data, status, headers, config) { //data is an array of User objects, the ones who are yours, online, and not admins.
				var onlySupporters = {};
				if (data.length == 0){
					fayeAdmin.supporters = {};
					live.supporters = fayeAdmin.supporters;
				} else{
					data.forEach(function(itteration){
						onlySupporters[itteration._id] = true;
						if(!fayeAdmin.supporters[itteration._id]){
							fayeAdmin.supporters[itteration._id] = {};
							fayeAdmin.supporters[itteration._id].name = itteration.name;
							fayeAdmin.supporters[itteration._id]._id = itteration._id;
							fayeAdmin.supporters[itteration._id].activeChatsInfo = itteration.activeChatsInfo;
						} else{
							fayeAdmin.supporters[itteration._id].activeChatsInfo = itteration.activeChatsInfo;
						}
						// changing the time value into a string of only HH:MM:SS
						for (var key in fayeAdmin.supporters[itteration._id].activeChatsInfo) {
						   if (fayeAdmin.supporters[itteration._id].activeChatsInfo.hasOwnProperty(key)) {
						       var obj = fayeAdmin.supporters[itteration._id].activeChatsInfo[key];
						        for (var prop in obj) {
						          if(prop == "time"){
						          	var thisTime = obj[prop];
			                        var minute   = thisTime.toString().slice(11, 19);
			                        thisTime     = ""+minute;
			                        obj[prop]    = thisTime;
						          }
						       }
						    }
						}
						// comparing existing supporters with new ones and if one supporter does not appear on the new
						// list, it should be removed from the existing one
					});
				}
				for(var supporterID in fayeAdmin.supporters){
					if(!onlySupporters[supporterID]){
						if(fayeAdmin.displayedSupporter == supporterID){
							//clean display of former supporter from browser.
							clearInterval(window.refresh);
							fayeAdmin.activeSupporter = {};
							live.activeSupporter = 	fayeAdmin.activeSupporter;
							fayeAdmin.activeChat = {};
							live.activeChat = fayeAdmin.activeChat;
						}
						delete fayeAdmin.supporters[supporterID];
						live.supporters = fayeAdmin.supporters;
						// console.log("fayeAdmin.supporters", fayeAdmin.supporters);
					}
				}
				if(isEmpty(fayeAdmin.supporters)){
					fayeAdmin.showChatList = false;
					live.showChatList = fayeAdmin.showChatList;
					fayeAdmin.activeSupporter = {};
					live.activeSupporter = 	fayeAdmin.activeSupporter;
				} else{
					fayeAdmin.showChatList = true;
					live.showChatList = fayeAdmin.showChatList;
				}
				onlySupporters = {};
										// console.log("fayeAdmin.activeSupporter", fayeAdmin.activeSupporter);
										// console.log("data", data);
				refresh(); 
				// fayeAdmin.activeChat = null;
				// live.activeChat = fayeAdmin.activeChat;
				// live.setActiveSupporter(live.supporters);
			})
			.catch(function(data, status, headers, config) {
				console.log("error initializing", status, data);
			});
		}
		window.init = setInterval(initialization, 1000);
	};
	live.updateChat = function(userID, supportName){
		$http.get('http://localhost:3007/api/livechat/'+userID.chatChannel+'/'+supportName)
		.success(function(data, status, headers, config) { //data is an array of User objects, the ones who are yours, online, and not admins.
			for (var key in data) {
			   if (data.hasOwnProperty(key)) {
			       var obj = data[key];
			        for (var prop in obj) {
			          if(prop == "time"){ // parsing te time of activeChats list
			          	var thisTime = obj[prop];
                        var minute   = thisTime.toString().slice(11, 19);
                        thisTime     = ""+minute;
                        obj[prop]    = thisTime;
			          }
			          if(prop == "conversation"){ // parsing the time of currently displayed conversation.
			          	obj[prop].forEach(function(itteration){
			          		var thisTime    = itteration.time;
	                        var minute      = thisTime.toString().slice(11, 19);
	                        thisTime        = ""+minute;
	                        itteration.time = thisTime;
			          	});
			          }
			       }
			    }
			}
			fayeAdmin.activeChat = data[userID.chatChannel];
			live.activeChat = fayeAdmin.activeChat;
			refresh();
			fayeAdmin.activeSupporter = data;
			live.activeSupporter = fayeAdmin.activeSupporter;
		})
		.catch(function(data, status, headers, config) {
			console.log("error initializing", status, data);
		});
	};
	live.setActiveSupporter = function(chosenId){ // chosenId is an Object of the chosen supporter's User object.	
		// console.log("calling setActiveSupporter()");
		// console.log("chosenId", chosenId);
		// live.supporters = fayeAdmin.supporters;
		var refinedChosendId = fayeAdmin.supporters[chosenId._id];
		// console.log("refinedChosendId",refinedChosendId);
		if(fayeAdmin.activeSupporter == chosenId){
			return false
		};
		if(window.refresh){
			clearInterval(window.refresh);
		}
		fayeAdmin.displayedSupporter = chosenId._id;
		if(refinedChosendId){
			fayeAdmin.activeSupporter = chosenId.activeChatsInfo;
		}
		live.activeSupporter = fayeAdmin.activeSupporter;
		fayeAdmin.show = false;
		live.show = fayeAdmin.show;
		fayeAdmin.showChatList = true;
		live.showChatList = fayeAdmin.showChatList;
	};
	live.setActiveSupporterASM = function(chosenId){
		if(live.displayedSupporter == chosenId.name){
			return false;
		}
		live.displayedSupporter = chosenId.name;

		clearInterval(window.activeSupporterRefresh);
		live.setActiveSupporter(chosenId);
		window.activeSupporterRefresh = setInterval(function(){
			if (isEmpty(live.activeSupporter)){ // no conversations in current supporter
				live.setActiveSupporter(chosenId);
			} else{
				var chosenChat = null;
				var chosenSupport = null;
				for (var key in chosenId.activeChatsInfo) {
				   if (chosenId.activeChatsInfo.hasOwnProperty(key)) {
				       var obj = chosenId.activeChatsInfo[key];
				        for (var prop in obj) {
				        	if(prop == "chatChannel"){
				        		chosenChat = obj[prop];
				        	}
				        	if(prop == "name"){
				        		chosenSupport = obj[prop];
				        	}
				       }
				    }
				}
				// console.log(chosenChat, chosenSupport);
				if(chosenChat && chosenSupport){
					fayeAdmin.activeChat = chosenChat;
					live.activeChat = fayeAdmin.activeChat;
					if(window.refresh){
						clearInterval(window.refresh);
					}
					window.refresh = setInterval(function(){ live.updateChat(chosenChat, chosenSupport) }, 1000);
					clearInterval(window.activeSupporterRefresh);
				}
			};
		}, 1000);
	};
	live.setActiveChat = function(chosenChat, chosenSupport){ // chosenChat is an Object of the chosen supporter's activeChatsInfo key value.
		if(fayeAdmin.activeChat == chosenChat){
			return false
		};
		live.displayedChat = chosenChat.chatChannel;
		fayeAdmin.activeChat = chosenChat;
		live.activeChat = fayeAdmin.activeChat;
		if(window.refresh){
			clearInterval(window.refresh);
		}
		window.refresh = setInterval(function(){ live.updateChat(chosenChat, chosenSupport) }, 1000);
		fayeAdmin.show = true;
		live.show = fayeAdmin.show;
	};
	// live.update = function() {
	// 	//http request to the new api (itteration._id), chatObj
	// 	// in the controller you will just define a watch that will look on the the chatObj and  in case of a change it will run the live.update() function.
	// };
	var hasOwnProperty = Object.prototype.hasOwnProperty;
	function isEmpty(obj) {

	    // null and undefined are "empty"
	    if (obj == null) return true;

	    // Assume if it has a length property with a non-zero value
	    // that that property is correct.
	    if (obj.length > 0)    return false;
	    if (obj.length === 0)  return true;

	    // Otherwise, does it have any properties of its own?
	    // Note that this doesn't handle
	    // toString and valueOf enumeration bugs in IE < 9
	    for (var key in obj) {
	        if (hasOwnProperty.call(obj, key)) return false;
	    }

	    return true;
	}
}]);