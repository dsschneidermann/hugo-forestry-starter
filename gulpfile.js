'use strict';

require('babel-polyfill');
var gulp = require('gulp');
var gulpLoadPlugins = require('gulp-load-plugins');
var del = require('del');
var lazypipe = require('lazypipe');
var sseries = require('stream-series');
var chalk = require('chalk');
var crypto = require('crypto');
var fs = require('fs');

var hashstore = require('gulp-hashstore');

// Auto load Gulp plugins
const plugins = gulpLoadPlugins({
  rename: {
    'gulp-util': 'gulpUtil',
    'gulp-inject': 'inject',
    'gulp-htmlmin': 'htmlmin',
    'gulp-htmltidy': 'htmltidy'
  }
});

//
// Import task configuration
var config = require('./config/config.js');
var dependencies = require('./config/dependencies.js');

//
// Copy dependencies
function copyDependenciesCss () {
  if (dependencies.css.length == 0)
    return gulp.src('.');
  return gulp.src(dependencies.css)
    .pipe(gulp.dest('hugo/static/styles_vendor/'));
}
function copyDependenciesJsHead () {
  if (dependencies.jsHead.length == 0)
    return gulp.src('.');
  return gulp.src(dependencies.jsHead)
  .pipe(gulp.dest('hugo/static/scripts_head/'));
}
function copyDependenciesJsFooter () {
  if (dependencies.jsFooter.length == 0)
    return gulp.src('.');
  return gulp.src(dependencies.jsFooter)
    .pipe(gulp.dest('hugo/static/scripts/'));
}

//
// Responsive images
// Generate different sized images for srcset
function imgResponsive() {
  return gulp.src('hugo/static/uploads/**/*.*')
    .pipe(plugins.filter(file => /\.(jpg|jpeg|png)$/i.test(file.path)))
    .pipe(plugins.rename(makeLowerCaseExt))
    .pipe(plugins.hashstore.sources(config.responsiveHashstore, {
        invalidateObject: [ config.responsiveOptions, config.responsiveGlobals ],
        outputPostfixes: Object.values(config.responsiveOptions).map(
          pattern => pattern.map(item => item.rename.suffix)).flatten()
      }))
    .pipe(plugins.responsive(config.responsiveOptions, config.responsiveGlobals))
    .pipe(gulp.dest('hugo/images-cache/'))
    .pipe(plugins.hashstore.results(config.responsiveHashstore));
}

//
// Optimize responsive images and copy to final location
function imgMinJpg () {
  return gulp.src(['src/images/**/*.*', 'hugo/images-cache/**/*.*'])
    .pipe(plugins.filter(file => /\.(jpg|jpeg|png)$/i.test(file.path)))
    .pipe(plugins.rename(makeLowerCaseExt))
    .pipe(plugins.hashstore.sources(config.imageminJpgHashstore, { logTree: false }))
    .pipe(plugins.imagemin({verbose: true}))
    .pipe(gulp.dest('hugo/static/images/'))
    .pipe(plugins.hashstore.results(config.imageminJpgHashstore));
}

//
// Optimize and copy svg or gif images to final destination
function imgMinGif () {
  return gulp.src(['src/images/**/*.*', 'hugo/images-cache/**/*.*'])
    .pipe(plugins.filter(file => /\.(gif|svg)$/i.test(file.path)))
    .pipe(plugins.rename(makeLowerCaseExt))
    .pipe(plugins.hashstore.sources(config.imageminGifHashstore, { logTree: false }))
    .pipe(plugins.imagemin({verbose: true}))
    .pipe(gulp.dest('hugo/static/images/'))
    .pipe(plugins.hashstore.results(config.imageminGifHashstore));
}

// Image output generation can be iffy unless lowercase extensions are used..
function makeLowerCaseExt (path) {
    path.extname = path.extname.toLowerCase();
}

// Generate favicon files. favicon.png is recommended to be 280 x 280px.
// It will run once to create the icons and then only when changes are
// made. Delete the hugo/static/faviconData.json file to force it.
gulp.task('generate-favicon', function(done) {
  var sha1sum = crypto.createHash('sha1');
  var filename = 'src/images/favicon.png';

  sha1sum.update(fs.readFileSync(filename));
  var generated_hash = sha1sum.digest('hex');
  
  if (fs.existsSync(config.faviconDataFile)) {
    var dataFile = JSON.parse(fs.readFileSync(config.faviconDataFile));
    if (dataFile.generated_hash === generated_hash) {
      console.log('Favicon files up-to-date for sha1: ' + generated_hash + '\n');
      return done();
    }
  }
  console.log('Generated sha1 for new favicon: ' + generated_hash + '\n');

  plugins.realFavicon.generateFavicon(config.faviconOptions(filename, generated_hash), function() {
    // Add generated_hash to details file
    var dataFile = JSON.parse(fs.readFileSync(config.faviconDataFile));
    dataFile["generated_hash"] = generated_hash;
    fs.writeFileSync(config.faviconDataFile, JSON.stringify(dataFile, null, 2));
    console.log("Generated new favicon files from " + chalk.underline("https://realfavicongenerator.net"));
    done();
  });
});

// Inject favicon links in the favicon html partial
gulp.task('inject-favicon', function() {
  fs.writeFileSync('hugo/layouts/partials/favicon.html', "");
	return gulp.src('hugo/layouts/partials/favicon.html')
		.pipe(plugins.realFavicon.injectFaviconMarkups(JSON.parse(fs.readFileSync(config.faviconDataFile)).favicon.html_code))
		.pipe(gulp.dest('hugo/layouts/partials'));
});

//
// CSS processing
function postCss () {
  return gulp.src('src/styles/*.{css,pcss}')
    .pipe(plugins.inlinerjs())
    .pipe(plugins.sourcemaps.init())
    .pipe(plugins.postcss(config.processors()))
    .pipe(plugins.rename({extname: '.css'}))
    .pipe(plugins.sourcemaps.write('.'))
    .pipe(gulp.dest('hugo/static/styles/'));
}

// CSS processing, minification
function minpostCss () {
  return gulp.src('src/styles/*.{css,pcss}')
    .pipe(plugins.inlinerjs())
    .pipe(plugins.sourcemaps.init())
    .pipe(plugins.postcss(config.minProcessors()))
    .pipe(plugins.rename({extname: '.min.css'}))
    .pipe(plugins.sourcemaps.write('.'))
    .pipe(gulp.dest('hugo/static/styles/'));
}

// Copy Vendor CSS into hugo/static
gulp.task('vendorStyles', () => {
  return gulp.src('src/styles_vendor/*.css', { since: gulp.lastRun('vendorStyles') })
    .pipe(gulp.dest('hugo/static/styles_vendor/'));
});

//
// Javascript processing

// Linting
// .eslintrc.json can be used by your editor (see README.md)
// eslint rules for js aimed at browser are in config/
let lintJs = lazypipe()
  .pipe(plugins.eslint, 'config/eslint.json')
  .pipe(plugins.eslint.format);

// dev js tasks
function scripts () {
  return gulp.src('src/scripts/*.js', { since: gulp.lastRun(scripts) })
    .pipe(lintJs())
    .pipe(plugins.inlinerjs())
    .pipe(gulp.dest('hugo/static/scripts/'));
}
function scriptsHead () {
  return gulp.src('src/scripts_head/*.js', { since: gulp.lastRun(scriptsHead) })
    .pipe(lintJs())
    .pipe(plugins.inlinerjs())
    .pipe(gulp.dest('hugo/static/scripts_head/'));
}

// Javascript minification and source mapping
// TODO Possibly add concatenation (not really needed when served via HTTP2)
let minJs = lazypipe()
  .pipe(plugins.sourcemaps.init)
  .pipe(plugins.uglify)
  .pipe(plugins.rename, {extname: '.min.js'})
  .pipe(plugins.sourcemaps.write, '.');

// stage and live js tasks
function minscripts () {
  return gulp.src('src/scripts/*.js')
    .pipe(minJs())
    .pipe(gulp.dest('hugo/static/scripts/'));
}
function minscriptsHead () {
  return gulp.src('src/scripts_head/*.js')
    .pipe(minJs())
    .pipe(gulp.dest('hugo/static/scripts_head/'));
}

// Modernizr
// Read custom config and generate a custom build , already minified
gulp.task('custoModernizr', () => {
  let exec = require('child_process').exec;
  let cmd = __dirname + '/node_modules/.bin/modernizr ';
  cmd += '-c ./config/modernizr-config.json ';
  cmd += '-d ./hugo/static/scripts_vendor/modernizr.custom.js';
  return exec(cmd, {encoding: 'utf-8'});
});

//
// Copy other assets like icons and txt files from src to hugo/static
gulp.task('copy', () => {
  return gulp.src('src/*', { since: gulp.lastRun('copy') })
    .pipe(gulp.dest('hugo/static/'));
});

//
// HTML templates
// Copy HTML templates from src/layouts to hugo/layouts
// We cant lint and minify here because of hugo specific code
function html () {
  return gulp.src('src/layouts/**/*.html', { since: gulp.lastRun(html) })
    .pipe(plugins.inlinerjs())
    .pipe(gulp.dest('hugo/layouts/'));
}

//
// Inject css and js into templates
function injectHead () {
  let modernizrPath = gulp.src('hugo/static/scripts_vendor/modernizr.custom.js', {read: false});
  let scriptsHead = gulp.src('hugo/static/scripts_head/*.js', {read: false});
  let projectCss = gulp.src('hugo/static/styles/*.css', {read: false});
  let vendorCss = gulp.src('hugo/static/styles_vendor/*.css', {read: false});
  
  return gulp.src('hugo/layouts/partials/head-meta.html')
  .pipe(plugins.inject(sseries(modernizrPath, scriptsHead),
  {transform: transformToHugoPaths, selfClosingTag: true, ignorePath: 'hugo/static/', name: 'head'}))
  .pipe(plugins.inject(sseries(vendorCss, projectCss),
  {transform: transformToHugoPaths, ignorePath: 'hugo/static/'}))
  .pipe(gulp.dest('hugo/layouts/partials/'));
}

function injectFoot () {
  let scriptsFooter = gulp.src('hugo/static/scripts/*.js', {read: false});
  
  return gulp.src('hugo/layouts/partials/footer-scripts.html')
    .pipe(plugins.inject(scriptsFooter,
      {transform: transformToHugoPaths, ignorePath: 'hugo/static/'}))
    .pipe(gulp.dest('hugo/layouts/partials/'));
}

function transformToHugoPaths(filepath) {
  if (filepath.slice(-3) === '.js') {
    return '<script src="{{ \"' + filepath + '\" | relURL }}"></script>';
  }
  if (filepath.slice(-4) === '.css') {  
    return '<link href="{{ \"' + filepath + '\" | relURL }}" rel="stylesheet" type="text/css">';
  }
  // Use the default transform as fallback:
  return inject.transform.apply(inject.transform, arguments);
}

//
// Hugo
// -D is buildDrafts
// -F is buildFuture
function hugo (status) {
  let exec = require('child_process').exec;
  let cmd = 'hugo --quiet --config=hugo/config.toml -s hugo/';
  if (status === 'stage') {
    cmd += ' -D -d published/stage/ --baseURL="' + config.hugoBaseUrl.stage + '"';
    console.log(chalk.green('hugo command: \n') + cmd + '\n');
  } else if (status === 'live') {
    cmd += ' -d published/live/ --baseURL="' + config.hugoBaseUrl.live + '"';
    console.log(chalk.green('hugo command: \n') + cmd + '\n');
  } else {
    cmd += ' -DF -d published/dev/ --baseURL="http://localhost:3000"';
    console.log(chalk.green('hugo command: \n') + cmd + '\n');
  }

  var child = exec(cmd, {encoding: 'utf-8'});

  var promise = promiseFromChildProcess(child);
  var output = function (data) {
    if (data.startsWith("'hugo' is not recognized")) {
      throw Error(data);
    }
    if (data.startsWith("ERROR")) {
      console.error(chalk.red(data));
    } else {
      console.log(data);
    }
  }
  child.stdout.on('data', output);
  child.stderr.on('data', output);

  return promise;
}

function promiseFromChildProcess(child) {
  return new Promise(function (exit, error) {
    child.addListener("error", error);
    child.addListener("exit", exit);
  });
}

gulp.task('hugoDev', () => {
  return Promise.all([ hugo() ]);
});

gulp.task('hugoStage', () => {
  return Promise.all([ hugo('stage') ]);
});

gulp.task('hugoLive', () => {
  return Promise.all([ hugo('live') ]);
});

//
// HTML linting & minification
gulp.task('htmlDev', () => {
  return gulp.src('hugo/published/dev/**/*.html', { since: gulp.lastRun('htmlDev') })
    .pipe(plugins.htmltidy(config.htmltidyOptions))
    .pipe(gulp.dest('hugo/published/dev/'));
});

gulp.task('htmlStage', () => {
  return gulp.src('hugo/published/stage/**/*.html')
    .pipe(plugins.htmltidy(config.htmltidyOptions))
    .pipe(plugins.htmlmin(config.htmlminOptions))
    .pipe(gulp.dest('hugo/published/stage/'));
});

gulp.task('htmlLive', () => {
  return gulp.src('hugo/published/live/**/*.html')
    .pipe(plugins.htmltidy(config.htmltidyOptions))
    .pipe(plugins.htmlmin(config.htmlminOptions))
    .pipe(gulp.dest('hugo/published/live/'));
});

//
// Cleaning
// Specific cleaning functions for dev/stage/live of hugo/published.
function cleanDev (done) {
  return del(['hugo/published/dev/'], done);
}
function cleanStage (done) {
  return del(['hugo/published/stage/'], done);
}
function cleanLive (done) {
  return del(['hugo/published/live/'], done);
}

// Clean any assets we output into hugo/static (except images)
function cleanStatic (done) {
  return del([
    'hugo/static/scripts/*',
    'hugo/static/scripts_head/*',
    'hugo/static/scripts_vendor/*',
    'hugo/static/styles/*',
    'hugo/static/styles_vendor/*'
  ], done);
}

// Clean any assets we output into hugo/layouts
function cleanLayouts (done) {
  return del(['hugo/layouts/**/*.html'], done);
}

// Clean final image files created during processing
function cleanImages (done) {
  return del([
    'hugo/static/images/*'
  ], done);
}

//
// Serve and sync

// Wrap browsersync reload
// This wrapper seems to be required to get around a bug, see recent comments on
// this issue https://github.com/BrowserSync/browser-sync/issues/711
function reload(done) {
  // return browserSync.reload(); switched to callback because some tasks don't
  // signal completion to gulp, example issues
  // https://github.com/BrowserSync/browser-sync/pull/987
  // https://github.com/BrowserSync/browser-sync/issues/1065
  browserSync.reload();
  done();
}

var browserSync;

// Watch files and serve with Browsersync
gulp.task('watcher', (done) => {
  browserSync = require('browser-sync').create();

  // Start a server
  browserSync.init({
    server: {
      baseDir: 'hugo/published/dev'
    }
  }, done());

  var addWatcher = function (globs, action) {
    var debounced = debounce(action, 100);
    gulp.watch(globs).on('add', debounced);
    gulp.watch(globs).on('change', debounced);
    gulp.watch(globs).on('unlink', debounced);
  }

  // Watch files for changes
  addWatcher('hugo/static/uploads/**/*', imgResponsive);
  addWatcher(['src/images/**/*', 'hugo/images-cache/**/*'], gulp.series(imgMinJpg, imgMinGif, 'hugoDev', 'htmlDev', reload));
  addWatcher('src/styles/*.{css,pcss}', gulp.series(postCss, injectHead, 'hugoDev', 'htmlDev', reload));
  addWatcher('src/styles/partials/*.{css,pcss}', gulp.series(postCss, injectHead, 'hugoDev', 'htmlDev', reload));
  addWatcher('src/styles_vendor/*.css', gulp.series('vendorStyles', injectHead, 'hugoDev', 'htmlDev', reload));
  addWatcher('src/*', gulp.series('copy', 'hugoDev', 'htmlDev', reload));
  addWatcher('config/modernizr-config.json', gulp.series('custoModernizr', injectHead, 'hugoDev', 'htmlDev', reload));
  addWatcher('src/scripts/**/*.js', gulp.series(scripts, injectFoot, 'hugoDev', 'htmlDev', reload));
  addWatcher('src/scripts_head/**/*.js', gulp.series(scriptsHead, injectHead, 'hugoDev', 'htmlDev', reload));
  addWatcher('src/layouts/**/*.html', gulp.series(html, injectHead, injectFoot, 'hugoDev', 'htmlDev', reload));
  addWatcher(['hugo/archetypes/**/*', 'hugo/content/**/*', 'hugo/data/**/*', 'hugo/config.*'], gulp.series('hugoDev', reload));
});

// Debounce helper
// Returns a function, that, as long as it continues to be invoked, will not
// be triggered. The function will be called after it stops being called for
// N milliseconds. If `immediate` is passed, trigger the function on the
// leading edge, instead of the trailing.
function debounce(func, wait, immediate) {
	var timeout;
	return function () {
		var context = this, args = arguments;
		var later = function () {
			timeout = null;
			if (!immediate) func.apply(context, args);
		};
		var callNow = immediate && !timeout;
		clearTimeout(timeout);
		timeout = setTimeout(later, wait);
		if (callNow) func.apply(context, args);
	};
};

//
// 'gulp' is the main development task, essentially dev + watch + browsersync
gulp.task('default',
    gulp.series(
    gulp.parallel(cleanStatic, cleanLayouts, cleanDev),
    gulp.series(cleanImages, imgResponsive, imgMinJpg, imgMinGif),
    gulp.parallel('custoModernizr', postCss, scripts, scriptsHead),
    gulp.parallel(copyDependenciesCss, copyDependenciesJsFooter,
      'copy', html, 'vendorStyles', gulp.series('generate-favicon', 'inject-favicon')),
    gulp.parallel(injectHead, injectFoot),
    'hugoDev',
    'htmlDev',
    'watcher'
  )
);
// 'gulp dev' a single run, hugo will generate pages for drafts and future posts
gulp.task('dev',
  gulp.series(
    gulp.parallel(cleanStatic, cleanLayouts, cleanDev),
    gulp.series(cleanImages, imgResponsive, imgMinJpg, imgMinGif),
    gulp.parallel('custoModernizr', postCss, scripts, scriptsHead),
    gulp.parallel(copyDependenciesCss, copyDependenciesJsHead, copyDependenciesJsFooter,
      'copy', html, 'vendorStyles', gulp.series('generate-favicon', 'inject-favicon')),
    gulp.parallel(injectHead, injectFoot),
    'hugoDev',
    'htmlDev'
  )
);
// 'gulp stage' a single run, hugo will generate pages for drafts
gulp.task('stage',
  gulp.series(
    gulp.parallel(cleanStatic, cleanLayouts, cleanStage),
    gulp.series(cleanImages, imgResponsive, imgMinJpg, imgMinGif),
    gulp.parallel('custoModernizr', minpostCss, minscripts, minscriptsHead),
    gulp.parallel(copyDependenciesCss, copyDependenciesJsHead, copyDependenciesJsFooter,
      'copy', html, 'vendorStyles', gulp.series('generate-favicon', 'inject-favicon')),
    gulp.parallel(injectHead, injectFoot),
    'hugoStage',
    'htmlStage'
  )
);
// 'gulp live' a single run, production only
gulp.task('live',
  gulp.series(
    gulp.parallel(cleanStatic, cleanLayouts, cleanLive),
    gulp.series(cleanImages, imgResponsive, imgMinJpg, imgMinGif),
    gulp.parallel('custoModernizr', minpostCss, minscripts, minscriptsHead),
    gulp.parallel(copyDependenciesCss, copyDependenciesJsHead, copyDependenciesJsFooter,
      'copy', html, 'vendorStyles', gulp.series('generate-favicon', 'inject-favicon')),
    gulp.parallel(injectHead, injectFoot),
    'hugoLive',
    'htmlLive'
  )
);

// Task used for debugging function based task or tasks
gulp.task('dt', gulp.series(imgResponsive, imgMinGif, imgMinJpg));

// Same task as 'gulp live' for production only
// Optimized a bit to parallelize image processing
gulp.task('CircleCI-build',
  gulp.parallel(
    gulp.series(imgResponsive, imgMinJpg, imgMinGif),
    gulp.series(
      gulp.parallel(cleanStatic, cleanLayouts, cleanLive),
      // gulp.parallel('custoModernizr', minpostCss, minscripts, minscriptsHead), -- not working right now
      gulp.parallel('custoModernizr', minpostCss, scripts, scriptsHead),
      gulp.parallel(copyDependenciesCss, copyDependenciesJsHead, copyDependenciesJsFooter,
        'copy', html, 'vendorStyles', gulp.series('generate-favicon', 'inject-favicon')),
      gulp.parallel(injectHead, injectFoot),
      'htmlLive'
    )
  )
);
