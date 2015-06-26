var ConnectionManager = {

	isInitialized: false,

	init: function(onConnect, onDisconnect)
	{
		if(typeof onConnect === 'callback' && typeof onDisconnect === 'callback')
		{
			this.isInitialized = true;
			$(document).isOffline({ interval: 15000, baseUrl: "http://dev.marketlytics.com/offline/sample" })
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