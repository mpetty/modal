module.exports = function(grunt) {

	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),

		concat: {
			dist: {
				src: [
					'src/jquery.okModal.js'
				],
				dest: 'jquery.okModal.min.js',
			}
		},

		uglify: {
			dist: {
				files: {
					'jquery.okModal.min.js' : [
						'jquery.okModal.min.js'
					]
				}
			}
		},

		jshint: {
			all: [
				'Gruntfile.js',
				'src/*.js'
			],
			options: {
				curly: false,
				eqeqeq: true,
				immed: true,
				latedef: true,
				newcap: true,
				noarg: true,
				sub: true,
				undef: true,
				boss: true,
				eqnull: true,
				browser: true,
				jquery: true,

				globals: {
					module: true,
					require: true,
					jQuery: true,
					console: true,
					define: true
				}
			}
		},

		sass: {
			dist: {
				options: {
					style: 'compressed',
					sourcemap: 'none',
					compass: false,
					lineNumbers: true,
					update: true
				},
				files: {
					'okModal.min.css': 'src/okModal.scss'
				}
			}
		},

		watch: {
			js: {
				files: [
					'src/*.js'
				],
				tasks: [
					'jshint',
					'concat',
					'uglify'
				]
			},
			css: {
				files: [
					'src/*.scss'
				],
				tasks: ['sass'],
				options: {
					spawn: false,
				}
			}
		}

	});

	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-sass');
	grunt.loadNpmTasks('grunt-contrib-watch');

	grunt.registerTask('default', [
		'sass',
		'concat',
		'uglify'
	]);

};