## tallgrass - knockout and Google Maps

I had many ambitious goals for this project, but ended up settling for a reasonable demonstration of knockout and several other APIs/libraries. In particular, the goals which I met include:

1. Use knockout to implement MVVM webapp.
1. Implement a Google map with a KML layer and a path animation.
1. Retrieve data from a (technical) variety of sources - xml, plain text json, jsonp.
1. Use WebWorkers constructively.
1. Use the Promise API constructively.
1. Make a visually  reasonable single-page app.
1. Use jsdoc style to document code.
1. Follow what has become my programming induction theorem - if I can do something for 2 use cases, I can probably do it for n and n+1 use cases.

Future features include:

1. Use high resolution images of Mars to create a custom base map.
1. Create a custom projection to use those images.
1. Create a useful and appealing data mashup and analysis tool for Curiosity rover data.

If you were wondering - the rover is in Papua because the GPS coordinates of Papua correspond with Curiosity's location using Nasa's coordinate system on Mars.

### Installation

#### Build - requires node/npm and grunt
1. From inside project directory, run npm install. This should install all required grunt plugins.
1. From inside project directory, run grunt --force. This should read the files in source/ , run a jshint task on the javascript files in the source directory, minimize them where appropriate, place the minimized files and all data files in a deploy/ directory, and create doc/ with jsdoc website.
1. I haven't researched telling jshint and jsdoc to ignore particular error messages which is why the build instruction says to use --force switch. Specific errors I am ignoring include: != should be !==; img requires src (it has it through knockout); unnecessary trailing semicolon (sometimes needed after minimizing, never seems to be a problem).

#### Run
1. Requires a local web server - You have choices; I would recommend pointing the web server to the project directory so you have the option to point your browser to localhost/project/source as well as localhost/project/deploy as well as localhost/project/doc
1. Or browse to [gh-pages](http://aaronbutler.github.io/tallgrass/index.html) and use that as the launch point for everything you may want to run on this app.
1. Technically interesting searches include :222, :798, and :799
1. I effectively disabled logging; if you wish to see log entries you can call log = new Log(1) from Chrome console.

### Notes
1. Relevant code files in src/ directory are: index.html, css/main.css, js/*.js
1. I left index2, index3, index4, and tallgrass.js_ for future reference for myself; they probably don't run and should be ignored. I should have used git branching for experiments, live and learn.




