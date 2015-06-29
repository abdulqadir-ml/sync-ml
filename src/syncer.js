var Syncer = function()
{

	this.apiHandler = null,

	this.init = function(apiHandler, initArgs)
	{
		this.apiHandler = apiHandler;
		if(typeof apiHandler.add !== 'function'
			|| typeof apiHandler.update !== 'function'
			|| typeof apiHandler.remove !== 'function'
			|| typeof apiHandler.getData !== 'function')
		{
			throw 'Api Handler doesn\'t implement the expected interface!'
		}
		if(typeof this.apiHandler.init === 'function') this.apiHandler.init(initArgs);
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