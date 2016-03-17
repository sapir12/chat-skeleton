angular.module('app').controller('AdminCtrl', ["$scope", "$http", "$auth", "$state", function AdminCtrl($scope, $http, $auth, $state) {
	$scope.init = function(){
		$http.get('http://localhost:3007/api/admin')
		.success(function(data, status, headers, config) {
			data.forEach(function(itteration){
				itteration.chats.forEach(function(thisChat){
					var minute = thisChat.time.slice(11, 16);
					var date   = thisChat.time.slice(0, 10);
					thisChat.time = ""+date+": "+minute;
					thisChat.conversation.forEach(function(thisConversation){
						var minute = thisChat.time.slice(11, 17);
						var date   = thisChat.time.slice(0, 10);
						thisConversation.time = ""+date+": "+minute;
					});
				});
			});
			$scope.adminData = data;
		  	onPageLoad();
		})
		.catch(function(data, status, headers, config) {
			$scope.adminData = [
				{
					id: 1,
					name: "user does not exist"
				}
			];
		  	onPageLoad();
		});
	}
	$scope.setSupporter = function(a){
		if($scope.currentSupporter){
			if($scope.currentSupporter.id != a){
				$scope.currentChat = null;
			};
		}
		if(a != NaN){
			if($scope.idPosition[a+""]){
				$scope.currentSupporter = $scope.idPosition[a+""];
				$scope.showSupporter    = true;
				$scope.showChat         = false;
			} else{
				// case clicked empty link 
			}
		}
		return false;
	}
	$scope.setChat = function(array){
		$scope.currentChat = array;
		$scope.showChat    = true;
		//
	};
	var setIdPosition = function(array){
		var newObject = {};
		array.forEach(function(a){
			for (var i = array.length - 1; i >= 0; i--) {
				newObject[array[i].id+""] = array[i];
			};
		});
		return newObject;
	};
	
	$scope.currentSupporter = null;
	$scope.currentChat      = null;
	$scope.showSupporter    = false;
	$scope.showChat         = false;

	var onPageLoad = function(){
		// console.log("admin data",$scope.adminData);
		$scope.mySupporters = $scope.adminData;
		// $scope.mySupporters.forEach(function(itteration){
		// 	itteration.chats.forEach(function(thisChat){
		// 		var minute = thisChat.time.slice(11, 16);
		// 		var date   = thisChat.time.slice(0, 10);
		// 		thisChat.time = ""+date+": "+minute;
		// 	});
		// });
		$scope.idPosition   = setIdPosition($scope.adminData);
	}
}]);

// data example
/*[
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
    ]*/