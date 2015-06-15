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