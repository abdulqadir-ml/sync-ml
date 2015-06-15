(function(window) {
var Utils = {
	uuid: function ()
	{
		/*jshint bitwise:false */
		var i, random;
		var uuid = '';

		for (i = 0; i < 32; i++) {
			random = Math.random() * 16 | 0;
			if (i === 8 || i === 12 || i === 16 || i === 20) {
				uuid += '-';
			}
			uuid += (i === 12 ? 4 : (i === 16 ? (random & 3 | 8) : random)).toString(16);
		}

		return uuid;
	},

	//create deep copy
	copy: function(obj)
	{
		return JSON.parse(JSON.stringify(obj));
	}
};
var Item = function(data)
{
	this.sync_op = Syncer.OP.NONE;
	this.sync_uuid = Utils.uuid();
	this.userData = data;
};
var StorageManager = function(appName)
{
	this.items = [];
	this.uuid = 'sync_' + appName;

	this.init = function()
	{
		this.items = this.getItemsFromStore();
	};

	this.add = function(op, obj)
	{
		var item = new Item(obj);
		item.sync_op = op;
		this.items.unshift(item);
		this.saveItemsToStore();
		return item;
	};

	this.addBulk = function(objs) {

		for(var x = 0; x < objs.length; x++) {
			var newItem = new Item(objs[x]);
			newItem.sync_op = Syncer.OP.NONE;
			this.items.push(newItem);
		}

		this.saveItemsToStore();
	};

	this.remove = function(id)
	{
		var index = this.getIndexById(id);
		if(index >= 0)
		{
			var item = this.items.splice(index,1);
			this.saveItemsToStore();
			return item[0];
		}
	};

	this.update = function(id, op, obj)
	{
		var index = this.getIndexById(id);
		if(index >= 0)
		{
			this.items[index].userData = obj;
			this.items[index].sync_op = op;
			this.saveItemsToStore();
			return this.items[index];
		}
	};

	this.empty = function()
	{
		this.items = [];
		this.saveItemsToStore();
	};

	this.saveItemsToStore = function()
	{
		localStorage.setItem(this.uuid, JSON.stringify(this.items));
	};

	this.getItemsFromStore = function()
	{
		var items = localStorage.getItem(this.uuid);
		if(typeof items !== 'undefined' && items !== null) return JSON.parse(items);
		return [];
	};

	this.getItems = function()
	{
		return Utils.copy(this.items);
	};

	this.getItemsExcluding = function(op)
	{
		return jQuery(this.getItems()).filter(function() { return this.sync_op !== op; });
	};

	this.getItemById = function(id)
	{
		var index = this.getIndexById(id);
		if(index >= 0) return this.items[index];
		return null;
	};

	this.getIndexById = function(id)
	{
		for(var i = 0; i < this.items.length; i++)
		{
			if(this.items[i].sync_uuid === id) return i;
		}
		return -1;
	};
};
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
var Syncer = function()
{

	this.apiHandler = null,

	this.init = function(apiHandler)
	{
		this.apiHandler = apiHandler;
		if(typeof apiHandler.add !== 'function'
			|| typeof apiHandler.update !== 'function'
			|| typeof apiHandler.remove !== 'function'
			|| typeof apiHandler.getData !== 'function')
		{
			throw 'Api Handler doesn\'t implement the expected interface!'
		}
		this.apiHandler.init();
	};

	this.promiseHandler = function(promise, callback)
	{
		promise.done(function(obj)
		{
			callback(null, obj);
		});

		promise.fail(function(error)
		{
			callback(error, null);
		});
	};

	this.send = function(item, callback)
	{
		var promise = null;
		switch(item.sync_op)
		{
			case Syncer.OP.ADD:
				promise = this.apiHandler.add(item.userData);
				break;
			case Syncer.OP.UPDATE:
				promise = this.apiHandler.update(item.userData);
				break;
			case Syncer.OP.DELETE:
				promise = this.apiHandler.remove(item.userData);
				break;
			default:
				console.error('syncer couldn\'t find an operation to perform on an item!');
				break;
		}
		if(promise !== null) this.promiseHandler(promise, callback);
	};

	this.get = function(callback)
	{
		this.promiseHandler(this.apiHandler.getData(), callback);
	};

};

Syncer.OP = {
	NONE: 0,
	ADD: 1,
	UPDATE: 2,
	DELETE: 3
};
var SyncModule = function(appName)
{
	var _this = this;

	var callbackOnSync = null;
	var connManager = ConnectionManager;
	var storeManager = new StorageManager(appName);
	var syncer = new Syncer();
	var syncFlag = false;

	var onConnect = function()
	{
		setTimeout(function() {
			_this.sync(callbackOnSync);
		}, 3000);
	};

	var onDisconnect = function() {};

	this.init = function(apiHandler, syncCallback)
	{
		callbackOnSync = (typeof syncCallback == "function" ? syncCallback : null);
		try
		{
			syncer.init(apiHandler);
		}
		catch(err)
		{
			console.error(err);
			syncer = null;
		}
		connManager.init(onConnect, onDisconnect);
		storeManager.init();
		this.sync(callbackOnSync);
	};

	this.syncItem = function(item, callback)
	{
		syncer.send(item, function(err, apiObj)
		{
			if(err === null)
			{
				console.log(apiObj);
				if(item.sync_op !== Syncer.OP.DELETE) storeManager.update(item.sync_uuid, Syncer.OP.NONE, apiObj);
				else storeManager.remove(item.sync_uuid);
			}
			callback(err, {
				sync_id: item.sync_uuid,
				obj: item.userData
			});
		});
	};

	this.add = function(obj, callback)
	{
		var item = storeManager.add(Syncer.OP.ADD, obj);
		this.syncItem(item, callback);
	};

	this.update = function(id, obj, callback)
	{
		var item = storeManager.getItemById(id);
		if(item.sync_op == Syncer.OP.ADD) item = storeManager.update(id, Syncer.OP.ADD, obj);
		else item = storeManager.update(id, Syncer.OP.UPDATE, obj);
		this.syncItem(item, callback);
	};

	this.remove = function(id, obj, callback)
	{
		var item = storeManager.getItemById(id);
		if(item.sync_op == Syncer.OP.ADD || item.sync_op == Syncer.OP.UPDATE)
		{
			item = storeManager.remove(id);
			callback(null, {sync_id: item.sync_uuid, obj: item.userData});
			return;
		}
		item = storeManager.update(id, Syncer.OP.DELETE, obj);
		this.syncItem(item, callback);
	};

	this.sync = function(callback)
	{
		if(syncFlag)
		{
			console.log("sync is already in progress!");
			return;
		}

		console.log("sync started!");

		syncFlag = true;

		var items = storeManager.getItemsExcluding(Syncer.OP.NONE);
		var syncedItems = [];

		if(items.length > 0)
		{
			for(var i = 0; i < items.length; i++)
			{
				var item = items[i];
				this.syncItem(item, function()
				{
					syncedItems.push(item);
					if(syncedItems.length === items.length) fetch(callback);
				});
			}
		}
		else fetch(callback);
	};

	var fetch = function(callback)
	{
		syncer.get(function(err, objArr)
		{
			if(err == null)
			{
				storeManager.empty();
				storeManager.addBulk(objArr);
			}
			callback(err, getItems());
			syncFlag = false;
			console.log("finished syncing");
		});
	};

	var getItems = function(callback)
	{
		var syncItems = storeManager.getItemsExcluding(Syncer.OP.DELETE);
		var items = [];
		for(var i = 0; i < syncItems.length; i++)
		{
			var item = syncItems[i];
			items.push({
				sync_id: item.sync_uuid,
				obj: item.userData
			})
		}
		return items;
	};

	this.get = function(callback)
	{
		callback(getItems());
	};

	this.isSyncing = function()
	{
		return syncFlag;
	};
};

window.SyncModule = SyncModule;
})(window);