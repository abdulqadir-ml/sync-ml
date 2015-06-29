/*global jQuery, Handlebars, Router */
jQuery(function ($) {
	'use strict';

	Handlebars.registerHelper('eq', function (a, b, options) {
		return a === b ? options.fn(this) : options.inverse(this);
	});

	var ENTER_KEY = 13;
	var ESCAPE_KEY = 27;

	var util = {
		uuid: function () {
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
		pluralize: function (count, word) {
			return count === 1 ? word : word + 's';
		},
		store: function (namespace, data) {
			if (arguments.length > 1) {
				return localStorage.setItem(namespace, JSON.stringify(data));
			} else {
				var store = localStorage.getItem(namespace);
				return (store && JSON.parse(store)) || [];
			}
		}
	};
	
	var syncModule = new SyncModule("todoApp");
	var App = {
		init: function () {
			var _this = this;
			syncModule.init(ParseApiHandler, function(err, items) {
				if(err === null)
				{
					_this.todos = [];
					items.forEach(function(todo) {
						_this.todos.push({
							sync_id: todo.sync_id,
							id: todo.obj.id,
							completed: todo.obj.completed,
							title: todo.obj.title
						});
					});
					_this.cacheElements();
					_this.bindEvents();
					new Router({
						'/:filter': function (filter) {
							_this.filter = filter;
							_this.render();
						}.bind(_this)
					}).init('/all');
				}
			});
		},
		cacheElements: function () {
			this.todoTemplate = Handlebars.compile($('#todo-template').html());
			this.footerTemplate = Handlebars.compile($('#footer-template').html());
			this.$todoApp = $('#todoapp');
			this.$header = this.$todoApp.find('#header');
			this.$main = this.$todoApp.find('#main');
			this.$footer = this.$todoApp.find('#footer');
			this.$newTodo = this.$header.find('#new-todo');
			this.$toggleAll = this.$main.find('#toggle-all');
			this.$todoList = this.$main.find('#todo-list');
			this.$count = this.$footer.find('#todo-count');
			this.$clearBtn = this.$footer.find('#clear-completed');
		},
		bindEvents: function () {
			var list = this.$todoList;
			this.$newTodo.on('keyup', this.create.bind(this));
			this.$toggleAll.on('change', this.toggleAll.bind(this));
			this.$footer.on('click', '#clear-completed', this.destroyCompleted.bind(this));
			list.on('change', '.toggle', this.toggle.bind(this));
			list.on('dblclick', 'label', this.edit.bind(this));
			list.on('keyup', '.edit', this.editKeyup.bind(this));
			list.on('focusout', '.edit', this.update.bind(this));
			list.on('click', '.destroy', this.destroy.bind(this));
		},
		render: function () {
			var todos = this.getFilteredTodos();
			this.$todoList.html(this.todoTemplate(todos));
			this.$main.toggle(todos.length > 0);
			this.$toggleAll.prop('checked', this.getActiveTodos().length === 0);
			this.renderFooter();
			this.$newTodo.focus();
			util.store('todos-jquery', this.todos);
		},
		renderFooter: function () {
			var todoCount = this.todos.length;
			var activeTodoCount = this.getActiveTodos().length;
			var template = this.footerTemplate({
				activeTodoCount: activeTodoCount,
				activeTodoWord: util.pluralize(activeTodoCount, 'item'),
				completedTodos: todoCount - activeTodoCount,
				filter: this.filter
			});

			this.$footer.toggle(todoCount > 0).html(template);
		},
		toggleAll: function (e) {
			var _this = this;
			
			var isChecked = $(e.target).prop('checked');

			this.todos.forEach(function (todo) {
				todo.completed = isChecked;
				syncModule.update(todo.sync_id, todo, function(err, item) {
					if(err == null) {
						todo.sync_id = item.sync_id;
						todo.id = item.obj.id;
						_this.render();
					}
				});
			});

			this.render();
		},
		getActiveTodos: function () {
			return this.todos.filter(function (todo) {
				return !todo.completed;
			});
		},
		getCompletedTodos: function () {
			return this.todos.filter(function (todo) {
				return todo.completed;
			});
		},
		getFilteredTodos: function () {
			if (this.filter === 'active') {
				return this.getActiveTodos();
			}

			if (this.filter === 'completed') {
				return this.getCompletedTodos();
			}

			return this.todos;
		},
		destroyCompleted: function () {
			this.todos = this.getActiveTodos();
			this.filter = 'all';
			this.render();
		},
		// accepts an element from inside the `.item` div and
		// returns the corresponding index in the `todos` array
		indexFromEl: function (el) {
			var id = $(el).closest('li').data('id');
			var todos = this.todos;
			var i = todos.length;

			while (i--) {
				if (todos[i].sync_id === id) {
					return i;
				}
			}
		},
		create: function (e) {
			var _this = this;
			var $input = $(e.target);
			var val = $input.val().trim();

			if (e.which !== ENTER_KEY || !val) {
				return;
			}

			var todo = {
				id: util.uuid(),
				title: val,
				completed: false
			};

			this.todos.push(todo);
			syncModule.add(todo, function(err, item) {
				todo.sync_id = item.sync_id;
				if(err === null) {
					todo.id = item.obj.id;
				}
				_this.render();
			});

			$input.val('');
		},
		toggle: function (e) {
			var _this = this;
			var i = this.indexFromEl(e.target);
			this.todos[i].completed = !this.todos[i].completed;
			syncModule.update(this.todos[i].sync_id, this.todos[i], function(err, item) {
				_this.todos[i].sync_id = item.sync_id;
				if(err == null) {
					_this.todos[i].id = item.obj.id;
				}
				_this.render();
			});
		},
		edit: function (e) {
			var $input = $(e.target).closest('li').addClass('editing').find('.edit');
			$input.val($input.val()).focus();
		},
		editKeyup: function (e) {
			if (e.which === ENTER_KEY) {
				e.target.blur();
			}

			if (e.which === ESCAPE_KEY) {
				$(e.target).data('abort', true).blur();
			}
		},
		update: function (e) {
			var _this = this;
			var el = e.target;
			var $el = $(el);
			var val = $el.val().trim();

			if ($el.data('abort')) {
				$el.data('abort', false);
				this.render();
				return;
			}

			var i = this.indexFromEl(el);

			if (val) {
				this.todos[i].title = val;
				syncModule.update(this.todos[i].sync_id, this.todos[i], function(err, item) {
					_this.todos[i].sync_id = item.sync_id;
					if(err === null) {
						_this.todos[i].id = item.obj.id;
					}
					_this.render();
				});
			} else {
				var todo = this.todos.splice(i, 1);
				syncModule.remove(todo[0].sync_id, todo[0], function(err, obj) {  });
				this.render();
			}
		},
		destroy: function (e) {
			var todo = this.todos.splice(this.indexFromEl(e.target), 1);
			syncModule.remove(todo[0].sync_id, todo[0], function(err, obj) {  });
			this.render();
		}
	};

	App.init();
});
