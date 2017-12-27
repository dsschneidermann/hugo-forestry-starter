'use strict';

//
// Configuration variables that we're likely to modify are in this file

module.exports = {

  // Hugo is happiest with a 'baseurl' set. For dev runs http://localhost:3000
  // is set in Hugo's startup. It is also possible to use different values for
  // stage and production runs.
  // See Hugo docs: https://gohugo.io/overview/configuration/
  // Change Stage and Base Urls to the domains you're using
  hugoBaseUrl: {
    stage: 'http://',
    live: 'http://',
  },

  // Responsive image generation via gulp-responsive
  // Sizes here should match the img-srcset.html partial
  responsiveOptions: {
    '**/*': [{
      width: 320,
      rename: { suffix: '-320x' }
    }, {
      width: 640,
      rename: { suffix: '-640x' }
    }, {
      width: 1280,
      rename: { suffix: '-1280x' }
    }, {
      width: 1920,
      rename: { suffix: '-1920x' }
    }]
  },

  // Responsive global options
  responsiveGlobals: {
    quality: 86,
    progressive: true,
    withMetadata: false,
    withoutEnlargement: false,
    errorOnEnlargement: false,
  },

  //
  // PostCSS plugins and their options
  // For dev
  processors: [
    require('postcss-import')(),
    require('postcss-normalize')(),
    require('postcss-cssnext')(),
    require('colorguard')({ threshold: ['3'] }),
    require('postcss-wcag-contrast')({ compliance: 'AA' }),
    require('postcss-zindex')(),
    require('css-mqpacker')(),
    require('postcss-reporter')({
      clearReportedMessages: true,
      plugins: ['css-colorguard']
    })
  ],
  // For stage and live
  minProcessors: [
    require('postcss-import')(),
    require('postcss-normalize')(),
    require('postcss-cssnext')({ warnForDuplicates: false }),
    require('postcss-zindex')(),
    require('css-mqpacker')(),
    require('cssnano')(),
    require('postcss-reporter')()
  ],

  //
  // Javascript
  // Use config/eslint.json to configure javascript linting

  //
  // HTML
  // Linting with gulp-htmltidy
  htmltidyOptions: {
    doctype: 'html5',
    hideComments: true,
    indent: true,
    indentSpaces: 2
  },
  // Minification with gulp-htmlmin
  htmlminOptions: {
    collapseWhitespace: true,
    conservativeCollapse: true,
    preserveLineBreaks: true
  }

};
