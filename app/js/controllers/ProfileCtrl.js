angular.module('app').controller('ProfileCtrl', ["$scope", "$http", "$auth", "$state", "fayeClient", "$rootScope", function ProfileCtrl($scope, $http, $auth, $state, fayeClient, $rootScope) {
	$scope.myEmail = "";
	$scope.myName  = "";
	$scope.emailPlaceholder = "";
	$scope.namePlaceholder = "";
	$scope.update = function(){
		var myUpdate = {};
		if ($scope.newName && $scope.newName!=""){
			myUpdate.name = $scope.newName;
		}
		if($scope.newEmail && $scope.newEmail!=""){
			myUpdate.email = $scope.newEmail;
		}
		$auth.updateAccount(myUpdate)
		.success(function(data){
			if(data.data == "Email already exist"){
				return window.alert("Email already exist");
			}
			$scope.myEmail = data.email;
			$scope.myName  = data.name;
			$scope.turnEditable();
			$scope.newEmail = "";
			$scope.newName = "";
		})
		.catch(function(){
			$state.go('login');
		})
	};
	$scope.show = function(){
		$scope.try(function(err, res){
			if (err){
				$state.go('login');
				return console.log("err",err);
			}
			$scope.myEmail      = res.email;
			$scope.myName       = res.name;
		})
	};
	$scope.try = function(callback){
		$http.get('http://localhost:3007/api/profile')
		.success(function(data, status, headers, config) {
			if(fayeClient.hasLoggedInOnce() ){
				window.metaFaye.disconnect();
				window.metaFaye = null;
			}
			$rootScope.isAdmin = data.isAdmin;
			fayeClient.setLoggedInOnce(true);
			window.metaFaye = new Faye.Client('http://localhost:8001');
			window.metaFaye.subscribe("/meta"+data._id, function(order){ // listening to a meta channel, where orders like fatalExit are given in case of same user logged in from a different browser.
				if(order.fatalExit){
					window.metaFaye.disconnect();
					fayeClient.disconnect();
					fayeClient.clearChat();
					$auth.signOut()
					.then(function(){
						$state.go('login');
						window.alert("somone logged in to this account from a different computer.");
					})
					.catch(function(){
						console.log("error logging out");
					});
				}
				return false;
			});
			callback(null, data);
		  	// console.log("succes requesting GET /api/try", data);
		})
		.catch(function(data, status, headers, config) {
			callback(data);
		  	// console.log("err requesting GET /api/try", data);
		})
	};
	$scope.isShowEditable = false;
	$scope.edit = "Edit";
	$scope.turnEditable = function(){
		if($scope.isShowEditable){
			$scope.isShowEditable = false;
			$scope.edit = "Edit";
		} else{
			$scope.isShowEditable = true;
			$scope.edit = "Cancel";
		}
	};
}]);
