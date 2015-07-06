var SyncModule = function(appName)
{
	var _this = this;

	var connManager = ConnectionManager;
	var storeManager = new StorageManager(appName);
	var syncer = new Syncer();
	var syncFlag = false;

	this.callbackOnSync = null;

	this.init = function(apiHandler, syncCallback)
	{
		this.callbackOnSync = (typeof syncCallback == "function" ? syncCallback : null);
		try
		{
			syncer.init(apiHandler);
		}
		catch(err)
		{
			console.error(err);
			syncer = null;
		}
		connManager.init(SyncModule.onConnect.bind(this), SyncModule.onDisconnect.bind(this));
		storeManager.init();
		this.sync(this.callbackOnSync);
	};

	this.syncItem = function(item, callback)
	{
		syncer.send(item, function(err, apiObj)
		{
			if(err === null)
			{
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
				this.syncItem(item, function() {
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
		console.log('adsfaf');
	};
};

SyncModule.onConnect = function()
{
	this.sync(this.callbackOnSync);
};

SyncModule.onDisconnect = function() {
	console.log('disconnected!');
};

window.SyncModule = SyncModule;