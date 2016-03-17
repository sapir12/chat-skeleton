angular.module('app').controller('ChatCtrl', ["fayeClient", "$scope", function ChatCtrl(fayeClient, $scope) {
	var chat = this; // this == $scope because we use the controllerAs definitio
	var digest = function(){ //refreshes the display of data
		setTimeout(function(){
			$scope.$digest();
		}, 20);
	};


	chat.allowInput    = fayeClient.allowInput;
	chat.status        = fayeClient.status;
	chat.goStatus      = fayeClient.goStatus;
	chat.chat          = fayeClient.chat;
	chat.conversations = fayeClient.conversations;
	// chat.channel       = "/global";
	chat.activeChat    = null;

	// $scope.$watch("chat.conversations", function(newVal, oldVal){
	// 	console.log("newVal", newVal);
	// 	console.log("oldVal", oldVal);
	// }, true);

	chat.setActiveChat  = function(channel){
		fayeClient.conversations[channel].unreadMessage = false;
		fayeClient.conversations[channel].userLeft = false;
		fayeClient.conversations[channel].newConversation = false;
		chat.activeChat = fayeClient.conversations[channel];
		fayeClient.activeChat = channel;
	};
	chat.goOnline = function(){
		fayeClient.goOnline(digest); // digest is the refresh function, like rerender.
		chat.status            = fayeClient.status;
		chat.goStatus          = fayeClient.goStatus;
		chat.allowInput        = fayeClient.allowInput;
		chat.conversations     = fayeClient.conversations;
		chat.activeChat        = null;
		return false;
	};
	chat.removeChat = function(channel){
		fayeClient.removeChatFromActiveChats(channel);
		if(chat.activeChat){
			if(chat.activeChat.channel == channel){
				chat.activeChat    = null;
			}
		}
	}
	chat.banChat = function(channel){
		fayeClient.banChatFromActiveChats(channel);
		if(chat.activeChat){
			if(chat.activeChat.channel == channel){
				chat.activeChat    = null;
			}
		}
	};
	chat.unBanChat = function(channel){
		fayeClient.unBanChatFromActiveChats(channel);
	};
	chat.subscribe = function(channel, callback){
		if(callback){
			fayeClient.subscribe(channel, callback);
		}else{
			fayeClient.subscribe(channel);
		}
	};
	chat.init = function(){
		fayeClient.init();
	};
	chat.connect = function(){
		fayeClient.connect();
	};
	chat.disconnect = function(){
		fayeClient.disconnect();
	};
	chat.unsubscribe = function(){
		fayeClient.unsubscribe();
	};
	chat.send = function(channel, msg){
		fayeClient.send(channel, msg);
		chat.taskText = "";
		digest();
	};
	chat.clear =function(){
		fayeClient.clearChat(function(){
			digest();
		});
	};
	chat.subscribeCallback = function(){
		digest();
	};

}]);
