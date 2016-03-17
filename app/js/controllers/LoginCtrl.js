angular.module('app').controller('LoginCtrl', ["$scope", "$http", "$auth", "$state", function LoginCtrl($scope, $http, $auth, $state) {
	$scope.init = function(){
		$auth.validateUser()
		.then(function(){
			$state.go('profile');
		})
		.catch(function(){
			$state.go('login');
		});
	};
	$scope.login = function(){
		$auth.submitLogin({
	        email:    $scope.email,
	        password: $scope.password,
	        username: $scope.email,
	        grant_type: 'password'
	    })
	    .then(function(resp) {
	        // console.log('success', resp);
			$scope.isUserValid = true;
	        $state.go('profile');
	    })
	    .catch(function(resp) {
	    	window.alert(resp.reason);
	    });
	};
	// $scope.myEmail = "";
	// $scope.myName  = "";
	// $scope.update = function(){
	// 	$auth.updateAccount({
	// 	  email: "test4@test.com"
	// 	});
	// };
	// $scope.show = function(){
	// 	$scope.try(function(err, res){
	// 		if (err){
	// 			$state.go('login');
	// 			return console.log("err",err);
	// 		}
	// 		$scope.myEmail      = res.email;
	// 		$scope.myName       = res.name;
	// 	})
	// // };
	// $scope.try = function(callback){
	// 	$http.get('/api/profile')
	// 	.success(function(data, status, headers, config) {
	// 		callback(null, data);
	// 	  	// console.log("succes requesting GET /api/try", data);
	// 	})
	// 	.catch(function(data, status, headers, config) {
	// 		callback(data);
	// 	  	// console.log("err requesting GET /api/try", data);
	// 	})
	// };
}]);
    
    // $scope.ninja = function(){
    // 		$http.get('/try',{
    // 			headers: {
    // 				Authorization: "Bearer c8f99782-0432-4d2a-a7e5-aab40b5eec83"
    // 		}})
    // 		.success(function(data, status, headers, config) {
			 //  	console.log("succes", data);
			 //  })
			 //  .catch(function(data, status, headers, config) {
			 //  	console.log("err", data);
			 //  });
    // }


		// $http.post('/api/auth/sign_in', {
		// 	email: email, 
		// 	password: pas
		// })
	 //  .success(function(data, status, headers, config) {
	 //  	console.log("succes", data);
	 //  })
	 //  .catch(function(data, status, headers, config) {
	 //  	console.log("err", data);
	 //  });	
