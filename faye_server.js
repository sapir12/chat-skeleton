'use strict'
var server = function(port, pathOptional){
	var http = require('http'),
		faye = require('faye');

	var server = http.createServer();
	var path = '';
	if (pathOptional){
		path += pathOptional;
	}
	var	bayeux = new faye.NodeAdapter({
		mount: '/'+path,
		// timeout: Infinity // CHECK FOR THIS LINE - might cause errors.
	});

	bayeux.on('subscribe', function(clientId, channel) {
	    // console.log('subscribed', channel, clientId);
	});
	bayeux.on('unsubscribe', function(clientId, channel) {
	    // console.log('unsubscribed',channel, clientId);
	});
	bayeux.on('handshake', function(clientId){
		// console.log("handshaked from:", clientId)
	});
	bayeux.on('disconnect', function(clientId){
		// console.log("disconnected:", clientId);
	});
	
	bayeux.attach(server);
	server.listen(port);
	console.log('server listening on port '+port.toString() );
}

server(8001);//main