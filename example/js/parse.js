var ParseApiHandler = {

	init: function() {
		Parse.initialize("UHNHrABeTDepSciI68QfnkzcmjdJLlsiJSOHdvmN", "TYHe0eYV3NQoWlFCG6S590vKEUQsRBOZLxMsXEy4");
	},

	getData: function(limit) {
		var deferred = $.Deferred();

		var Todo = Parse.Object.extend("Todo");
		var query = new Parse.Query(Todo);

		query.descending("updatedAt");
		if(typeof limit == "number") query.limit(limit);

		query.find({
			success:function(objectArr) {
				var todos = [];
				for(var i = 0; i < objectArr.length; i++)
				{
					var object = objectArr[i];
					todos.push({
						id: object.id,
						title: object.attributes.title,
						completed: object.attributes.completed
					});
				};
				deferred.resolve(todos);
			},
			error: function(error) {
				deferred.reject(error);
			}
		});

		return deferred.promise();
	},

	add: function(obj) {
		var deferred = $.Deferred();

		var Todo = Parse.Object.extend("Todo");
		var todo = new Todo();

		this.fillTask(todo, obj);

		todo.save(null, {
			success: function(obj) {
				deferred.resolve(obj);
			},
			error: function(obj, error) {
				deferred.reject(error);
			}
		});

		return deferred.promise();
	},

	update: function(obj) {

		var _this = this;
		var deferred = $.Deferred();

		if(typeof obj.id != "undefined" || obj.id != null) {
			var Todo = Parse.Object.extend("Todo");
			var query = new Parse.Query(Todo);

			query.get(obj.id, {
				success: function(parseObj) {
					_this.fillTask(parseObj, obj);
					parseObj.save().then(function(obj) {
						deferred.resolve(obj);
					}, function(error) {
						deferred.reject(error);
					});
				},
				error: function(obj, error) {
					deferred.reject(error);
				}
			});
		}
		else deferred.reject({msg: "cannot update object with id null"});
		return deferred.promise();
	},

	remove: function(obj) {
		var deferred = $.Deferred();

		if(typeof obj.id != "undefined" || obj.id != null) {
			var Todo = Parse.Object.extend("Todo");
			var query = new Parse.Query(Todo);

			query.get(obj.id, {
				success: function(parseObj) {
					parseObj.destroy({
						success: function(parseObj) {
							deferred.resolve(parseObj);
						},
						error: function(parseObj, error) {
							deferred.reject(error);
						}
					});
				},
				error: function(obj, error) {
					deferred.reject(error);
				}
			});
		}
		else deferred.reject({msg: "cannot delete object with id null"});
		return deferred.promise();
	},

	fillTask: function(parseObj, data) {
		parseObj.set("title", data.title);
		parseObj.set("completed", data.completed);
	}
};