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
    errorOnUnusedConfig: false,
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
  },

  //
  // Favicon generator
  // 
  faviconDataFile: 'hugo/static/faviconData.json',
  faviconOptions: function(filename, generated_hash) {
    return {
      masterPicture: filename,
      dest: 'hugo/static',
      iconsPath: '/',
      design: {
        ios: {
          pictureAspect: 'backgroundAndMargin',
          backgroundColor: '#ffffff',
          margin: '14%',
          assets: {
            ios6AndPriorIcons: false,
            ios7AndLaterIcons: false,
            precomposedIcons: false,
            declareOnlyDefaultIcon: true
          }
        },
        desktopBrowser: {},
        windows: {
          pictureAspect: 'noChange',
          backgroundColor: '#da532c',
          onConflict: 'override',
          assets: {
            windows80Ie10Tile: false,
            windows10Ie11EdgeTiles: {
              small: false,
              medium: true,
              big: false,
              rectangle: false
            }
          }
        },
        androidChrome: {
          pictureAspect: 'backgroundAndMargin',
          margin: '17%',
          backgroundColor: '#ffffff',
          themeColor: '#ffffff',
          manifest: {
            display: 'standalone',
            orientation: 'notSet',
            onConflict: 'override',
            declared: true
          },
          assets: {
            legacyIcon: false,
            lowResolutionIcons: false
          }
        },
        safariPinnedTab: {
          pictureAspect: 'blackAndWhite',
          threshold: 75,
          themeColor: '#5bbad5'
        }
      },
      settings: {
        scalingAlgorithm: 'Mitchell',
        errorOnImageTooSmall: false,
        readmeFile: false,
        htmlCodeFile: false,
        usePathAsIs: false
      },
      versioning: {
        paramName: 'v',
        paramValue: generated_hash
      },
      markupFile: 'hugo/static/faviconData.json'
    }
  }
};
