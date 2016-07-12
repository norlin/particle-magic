'use strict';

module.exports = function(grunt) {

grunt.initConfig({
	browserify: {
		client: {
			options: {
				transform: [["babelify", {presets: ["es2015"]}]]
			},
			files: {
				"build/client/js/main.js": "src/client/js/main.js"
			}
		}
	},
	copy: {
		html: {
			files: {
				"build/client/index.html": "src/client/index.html"
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
	clean: ['build'],
});

require("load-grunt-tasks")(grunt);

grunt.registerTask("build", [
	"clean",
	"browserify",
	"less",
	"copy"
]);

// Default task
grunt.registerTask("default", ["build:client"]);

};
