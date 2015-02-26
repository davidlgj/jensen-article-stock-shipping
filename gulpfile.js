/* global require, process */

var gulp = require('gulp');
var templateCache = require('gulp-angular-templatecache');
var minifyHtml    = require('gulp-minify-html');
var uglify        = require('gulp-uglify');
var concat        = require('gulp-concat');
var fs            = require('fs');
var Q             = require('q');
var exec          = require('child_process').exec;
var path          = require('path');
var livereload    = require('gulp-livereload');
var jscsc         = require('gulp-jscs');
var jshint        = require('gulp-jshint');
var stylish       = require('jshint-stylish');
var remoteSrc     = require('gulp-remote-src');

/***** Scripts to be minified *****/
var scripts = [
  'src/module.js',
  'src/service.js',
  'bower_components/share-button/build/share.min.js',
  'src/directives/*',
];
/*********************************/

var exists = function(pth) {
  try {
    fs.statSync(pth);
  } catch (e) {
    return false;
  }
  return true;
};

/**
 * git clone or update a dependecy with git pull
 * Dependencies are placed in test/deps/
 * @param {String} name The name of the component
 * @value {String} value Version or URL to component
 * @return {Promise} a promise that resolves when everything is up to date.
 */
var updateDependency = function(name, value) {
  var deferred = Q.defer();

  console.log('Checking dependency ' + name);
  var pth = path.join(process.cwd(), 'test/deps/' + name);

  //Have we aldready cloned the repo?
  var cmd = 'git pull';
  var cwd = pth;
  if (!exists(pth)) {
    var url = 'http://git.diversity.io/textalk-webshop-native-components/' +
              name + '.git ';
    if (/^(https{0,1}:\/\/|\/\/|git).*/.test(value)) {
      url = value;
    }
    cmd = 'git clone ' + url;
    cwd = path.join(process.cwd(), 'test/deps/');
  }
  console.log(cmd, cwd);
  exec(
    cmd,
    {cwd: cwd},
    function(err) {
      if (err !== null) {
        deferred.reject();
      } else {
        deferred.resolve();
      }
    }
  );
  return deferred.promise;
};

/**
 * Clone or git pull all dependencies in diversity.json into test/deps/
 */
gulp.task('test-dependencies', function() {
  if (!exists('test/deps')) {
    fs.mkdirSync('test/deps');
  }

  var promises = [];

  //Load diversity-js
  promises.push(
    updateDependency(
      'diversity-js',
      'https://github.com/DiversityTemplating/diversity-js.git'
    )
  );

  //and jquery jsonrpc client
  promises.push(
    updateDependency(
      'jquery.jsonrpcclient.js',
      'https://github.com/Textalk/jquery.jsonrpcclient.js.git'
    )
  );

  var loadAndUpdate = function(pth) {
    var promises = [];
    var diversity = JSON.parse(fs.readFileSync(pth, 'UTF-8'));
    console.log('Load and update ', pth);
    if (!diversity.dependencies || Object.keys(diversity.dependencies) === 0) {
      //Return a promise that just resolves if there are no dependencies.
      return Q(true);
    }

    Object.keys(diversity.dependencies).forEach(function(name) {
      promises.push(updateDependency(name, diversity.dependencies[name])
      .then(function() {
        //After a component has been loaded we load all of it's dependencies
        //as well. This will probably issue a couple of "git pull" too much
        //but that's fast so it's ok
        return loadAndUpdate(
          path.join(
            process.cwd(),
            'test/deps/',
            name,
            'diversity.json'
          )
        );
      }));
    });

    return Q.all(promises);
  };

  promises.push(loadAndUpdate('diversity.json'));

  return Q.all(promises);
});

gulp.task('server', function(next) {
  var connect = require('connect');
  var port = process.env.PORT || 9000;
  var server = connect();
  server.use(connect.static(process.cwd())).listen(port, next);
  console.log('Server started on http://localhost:' +
              port + '/test/manual.html');
});

/**
 * Task to minify the HTML and set up a templatecache so they're availible
 */
gulp.task('templates', function() {
  return gulp.src('./templates/*.html')
      .pipe(minifyHtml({
        empty: true,
        spare: true,
        quotes: true
      }))
      .pipe(templateCache({
        module: 'twsArticleService',
        root: 'tws-article-service/templates/'
      }))
      .pipe(concat('templates.js'))
      .pipe(gulp.dest('.'));
});

gulp.task('watch', ['server'], function() {
  var server = livereload();
  server.changed();
  gulp.watch([
    './templates/*.html',
    'diversity.js',
    'po/**/*',
    'src/**/*',
    '*.html'
  ], ['minify']).on('change', function(file) {
    server.changed(file.path);
  });
});

/*
 TODO: example i18n

gulp.task('po2json',function(){
  gulp.src('./po/tws-checkout/sv.po')
      .pipe(po2json({ format: 'jed' }))
      .pipe(gulp.dest('./po/tws-checkout/'));
});
*/

gulp.task('jscs', function() {
  return gulp.src('src/**/*.js')
             .pipe(jscsc());
});

gulp.task('jshint', function() {
  return gulp.src('src/**/*.js')
             .pipe(jshint())
             .pipe(jshint.reporter(stylish));
});

gulp.task('minify-remotes', function() {

  // Split scripts into two distinct groups, local and remote
  var re = /^(https{0,1}:[/]{2}|[/]{2})/;

  var remotes = scripts.filter(function(src) {
    return re.test(src);
  });

  if (remotes.length > 0) {
    return remoteSrc(remotes, {base: ''})
    .pipe(concat('remotes.js'))
    .pipe(gulp.dest('./'));
  }
});

gulp.task('minify-js', ['minify-remotes', 'templates'], function() {

  // Split scripts into two distinct groups, local and remote
  var re = /^(https?:[/]{2}|[/]{2})/;

  var srcs = scripts.filter(function(src) {
    return !re.test(src);
  });

  return gulp.src(['./remotes.js'].concat(srcs).concat(['./templates.js']))
      .pipe(concat('scripts.min.js'))
      .pipe(uglify())
      .pipe(gulp.dest('./'));
});

gulp.task('minify-clean', ['minify-js'], function() {
  ['./remotes.js', './templates.js'].forEach(function(file) {
    if (fs.existsSync(file)) {
      fs.unlinkSync(file);
    }
  });
});

gulp.task('minify', ['minify-clean']);

gulp.task('default', ['test-dependencies', 'minify', 'watch']);
