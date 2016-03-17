angular.module('app').factory("fayeClient", [function(){
		var fayeClient = {};
		var client = new Faye.Client('http://localhost:8002');
		var subscription = null;
		var empty = true;
		var disconnected = false;
		var subscribed = false;
		fayeClient.chat = [];

		fayeClient.clearChat = function(cb){
			fayeClient.chat.length = 0;
			cb();
		};
		fayeClient.addToChat = function(msg){
			fayeClient.chat.push({text: msg});
		};
		fayeClient.connect = function(){
			if(!disconnected){
				console.log("disconnect first");
			}else{
				console.log("connecting");
				client = new Faye.Client('http://localhost:8002');
				disconnected = false;
			}
		};
		fayeClient.subscribe = function(){
			if(empty && !disconnected){
				console.log("subscribing");
				subscription = client.subscribe("/g", function(call){
					fayeClient.addToChat(call.text);
				});
				empty = false;
				subscribed = true;
			}else{
				console.log("connect first");
			}
		};
		fayeClient.disconnect = function(){
			if(!disconnected){
				client.disconnect();
				empty = true;
				disconnected = true;
				subscribed = false;
			}
		};
		fayeClient.unsubscribe = function(){
			if(subscription && !empty){
				subscription.cancel();
				empty = true;
				subscribed = false;
			}
		};
		fayeClient.send = function(channel, msg){
			if(!disconnected && !empty){
				client.publish(channel, {text: msg});
			}
		};
		fayeClient.isConnected = function(){
			if(subscribed){
				return true;
			}else{
				return false;
			}
		};
		return fayeClient;
	}]);