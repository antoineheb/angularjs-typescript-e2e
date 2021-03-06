'use strict';
var lrSnippet = require('grunt-contrib-livereload/lib/utils').livereloadSnippet;
var mountFolder = function (connect, dir) {
	return connect.static(require('path').resolve(dir));
};

module.exports = function (grunt) {
	// load all grunt tasks
	require('matchdep').filterDev('grunt-*').forEach(grunt.loadNpmTasks);

	// configurable paths
	var yeomanConfig = {
		app:  'app',
		dist: 'dist',
		tmp:  '.tmp'
	};

	var jshintFiles = [
		'<%= yeoman.app %>/*.js',
		'<%= yeoman.app %>/scripts/**/*.js',
		// config files
		'test/*.js',
		'test/spec/**/*.js',
		'test/e2e/**/*.js',
		// don't lint vendor files
		'!<%= yeoman.app %>/scripts/vendor/**/*.js',
		// don't lint the typedefs js (not our project)
		'!<%= yeoman.app %>/scripts/typedefs/**/*.js',
		// don't lint js generated by the TypeScript compiler
		'!<%= yeoman.app %>/scripts/tslib.js'
	];

	try {
		yeomanConfig.app = require('./component.json').appPath || yeomanConfig.app;
	} catch (e) {}

	grunt.initConfig({
		yeoman: yeomanConfig,
		// NOTE grunt-regarde, that powers watch, only executes the last task that
		// matches a given file. Be careful of this when tweaking these tasks.
		// https://github.com/yeoman/grunt-regarde/issues/7
		watch: {
			typescript: {
				files: ['<%= yeoman.app %>/scripts/**/*.ts'],
				tasks: ['typescript'],
				spawn: true // otherwise compile errors kill the watch
			},
			compass: {
				files: ['<%= yeoman.app %>/styles/**/*.{scss,sass}'],
				tasks: ['compass:server']
			},
			imagemin: {
				files: ['<%= yeoman.app %>/images/**/*.{png,jpg,jpeg}'],
				tasks: ['imagemin:tmp', 'compass:server']
			},
			copygifs: {
				files: ['<%= yeoman.app %>/images/**/*.gif'],
				tasks: ['copy:gifs_tmp', 'compass:server']
			},
			livereload: {
				files: [
					'<%= yeoman.app %>/**/*.html',
					'{.tmp,<%= yeoman.app %>}/styles/*.css',
					'{.tmp,<%= yeoman.app %>}/**/*.js',
					'<%= yeoman.app %>/images/*.{png,jpg,jpeg,gif,webp}'
				],
				tasks: ['livereload']
			}
		},
		connect: {
			livereload: {
				options: {
					port: 9000,
					// Change this to '0.0.0.0' to access the server from outside.
					hostname: 'localhost',
					middleware: function (connect) {
						return [
							lrSnippet,
							mountFolder(connect, '.tmp'),
							mountFolder(connect, yeomanConfig.app),
							// read README to understand why this is necessary
							mountFolder(connect, '.')
						];
					}
				}
			},
			e2e: {
				options: {
					port: 9001,
					middleware: function (connect) {
						return [
							mountFolder(connect, '.tmp'),
							mountFolder(connect, yeomanConfig.app),
							// read README to understand why this is necessary
							mountFolder(connect, '.')
						];
					}
				}
			}
		},
		open: {
			server: {
				url: 'http://localhost:<%= connect.livereload.options.port %>'
			}
		},

		// FIXME tslib.js shouldn't be generated into the scripts directory in the first place,
		// but rather into either a .tmp or a .dist one; will set this up later
		clean: {
			dist:   ['<%= yeoman.app %>/scripts/tslib.js', '.tmp', '<%= yeoman.dist %>/*'],
			server: ['<%= yeoman.app %>/scripts/tslib.js', '.tmp'],
			// unit tests don't run compass, so they shouldn't blow away the .tmp directory either
			unit:   ['<%= yeoman.app %>/scripts/tslib.js']
		},
		jshint: {
			options: {
				jshintrc: '.jshintrc'
			},
			all: jshintFiles,
			dev: {
				src: jshintFiles,
				// NOTE this doesn't work right now, but there's
				// a pull request to the grunt-jshint project that
				// makes overrides to jshintrc values work per target
				options: {
					debug: true
				}
			}
		},
		karma: {
			unit: {
				configFile: 'test/karma.conf.js'
			},
			unit_watch: {
				configFile: 'test/karma.conf.js',
				singleRun: false,
				autoWatch: true
			},
			e2e: {
				configFile: 'test/karma-e2e.conf.js'
			},
			e2e_watch: {
				configFile: 'test/karma-e2e.conf.js',
				singleRun: false,
				autoWatch: true
			}
		},

		typescript: {
			base: {
				src: [
					'<%= yeoman.app %>/scripts/app.ts',
					'<%= yeoman.app %>/scripts/**/*.ts',
				],
				dest: '<%= yeoman.app %>/scripts/tslib.js',
				options: {
					sourcemap: true
				}
			}
		},
		compass: {
			options: {
				sassDir:        '<%= yeoman.app %>/styles',
				// this task outputs everything to .tmp; for the production build,
				// the cssmin task will pick up .css files from .tmp and move them to dist
				cssDir:         '<%= yeoman.tmp %>/styles',
				imagesDir:      '<%= yeoman.tmp %>/images',
				javascriptsDir: '<%= yeoman.app %>/scripts',
				fontsDir:       '<%= yeoman.app %>/styles/fonts',
				importPath:     '<%= yeoman.app %>/components',
				relativeAssets: true
			},
			dist: {
				options: {
					imagesDir:  '<%= yeoman.app %>/images',
					debugInfo: false
				}
			},
			server: {
				options: {
					debugInfo: false
				}
			}
		},
		concat: {
			// this empty config will be appended by the usemin task, based on the
			// <!-- build:js --> blocks in index.html
		},
		useminPrepare: {
			html: [
				'<%= yeoman.app %>/index.html',
				// TODO once we have a backend server always running, we can
				// remove the e2e index, but for now it's nice to have
				'<%= yeoman.app %>/index-e2e.html'
			],
			options: {
				dest: '<%= yeoman.dist %>'
			}
		},
		usemin: {
			// first pass tasks 'html' and 'css'
			html: [
				'<%= yeoman.dist %>/index.html',
				'<%= yeoman.dist %>/index-e2e.html',
				'<%= yeoman.dist %>/views/**/*.html',
				'<%= yeoman.dist %>/pages/**/*.html',
			],
			css: ['<%= yeoman.dist %>/styles/{,*/}*.css'],
			// second pass of usemin to update the reference to the templates.js file
			// that was generated _after_ the first pass of usemin, since it needs to
			// bundle together .html files _after_ asset references in them have been
			// updated with revved filenames
			templates: {
				src: ['<%= yeoman.dist %>/index.html'],
				options: {
					type:  'html',
				},
			},
			options: {
				dirs: ['<%= yeoman.dist %>']
			}
		},
		imagemin: {
			tmp: {
				files: [{
					expand: true,
					cwd:    '<%= yeoman.app %>/images',
					src:    '**/*.{png,jpg,jpeg}',
					dest:   '<%= yeoman.tmp %>/images'
				}]
			},
			dist: {
				files: [{
					expand: true,
					cwd: '<%= yeoman.app %>/images',
					src:    '**/*.{png,jpg,jpeg}',
					dest: '<%= yeoman.dist %>/images'
				}]
			}
		},
		cssmin: {
			// this empty config will be appended by the usemin task, based on the
			// <!-- build:css --> blocks in index.html
		},
		cdnify: {
			dist: {
				html: ['<%= yeoman.dist %>/*.html']
			}
		},
		ngmin: {
			dist: {
				files: [{
					expand: true,
					cwd: '<%= yeoman.dist %>/scripts',
					src: '*.js',
					dest: '<%= yeoman.dist %>/scripts'
				}]
			}
		},
		uglify: {
			dist: {
				files: {
					'<%= yeoman.dist %>/scripts/scripts.js': [
						'<%= yeoman.dist %>/scripts/scripts.js'
					]
				}
			}
		},
		rev: {
			first: {
				files: {
					src: [
						'<%= yeoman.dist %>/scripts/**/*.js',
						'<%= yeoman.dist %>/styles/**/*.css',
						'<%= yeoman.dist %>/images/**/*.{png,jpg,jpeg,gif,webp,svg}',
						'<%= yeoman.dist %>/styles/fonts/**/*'
					]
				}
			},
			second: {
				files: {
					src: [
						'<%= yeoman.dist %>/scripts/templates.js',
					]
				}
			}
		},
		copy: {
			gifs_tmp: {
				files: [{
					expand: true,
					cwd:    '<%= yeoman.app %>/images',
					src:    '{,*/}*.gif',
					dest:   '<%= yeoman.tmp %>/images'
				}]
			},
			gifs_dist: {
				files: [{
					expand: true,
					cwd:    '<%= yeoman.app %>/images',
					src:    '{,*/}*.gif',
					dest:   '<%= yeoman.dist %>/images'
				}]
			},
			dist: {
				files: [{
					expand: true,
					dot: true,
					cwd: '<%= yeoman.app %>',
					dest: '<%= yeoman.dist %>',
					src: [
						'*.{ico,txt}',
						'.htaccess',
						// change this to copy only the components necessary for the production dist
						'components/**/*',
						'images/**/*.{gif,webp}',
						'views/**/*.html',
						'*.html',
						// default config
						'config.js',
					]
				}]
			}
		},
		html2js: {
			options: {
				base: '<%= yeoman.dist %>',
				module: 'angtsTemplates',
			},
			main: {
				src:  ['<%= yeoman.dist %>/views/**/*.html'],
				dest: '<%= yeoman.dist %>/scripts/templates.js',
			}
		},
		verifybuild: {
			options: {
				exist: [
					'index.html',
				],
				revved: [
					'scripts/scripts.js',
					'scripts/templates.js',
					'styles/styles.css',
				],
				revvedRefs: {
					'index.html': [
						'scripts/scripts.js',
						'scripts/templates.js',
						'styles/styles.css',
					],
					'scripts/templates.js': [
						'images/nested/many/levels/deep/bullet.png',
					],
					'styles/styles.css': [
						'images/nested/many/levels/deep/bullet.png',
					],
				},
			}
		}
	});

	grunt.renameTask('regarde', 'watch');



	/////////  COMPASS AND IMAGE COMPRESSION  ////////
	// we want to run png and jpeg optimization before we run
	// compass, so that optimized images are inlined into the resulting
	// .css files. We also want to copy .gif files over straight.
	grunt.registerTask('imgcompass_server', [
		'imagemin:tmp',
		'copy:gifs_tmp',
		'compass:server'
	]);

	grunt.registerTask('imgcompass_dist', [
		'imagemin:dist',
		'copy:gifs_dist',
		'compass:dist'
	]);


	/////////  DEV SERVER  ////////
	grunt.registerTask('server', [
		'clean:server',
		'typescript',
		'imgcompass_server',
		'livereload-start',
		'connect:livereload',
		'open',
		'watch'
	]);

	/////////  UNIT and END-TO-END TESTS  ////////

	// This task purposely doesn't use the unit/e2e tasks
	// in order to avoid the duplicated hint/clean/compile tasks
	grunt.registerTask('test', [
		//'jshint:dev',
		'clean:server',
		'typescript',
		'imgcompass_server',
		'karma:unit',
		'connect:e2e',
		'karma:e2e'
	]);

	grunt.registerTask('unit', [
		//'jshint:dev',
		'clean:unit',
		'typescript',
		'karma:unit'
	]);

	grunt.registerTask('unit_watch', [
		//'jshint:dev',
		'clean:unit',
		'typescript',
		'karma:unit_watch'
	]);

	grunt.registerTask('e2e', [
		//'jshint:dev',
		'clean:server',
		'typescript',
		'imgcompass_server',
		'connect:e2e',
		'karma:e2e'
	]);

	grunt.registerTask('e2e_watch', [
		//'jshint:dev',
		'clean:server',
		'typescript',
		'imgcompass_server',
		'connect:e2e',
		'karma:e2e_watch'
	]);

	/////////  PRODUCTION DISTRIBUTION  ////////
	grunt.registerTask('build', [
		'clean:dist',
		'typescript',
		//'jshint:all',
		'test',
		'imgcompass_dist',

		'useminPrepare',
		'concat',
		'cssmin',
		'copy:dist',
		// from what I understand, cdnify only moves google cdn linked scripts
		// out of the usemin's build comment blocks; we don't need to worry about that
		// 'cdnify',
		'ngmin',
		'rev:first',
		//'uglify'
		'usemin:html',
		'usemin:css',

		'html2js',
		'rev:second',
		'usemin:templates',
		'verifybuild',
	]);

	grunt.registerTask('default', ['typescript']);
};
