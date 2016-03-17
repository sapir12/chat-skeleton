'use strict';
/* Directives*/

// register the module with Angular
App.directive('chatManager', [// require the 'app.service' module
	'version', function(version) {
		return function(scope, elm, attrs) {
			return elm.text(version);
		};
	}
]);