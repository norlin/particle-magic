'use strict';

module.exports = function(grunt) {

grunt.initConfig({
	browserify: {
		client: {
			options: {
				browserifyOptions: {
					debug: true,
					paths: ['./src']
				},
				transform: [['babelify', {presets: ['es2015']}]]
			},
			files: {
				'build/client/js/main.js': 'src/client/js/main.js'
			}
		},
	},
	babel: {
		server: {
			options: {
				presets: ['es2015'],
				sourceRoot: './src'
			},
			files: [
				{
					expand: true,
					cwd: 'src/',
					src: [
						'common/*.js',
						'server/*.js',
					],
					dest: 'build/'
				},
				{
					expand: true,
					cwd: './',
					src: ['index.js'],
					dest: 'build/'
				}
			]
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
		js_client: {
			files: [
				'src/client/js/*.js',
				'src/common/*.js'
			],
			tasks: ['browserify:client'],
			options: {
				spawn: false,
			},
		},
		js_server: {
			files: [
				'src/server/*.js',
				'src/common/*.js',
				'./index.js'
			],
			tasks: ['babel:server'],
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
	'babel:server',
	'browserify:client',
	'exorcise',
	'less',
	'copy'
]);

// Default task
grunt.registerTask('default', ['build', 'watch']);

};
