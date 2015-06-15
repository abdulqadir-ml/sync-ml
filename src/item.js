var Item = function(data)
{
	this.sync_op = Syncer.OP.NONE;
	this.sync_uuid = Utils.uuid();
	this.userData = data;
};