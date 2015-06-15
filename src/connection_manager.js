var ConnectionManager = {
	connectCallbacks: [],
	disconnectCallbacks: [],

	init: function(onConnect, onDisconnect)
	{
		if(typeof onConnect === 'function') this.connectCallbacks.push(onConnect);
		if(typeof onDisconnect === 'function') this.disconnectCallbacks.push(onDisconnect);

		//register handlers when the internet connection gets up or down
		var addEvent =  window.attachEvent || window.addEventListener;
		var onlineEvent = window.attachEvent ? 'ononline' : 'online';
		var offlineEvent = window.attachEvent ? 'onoffline' : 'offline';
		addEvent(offlineEvent, onDisconnect);
		addEvent(onlineEvent, onConnect);
	},

	isConnected: function()
	{
		window.navigator.onLine;
	}
};