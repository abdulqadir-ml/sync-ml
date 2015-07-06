var ConnectionManager = {
	
	isInitialized: false,

	init: function(onConnect, onDisconnect, url)
	{
		if(typeof onConnect === 'function' && typeof onDisconnect === 'function')
		{
			this.isInitialized = true;
			var url = 'https://ajax.googleapis.com/ajax/libs/webfont/1.5.18/webfont.js';
			if(window.location.hostname.indexOf('localhost') < 0) {
				url = window.location.protocol + '//' + window.location.hostname + (window.location.port ? ':' : '') + window.location.port;
			}
			$(document).isOffline({ baseUrl: url })
			.bind('isOnline', onConnect)
			.bind("isOffline", onDisconnect);
		}
	},

	triggerCallbacks: function()
	{
		if(this.isInitialized) {
			$(document).data("plugin_isOffline").check();
		}
	}
};