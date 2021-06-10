/************** Initiate **************/
document.addEventListener('deviceready', function() {
	// Replaces the alert() function with device specific notification
	// if available.
	if (navigator.notification)
		window.alert = function(message) {
			navigator.notification.alert(
				message,
				null,			// callback
				"Exercise App",	// title
				"OK"			// button
			)
		};
}, false);