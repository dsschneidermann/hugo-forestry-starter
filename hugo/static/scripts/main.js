let initFunctions = [];

initFunctions.push(function () {
  class ResponsiveBackgroundImage {
    constructor(element) {
      this.element = element;
      this.img = element.querySelector('img');
      this.src = '';

      this.img.addEventListener('load', () => {
        this.update();
      });

      if (this.img.complete) {
        this.update();
      }
    }

    update() {
      let src = typeof this.img.currentSrc !== 'undefined' ? this.img.currentSrc : this.img.src;
      if (this.src !== src) {
        this.src = src;
        this.element.style.backgroundImage = 'url("' + this.src + '")';
      }
    }
  }

  let elements = document.querySelectorAll('[data-responsive-background-image]');
  for (let i = 0; i < elements.length; i++) {
    new ResponsiveBackgroundImage(elements[i]);
  }
});

initFunctions.push(function() {
  // Add no-hover to anchors that contain an image
  let elements = document.querySelectorAll('a > img');
  for (let i = 0; i < elements.length; i++) {
    elements[i].parentNode.classList.add('no-hover');
  }
});

let init = function() {
  for (let i = 0; i < initFunctions.length; i++) {
    initFunctions[i]();
  }
};

// Load page transition
var FadeTransition = Barba.BaseTransition.extend({
  start: function() {
    /**
     * This function is automatically called as soon the Transition starts
     * this.newContainerLoading is a Promise for the loading of the new container
     * (Barba.js also comes with an handy Promise polyfill!)
     */

    // As soon the loading is finished and the old page is faded out, let's fade the new page
    Promise
      .all([this.newContainerLoading, this.fadeOut()])
      .then(this.fadeIn.bind(this));
  },

  fadeOut: function() {
    /**
     * this.oldContainer is the HTMLElement of the old Container
     */

    return $(this.oldContainer).animate({ opacity: 0 }).promise();
  },

  fadeIn: function() {
    /**
     * this.newContainer is the HTMLElement of the new Container
     * At this stage newContainer is on the DOM (inside our #barba-container and with visibility: hidden)
     * Please note, newContainer is available just after newContainerLoading is resolved!
     */
    window.scrollTo(0,0);

    var _this = this;
    var $el = $(this.newContainer);

    $(this.oldContainer).hide();

    $el.css({
      visibility : 'visible',
      opacity : 0
    });

    $el.animate({ opacity: 1 }, 400, function() {
      /**
       * Do not forget to call .done() as soon your transition is finished!
       * .done() will automatically remove from the DOM the old Container
       */

      _this.done();
    });
  }
});

/**
 * Next step, you have to tell Barba to use the new Transition
 */

Barba.Pjax.getTransition = function() {
  /**
   * Here you can use your own logic!
   * For example you can use different Transition based on the current page or link...
   */

  return FadeTransition;
};

// Document Ready handler
document.addEventListener('DOMContentLoaded', function() {
  Barba.Pjax.start();
  Barba.Dispatcher.on('newPageReady', function(currentStatus, oldStatus, container) {    
    init();
  });
});


// Document Ready for first init
document.addEventListener('DOMContentLoaded', function() { 
  init();
});
