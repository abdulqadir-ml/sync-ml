module.exports = function(grunt) {

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    concat: {
		options: {
			banner: '(function(window) {\n',
			footer: '\n})(window);'
		},
		dist: {
			src: [
				'src/utils.js', 
				'src/item.js', 
				'src/storage_manager.js',
				'src/connection_manager.js', 
				'src/syncer.js',
				'src/sync_module.js'
			],
			dest: 'build/<%= pkg.name %>-<%= pkg.version %>.js'
		}
	},
	uglify: {
		dist: {
			files: {
				'build/<%= pkg.name %>-<%= pkg.version %>-min.js': ['build/<%= pkg.name %>-<%= pkg.version %>.js']
			}
		}
	},
	connect: {
		server: {
			options: {
                port: 9000,
				open: 'http://localhost:9000/example/',
				livereload: true
			}
		}
	},
	watch: {
		scripts: {
			files: ['src/*.js'],
			tasks: ['build'],
			options: {
				livereload: 9001
			}
		}
	}
  });

  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-connect');
  grunt.loadNpmTasks('grunt-contrib-watch');

  grunt.registerTask('build', ['concat', 'uglify']);
  grunt.registerTask('default', ['connect', 'watch']);

};