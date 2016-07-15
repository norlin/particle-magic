'use strict';

module.exports = function(grunt) {

grunt.initConfig({
	browserify: {
		client: {
			options: {
				browserifyOptions: {
					debug: true
				},
				transform: [['babelify', {presets: ['es2015']}]]
			},
			files: {
				'build/client/js/main.js': 'src/client/js/main.js'
			}
		}
	},
	exorcise: {
		client: {
			options: {
				strict: true
			},
			files: {
				'build/client/js/main.map': ['build/client/js/main.js'],
			}
		}
	},
	copy: {
		html: {
			files: {
				'build/client/index.html': 'src/client/index.html',
				'build/client/js/fabric.js': 'node_modules/fabric/dist/fabric.js'
			}
		}
	},
	less: {
		options: {
			paths: ['src/client/css/']
		},
		client: {
			files: [
				{
					nonull: true,
					dest: 'build/client/css/main.css',
					src: ['src/client/css/*.less']
				}
			]
		}
	},
	watch: {
		js: {
			files: ['src/client/js/*.js'],
			tasks: ['browserify:client'],
			options: {
				spawn: false,
			},
		},
		css: {
			files: ['src/client/css/*.less'],
			tasks: ['less:client'],
			options: {
				spawn: false,
			},
		},
		html: {
			files: ['src/client/*.html'],
			tasks: ['copy:html'],
			options: {
				spawn: false,
			},
		},
	},
	clean: ['build'],
});

require('load-grunt-tasks')(grunt);

grunt.registerTask('build', [
	'clean',
	'browserify',
	'exorcise',
	'less',
	'copy'
]);

// Default task
grunt.registerTask('default', ['build', 'watch']);

};
