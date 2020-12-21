/* eslint-disable */
import * as PIXI from 'pixi.js';
import normalizeWheel from 'normalize-wheel';
import gsap from 'gsap';
import {debounce} from 'lodash';
import {BulgePinchFilter} from '@pixi/filter-bulge-pinch';


const cardWidth = 250;
const cardHeight = 350;

const vMargin = 40;
const hMargin = 40;

window.PIXI = PIXI

export default class Renderer3D {
  constructor(dom, images) {
    this.images = images;
    this.dom = dom;
    this.loadingScreenLoader = new PIXI.Loader();
    this.sprites = [];

    this.scaleCoef = this.calcGlobalScale();

    this.rw = 0;
    this.rh = 0;

    this.app = new PIXI.Application({
      width: window.innerWidth,
      height: window.innerHeight,
      resizeTo: window,
      backgroundColor: 0xFFFfFF,
      resolution: 1
    });

    this.mouse = { x: 0, y: 0 };
    this.oldMouse = {...this.mouse};
    this.isMousePressed = false;

    this.scrolltargetX = 0;
    this.scrolltargetY = 0;

    this.currentScrollX = 0;
    this.currentScrollY = 0;

    this.scale = 1.1;
    this.oldscale = this.scale;

    this.cardWidth = cardWidth * this.scaleCoef;
    this.cardHeight = cardHeight * this.scaleCoef;

    this.vMargin = vMargin * this.scaleCoef;
    this.hMargin = hMargin * this.scaleCoef;

    const { countInColl, countInRow } = this.calcCountCardsInCollRow(); 

    this.countCardInRow = countInRow; // эта переменная всегда должна быть четная, иначе при переносе сетка не сойдеться
    this.countCardInCol = countInColl;

    this.wholewidth = this.countCardInRow * (this.cardWidth + this.vMargin);
    this.wholeheight = this.countCardInCol * (this.cardHeight + this.hMargin);
    this.dom.appendChild(this.app.view);
    
    this.bgFilter = new BulgePinchFilter()
    this.bgFilter.uniforms.radius = Math.max(window.innerWidth, window.innerHeight);
    this.bgFilter.uniforms.strength = 0;

    this.dom.addEventListener('mousewheel', this.handleWheel);
    this.dom.addEventListener('mousedown', this.handleMouseDown);
    this.dom.addEventListener('mouseup', this.handleMouseUp);
    window.addEventListener('resize', this.handleresize);
    window.addEventListener('mouseover', this.handleMouseOver);
    window.addEventListener('mousemove', this.handleEaseMouseMove);
    window.addEventListener('mousemove', debounce(this.handleEaseMouseMove));
  
    this.preload();
  }

  calcGlobalScale = () => {
    return window.innerWidth / 1920;
  }

  calcCountCardsInCollRow = () => {
    let countInRow = Math.floor(window.innerWidth * 2 /(this.hMargin + this.cardWidth));
    let countInColl = Math.floor(window.innerHeight * 2 /(this.vMargin + this.cardHeight)) + 1;
    countInRow = countInRow % 2 === 0 ? countInRow : countInRow + 1;
    return { countInColl, countInRow };
  }

  destroy = () => {
    this.dom.removeEventListener('mousewheel', this.handleWheel);
    this.dom.removeEventListener('mousedown', this.handleMouseDown);
    this.dom.removeEventListener('mouseup', this.handleMouseUp);
    window.removeEventListener('mouseover', this.handleMouseOver);
    window.removeEventListener('mousemove', this.handleEaseMouseMove);
    window.removeEventListener('mousemove', debounce(this.handleEaseMouseMove));
    this.mainContainer.destroy();
  }

  handleresize = () => {
    this.destroy();
    this.scaleCoef = this.calcGlobalScale();
    this.cardWidth = cardWidth * this.scaleCoef;
    this.cardHeight = cardHeight * this.scaleCoef;

    this.vMargin = vMargin * this.scaleCoef;
    this.hMargin = hMargin * this.scaleCoef;
    const { countInColl, countInRow } = this.calcCountCardsInCollRow(); 
    this.countCardInRow = countInRow;
    this.countCardInCol = countInColl;
    this.wholewidth = this.countCardInRow * (this.cardWidth + this.vMargin);
    this.wholeheight = this.countCardInCol * (this.cardHeight + this.hMargin);
    this.createGrid(this.countCardInRow, this.countCardInCol);
    this.showCards(true);
    this.dom.addEventListener('mousewheel', this.handleWheel);
    this.dom.addEventListener('mousedown', this.handleMouseDown);
    this.dom.addEventListener('mouseup', this.handleMouseUp);
    window.addEventListener('mouseover', this.handleMouseOver);
    window.addEventListener('mousemove', this.handleEaseMouseMove);
    window.addEventListener('mousemove', debounce(this.handleEaseMouseMove));
  }

  handleEaseMouseMove = (e) => {
    const { width, height } = this.dom.getBoundingClientRect();
    const mouse = { x: 0, y: 0 };
    mouse.x = (e.clientX / width) * 2 - 1;
    mouse.y = -(e.clientY / height) * 2 + 1;

    const dx = -(this.mouse.x - mouse.x) * 100;
    const dy = (this.mouse.y - mouse.y) * 100;

    gsap.to(this, {
      duration: 0.75,
      scrolltargetX: dx,
      scrolltargetY: dy,
      overwrite: 5
    })

    this.mouse = mouse;
  }

  handleMouseMove = (e) => {
    const { width, height } = this.dom.getBoundingClientRect();
    const mouse = { x: 0, y: 0 };
    mouse.x = (e.clientX / width) * 2 - 1;
    mouse.y = -(e.clientY / height) * 2 + 1;

    const dx = -(this.mouse.x - mouse.x) * 1200 * this.scaleCoef;
    const dy = (this.mouse.y - mouse.y) * 1200 * this.scaleCoef;

    gsap.to(this, {
      duration: 0.75,
      scrolltargetX: dx,
      scrolltargetY: dy,
      overwrite: 5
    })

    this.mouse = mouse; 
  }

  handleMouseDown = (e) => {
    window.removeEventListener('mousemove', this.handleEaseMouseMove);
    window.removeEventListener('mousemove', debounce(this.handleEaseMouseMove));
    const { width, height } = this.dom.getBoundingClientRect();
    this.mouse.x = (e.clientX / width) * 2 - 1;
    this.mouse.y = -(e.clientY / height) * 2 + 1;
    gsap.to(this.bgFilter.uniforms, {
      duration: 0.75,
      strength: 0.5,
    })
    this.oldscale = this.scale;

    this.sprites.forEach(i => {
      const { scale } = i;
      gsap.to(scale, {
        duration: 0.75,
        x: 0.8,
        y: 0.8,
      })
    });
    window.addEventListener('mousemove', this.handleMouseMove);
  }

  handleMouseUp = () => {
    gsap.to(this.bgFilter.uniforms, {
      duration: 0.75,
      strength: 0,
      overwrite: 5
    })
    gsap.to(this, {
      duration: 0.75,
      scrolltargetX: 0,
      scrolltargetY: 0,
      overwrite: 5
    });

    this.sprites.forEach(i => {
      const {scale} = i;
      gsap.to(scale, {
        duration: 0.75,
        x: 1,
        y: 1,
        overwrite: 5
      })
    });
    window.removeEventListener('mousemove', this.handleMouseMove);
    window.addEventListener('mousemove', this.handleEaseMouseMove);
    window.addEventListener('mousemove', debounce(this.handleEaseMouseMove));
  }

  handleMouseOver = () => {
    this.isMousePressed = false;
    gsap.to(this.bgFilter.uniforms, {
      duration: 0.75,
      strength: 0,
    })
    gsap.to(this, {
      duration: 0.75,
      scrolltargetX: 0,
      scrolltargetY: 0,
      overwrite: 5
    });

    this.sprites.forEach(i => {
      const {scale} = i;
      gsap.to(scale, {
        duration: 0.75,
        x: 1,
        y: 1,
        overwrite: 5
      })
    });
    this.oldMouse = {...this.mouse}; 
    window.removeEventListener('mousemove', this.handleMouseMove);
  }


onDragStart = (event) => {
  this.handleMouseDown({ clientX: event.data.global.x, clientY: event.data.global.y});
}

onDragEnd = () => {
  this.handleMouseUp();
}

onDragMove = (e) => {
  this.handleMouseMove({ clientX: e.data.global.x, clientY: e.data.global.y });
}


  randomInt = (min, max) => {
    return min + Math.floor((max - min) * Math.random());
  }

  clamp = (number, min, max) => {
    return Math.min(Math.max(number, min), max);
  };

  calculate = (target, container, cover) => {
    var containerW = container.width || container.w;
    var containerH = container.height || container.h;
    var targetW = target.width || target.w;
    var targetH = target.height || target.h;
  
    var rw = containerW / targetW;
    var rh = containerH / targetH;
    var r;
  
    if (cover) {
      r = (rw > rh) ? rw : rh;
    } else {
      r = (rw < rh) ? rw : rh;
    }
  
    return {
      left: (containerW - targetW * r) >> 1,
      top: (containerH - targetH * r) >> 1,
      width: targetW * r,
      height: targetH * r,
      scale: r
    };
  }

  createGrid = (w, h) => {
    this.mainContainer = new PIXI.Container();
    this.container = new PIXI.Container();
    this.mainContainer.addChild(this.container);
    this.mainContainer.filters = [this.bgFilter];
    this.app.stage.addChild(this.mainContainer);
    this.mainContainer.interactive = true;
    this.mainContainer.on('touchstart', this.onDragStart)
      .on('touchend', this.onDragEnd)
      .on('touchendoutside', this.onDragEnd)
      .on('touchmove', this.onDragMove);

    const grid = [];
    for (let coll = 0; coll < w; coll++) {
      const tempRow = [];
      const x = coll * (this.cardWidth + this.vMargin);
      for (let row = 0; row < h; row++) {
        let y = row * this.cardHeight + row * this.hMargin;
        if (coll % 2 === 0) {
          y+= (this.cardHeight + this.hMargin) / 2;
        }
        const texture = PIXI.Texture.from(this.images[this.randomInt(0, this.images.length - 1)]);
        const bunny = new PIXI.Sprite(texture);
        const container = new PIXI.Container();
        const spritecContainer = new PIXI.Container();

        const mask = new PIXI.Sprite(PIXI.Texture.WHITE);
        mask.width = this.cardWidth;
        mask.height = this.cardHeight;
        bunny.mask = mask;

        bunny.mask.originagScale = {...bunny.mask.scale};

        bunny.anchor.set(0.5);
        bunny.position.set(
          texture.orig.width / 2,
          texture.orig.height / 2,
        );

        const img = {
          w: texture.orig.width,
          h: texture.orig.height,
        }

        const parent = {
          w: this.cardWidth,
          h: this.cardHeight,
        }

        const cover = this.calculate(img, parent, 'cover');

        spritecContainer.position.set(cover.left, cover.top);
        spritecContainer.scale.set(cover.scale, cover.scale);

        spritecContainer.addChild(bunny);
        container.x = x;
        container.y = y;
        container.fadeInDelay = this.randomInt(0, 1000) / 1000;
        const f = row % 2 === 0 && coll % 2 === 0 ? 100 : 1000;
        container.friction = this.randomInt(100, f) / f;
        container.swipeFriction = this.randomInt(0, f) / f;
        container.alpha = 0;

        this.sprites.push(container);

        container.addChild(spritecContainer);
        container.addChild(mask);

        const wrapContainer = new PIXI.Container();
        wrapContainer.addChild(container)
        wrapContainer.pivot.set(this.cardWidth * w / 2, this.cardHeight * h /2)
        wrapContainer.position.set(window.innerWidth / 2, window.innerHeight / 2)
        tempRow.push(container);
        this.container.addChild(wrapContainer);
      }
      grid.push(tempRow);
    }
    return grid;
  }


  preload = () => {
    this.images.forEach(item => {
      this.loadingScreenLoader.add(item, item);
    });

    this.loadingScreenLoader.load();
    this.loadingScreenLoader.onComplete.add(() => {
      this.createGrid(this.countCardInRow, this.countCardInCol);
      this.render();

      this.showCards();
    });
  };

  showCards = (showHard = false) => {
    if (showHard) {
      this.sprites.forEach(i => {
        i.alpha = 1;
      });
      this.scale = 0.75;
      this.oldscale = this.scale;
    } else {
      this.sprites.forEach(i => {
        gsap.to(i, {
          alpha: 1,
          delay: i.fadeInDelay,
          duration: 2.5,
          overwrite: 5
        })
      });
      gsap.fromTo(this, {
        scale: 0.75,
      }, {
        scale: 1.1,
        duration: 2.5,
        overwrite: 5,
        onUpdate: () => {
          this.oldscale = this.scale;
        },
      })
    }
  }

  hideCards = () => {
    this.sprites.forEach(i => {
      gsap.to(i, {
        alpha: 0,
        delay: i.fadeInDelay,
        duration: 2.5,
        overwrite: 5
      })
    });
  }

  handleWheel = (e) => {
    const normalized = normalizeWheel(e);
    const { pixelY } = normalized;
    gsap.to(this, {
      scale: this.clamp(this.scale + pixelY / 1000, 0.7, 1.25),
      duration: 0.75,
      overwrite: 5,
    })
  }

  calcPos = (scroll, pos, whole, size, margin) => {
    let temp = (scroll + pos + whole + size + margin) % whole - size - margin;
    return temp;
  }

  render = () => {
    this.app.ticker.add(() => {
      this.container.children.forEach(s => {
        const cc = s.children[0];
        let currentContainerPOsitionZ = s.scale.x;
        currentContainerPOsitionZ += (this.scale - currentContainerPOsitionZ) * cc.friction;
        s.scale.x = currentContainerPOsitionZ;
        s.scale.y = currentContainerPOsitionZ;


        let currentContainerPOsitionY = this.currentScrollY;
        currentContainerPOsitionY += (this.scrolltargetY - currentContainerPOsitionY) * cc.swipeFriction;
        cc.position.y = this.calcPos(currentContainerPOsitionY, cc.y,this.wholeheight, this.cardHeight, this.hMargin);

        let currentContainerPOsitionX = this.currentScrollX;
        currentContainerPOsitionX += (this.scrolltargetX - currentContainerPOsitionX) * cc.swipeFriction;
        cc.position.x = this.calcPos(currentContainerPOsitionX, cc.x,this.wholewidth, this.cardWidth, this.vMargin);
      });
      this.currentScrollX = this.scrolltargetX;
      this.currentScrollY = this.scrolltargetY;
    });
  }
}