/*
Last things first: the files that should be served are in the deploy folder.
Notes:
The goal of this build script is to take the html, css, and js files as I write them,
and run javascript through hint/lint utilities,
and make minified versions of everything,.
In particular, I will not automatically concatenate files or put external files inline in the html.
I will also handle any image optimization manually or as part of a separate script.
Maybe someday I will automate, but for now I will do that manually.
*/

'use strict'



module.exports = function(grunt) {

  grunt.initConfig({
	jshint: {
		options: {
      curly: true,
      eqeqeq: true,
      eqnull: true
    },
    all: ['source/js/*.js'],
	deploy: ['deploy/js/*.js']
  },
    prettify: {
    options: {
    indent: 1,
    indent_char: '	',
    wrap_line_length: 80,
    brace_style: 'end-expand',
    unformatted: ['a', 'sub', 'sup', 'b', 'i', 'u']
  },
    all: {
    expand: true,
    cwd: 'source/',
    ext: '.html',
    src: ['*.html'],
    dest: 'pretty/'
  }
  },
    htmlmin: {
      dist: {
        options: {
          removeComments: true,
          collapseWhitespace: true,
		  minifyJS: true,
		  minifyCSS: true
        },
        files: [{
			expand: true,     // Enable dynamic expansion.
      cwd: 'source/',      // Src matches are relative to this path.
      src: ['*.html','views/*.html'], // Actual pattern(s) to match.
      dest: 'deploy/',   // Destination path prefix.
      ext: '.html',   // Dest filepaths will have this extension.
      extDot: 'first'   // Extensions in filenames begin after the first dot

        }]
      }
    },
	uglify: {
    dist: {
      files: [{
          expand: true,
          cwd: 'source/',
          src: ['js/*.js','views/js/*.js'],
          dest: 'deploy/'
      }]
    },
	pretty: {
		options: {
			beautify: true
		},
		files: [{
          expand: true,
          cwd: 'source/js',
          src: '*.js',
          dest: 'pretty/js'
      }]
	}
  },
  cssmin: {
  dist: {
    files: [{
      expand: true,
      cwd: 'source/',
      src: ['css/*.css','views/css/*.css', '!*.min.css'],
      dest: 'deploy/',
      ext: '.css'
    }]
  }
},

	jsdoc : {
        dist : {
            src: ['src/*.js'],
            options: {
                destination: 'doc'
            }
        }
    },

	
	copy: {
  main: {
    expand: true,
    cwd: 'source/',
    src: ['img/**','data/**'],
    dest: 'deploy/',
    flatten: false,
    filter: 'isFile',
  },
},
  });
  

  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-prettify');
  grunt.loadNpmTasks('grunt-contrib-htmlmin');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-cssmin');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-jsdoc');
  grunt.registerTask('default', ['jshint:all','htmlmin:dist','uglify:dist','cssmin:dist','copy:main','jsdoc:dist']);
};