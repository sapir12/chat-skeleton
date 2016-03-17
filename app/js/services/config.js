// angular.module('app')

// .config(["$authProvider", function($authProvider) {

//     // the following shows the default values. values passed to this method
//     // will extend the defaults using angular.extend
//     console.log("RUNNING CONFIG!!!");
//     $authProvider.configure({
//       apiUrl:                  '/api',
//       emailSignInPath:         '/auth/sign_in',
//       tokenValidationPath:     '/auth/validate_token',
//       signOutUrl:              '/auth/sign_out',
//       emailRegistrationPath:   '/auth',
//       accountUpdatePath:       '/auth',
//       accountDeletePath:       '/auth',
//       confirmationSuccessUrl:  window.location.href,
//       passwordResetPath:       '/auth/password',
//       passwordUpdatePath:      '/auth/password',
//       passwordResetSuccessUrl: window.location.href,
//       storage:                 'cookies',
//       proxyIf:                 function() { return false; },
//       proxyUrl:                '/proxy',
//       authProviderPaths: {
//         github:   '/auth/github',
//         facebook: '/auth/facebook',
//         google:   '/auth/google'
//       },
//       /* tokenFormat: {
//         "access-token": "{{ token }}",
//         "token-type":   "Bearer",
//         "client":       "{{ clientId }}",
//         "expiry":       "{{ expiry }}",
//         "uid":          "{{ uid }}"
//       }, */
//       tokenFormat: {
//         "Authorization": "Bearer {{ token }}",
//         "client":       "{{ clientId }}",
//         "expiry":       "{{ expiry }}",
//         "uid":          "{{ uid }}"
//       },
//       parseExpiry: function(headers) {
//         // convert from UTC ruby (seconds) to UTC js (milliseconds)
//         return (parseInt(headers['expiry']) * 1000) || null;
//       },
//       handleLoginResponse: function(response) {
//         return response.data;
//       },
//       handleAccountResponse: function(response) {
//         return response.data;
//       },
//       handleTokenValidationResponse: function(response) {
//         return response.data;
//       }
//     });
//   }]);