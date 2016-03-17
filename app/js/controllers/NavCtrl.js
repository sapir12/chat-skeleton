angular.module('app').controller('NavCtrl', [
	'$scope', '$location', '$resource', '$rootScope', "$auth", "$state", "fayeClient", function($scope, $location, $resource, $rootScope, $auth, $state, fayeClient) {
		$scope.init = function NavCtrl(){

			// jQuery(".button-collapse").sideNav();
   			// jQuery('ul.tabs').tabs();
		};
		$rootScope.isAdmin = fayeClient.isAdmin;
		$scope.goHome = function(){
			$auth.validateUser()
			.then(function(){
				if($state.current.name == "live"){
					clearInterval(window.refresh);
					clearInterval(window.init);
				}
				$state.go('profile');
			})
			.catch(function(){
				$state.go('login');
			});
		};
		$scope.goAdmin = function(){
			$auth.validateUser()
			.then(function(){
				if($state.current.name == "live"){
					clearInterval(window.refresh);
					clearInterval(window.init);
				}
				$state.go('admin');
			})
			.catch(function(){
				$state.go('login');
			});
		};
		$scope.goLive = function(){
			$auth.validateUser()
			.then(function(){
				if($state.current.name == "live"){
					return false;
				} else{
					$state.go('live');
				}
			})
			.catch(function(){
				$state.go('login');
			});
		};
		$scope.goSupport = function(){
			$auth.validateUser()
			.then(function(){
				if($state.current.name == "live"){
					clearInterval(window.refresh);
					clearInterval(window.init);
				}
				$state.go('chat');
			})
			.catch(function(){
				$state.go('login');
			});
		};
		$scope.goProfile = function(){
			$auth.validateUser()
			.then(function(){
				if($state.current.name == "live"){
					clearInterval(window.refresh);
					clearInterval(window.init);
				}
				$state.go('profile');
			})
			.catch(function(){
				$state.go('login');
			});
		};
		$scope.logout = function(){
			fayeClient.disconnect();
			fayeClient.clearChat();
			$auth.signOut()
			.then(function(){
				if($state.current.name == "live"){
					clearInterval(window.refresh);
					clearInterval(window.init);
				}
				// console.log("successfully logged out");
				$state.go('login');
			})
			.catch(function(){
				console.log("error logging out");
			});
		}
	}
])