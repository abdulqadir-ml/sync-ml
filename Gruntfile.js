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
	}
  });

  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-uglify');

  grunt.registerTask('default', ['concat', 'uglify']);

};