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
/* $inline.line("./transitions/fadeTransition.js"); */

// Document Ready for first init
document.addEventListener('DOMContentLoaded', function() { 
  init();
});
