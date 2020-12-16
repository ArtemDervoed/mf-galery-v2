/* eslint-disable */
import * as PIXI from 'pixi.js';
import normalizeWheel from 'normalize-wheel';
import gsap from 'gsap';
import {hotGirls} from './hotGirls';
import {BulgePinchFilter} from '@pixi/filter-bulge-pinch';

window.PIXI = PIXI

const map = (num, in_min, in_max, out_min, out_max) => {
  console.log(num, in_min, in_max, out_min, out_max);
  return ((num - in_min) * (out_max - out_min)) / (in_max - in_min) + out_min
 }

export default class Renderer3D {
  constructor(dom) {
    this.dom = dom;
    this.loadingScreenLoader = new PIXI.Loader();
    this.sprites = [];

    this.rw = 0;
    this.rh = 0;

    this.app = new PIXI.Application({
      width: window.innerWidth,
      height: window.innerHeight,
      resizeTo: this.dom
    });

    this.mouse = { x: 0, y: 0 };

    // this.dom.addEventListener('wheel', this.handleWheel);

    this.scrolltargetX = 0;
    this.scrolltargetY = 0;

    this.currentScrollX = 0;
    this.currentScrollY = 0;

    this.scale = 1.1;
    this.oldscale = this.scale;

    this.cardWidth = 250;
    this.cardHeight = 350;

    this.countCardInRow = 12; // эта переменная всегда должна быть четная, иначе при переносе сетка не сойдеться
    this.countCardInCol = 7;

    this.vMargin = 80;
    this.hMargin = 80;

    this.wholewidth = this.countCardInRow * (this.cardWidth + this.vMargin);
    this.wholeheight = this.countCardInCol * (this.cardHeight + this.hMargin);
    this.dom.appendChild(this.app.view);
    
    this.mainContainer = new PIXI.Container();
    this.container = new PIXI.Container();
    this.mainContainer.addChild(this.container);
    this.bgFilter = new BulgePinchFilter()
    this.mainContainer.filters = [this.bgFilter];
    
    this.bgFilter.uniforms.radius = Math.max(window.innerWidth, window.innerHeight);
    this.bgFilter.uniforms.strength = 0;
    
    this.app.stage.addChild(this.mainContainer);
    // this.app.stage.addChild(this.rectangleContainer);

    this.dom.addEventListener('mousewheel', this.handleWheel);
    this.dom.addEventListener('mousedown', this.handleMouseDown);
    this.dom.addEventListener('mouseup', this.handleMouseUp);
    window.addEventListener('mouseover', this.handleMouseUp);

    // this.app.renderer.resizeTo(this.dom)

    this.app.renderer.backgroundColor = 0xFFFfFF;
    this.preload();
  }

  handleMouseMove = (e) => {
    const { width, height } = this.dom.getBoundingClientRect();
    const mouse = { x: 0, y: 0 };
    mouse.x = (e.clientX / width) * 2 - 1;
    mouse.y = -(e.clientY / height) * 2 + 1;

    const dx = -(this.mouse.x - mouse.x) * 400;
    const dy = (this.mouse.y - mouse.y) * 400;

    this.scrolltargetX = dx;
    this.scrolltargetY = dy;
    // this.container.children.forEach(s => {
    //   const cc = s.children[0];
    //   cc.position.x = this.calcPos(this.scrolltargetX, cc.x, this.wholewidth, this.cardWidth, this.vMargin);
    //   cc.position.y = this.calcPos(this.scrolltargetY, cc.y,this.wholeheight, this.cardHeight, this.hMargin);

    // });
    this.mouse = mouse;
  }

  handleMouseDown = (e) => {
    this.isDown = true;
    const { width, height } = this.dom.getBoundingClientRect();
    this.mouse.x = (e.clientX / width) * 2 - 1;
    this.mouse.y = -(e.clientY / height) * 2 + 1;
    gsap.to(this.bgFilter.uniforms, {
      duration: 0.5,
      strength: 0.5,
    })
    this.oldscale = this.scale;

    this.sprites.forEach(i => {
      const { scale } = i;
      gsap.to(scale, {
        duration: 0.5,
        x: 0.8,
        y: 0.8,
      })
    });
    window.addEventListener('mousemove', this.handleMouseMove);
  }

  handleMouseUp = () => {
    this.isDown = false;
    gsap.to(this.bgFilter.uniforms, {
      duration: 0.5,
      strength: 0,
    })
    gsap.to(this, {
      duration: 0.5,
      scrolltargetX: 0,
      scrolltargetY: 0,
    });

    this.sprites.forEach(i => {
      const {scale} = i;
      gsap.to(scale, {
        duration: 0.5,
        x: 1,
        y: 1,
      })
    });
    window.removeEventListener('mousemove', this.handleMouseMove);
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
    const grid = [];
    for (let coll = 0; coll < w; coll++) {
      console.log(coll);
      const tempRow = [];
      const x = coll * (this.cardWidth + this.vMargin);
      for (let row = 0; row < h; row++) {
        let y = row * this.cardHeight + row * this.hMargin;
        if (coll % 2 === 0) {
          y+= (this.cardHeight + this.hMargin) / 2;
        }
        const texture = PIXI.Texture.from(hotGirls[this.randomInt(0, hotGirls.length - 1)]);
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
        container.friction = this.randomInt(100, 500) / 500;
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
    hotGirls.forEach(item => {
      this.loadingScreenLoader.add(item, item);
    });

    this.loadingScreenLoader.load();
    this.loadingScreenLoader.onComplete.add(() => {
      this.createGrid(this.countCardInRow, this.countCardInCol);
      this.render();

      this.showCards();
    });
  };

  showCards = () => {
    this.sprites.forEach(i => {
      gsap.to(i, {
        alpha: 1,
        delay: i.fadeInDelay,
        duration: 2.5,
      })
    });
  }

  handleWheel = (e) => {
    const normalized = normalizeWheel(e);
    const { pixelY } = normalized;
    gsap.to(this, {
      scale: this.clamp(this.scale + pixelY / 1000, 0.7, 1.25),
      duration: 0.5,
    })
  }

  calcPos = (scroll, pos, whole, size, margin) => {

    let temp = (scroll + pos + whole + size + margin) % whole - size - margin;

    return temp;
  }

  render = () => {
    this.app.ticker.add(() => {
      // const sx = (this.currentScrollX - this.scrolltargetX);
      // const sy = (this.currentScrollY - this.scrolltargetY);
      
      this.container.children.forEach(s => {
        const cc = s.children[0];
        let currentContainerPOsitionZ = s.scale.x;
        currentContainerPOsitionZ += (this.scale - currentContainerPOsitionZ) * cc.friction;
        s.scale.x = currentContainerPOsitionZ;
        s.scale.y = currentContainerPOsitionZ;


        let currentContainerPOsitionY = this.currentScrollY;
        currentContainerPOsitionY += (this.scrolltargetY - currentContainerPOsitionY) * cc.friction;
        cc.position.y = this.calcPos(currentContainerPOsitionY, cc.y,this.wholeheight, this.cardHeight, this.hMargin);

        let currentContainerPOsitionX = this.currentScrollX;
        currentContainerPOsitionX += (this.scrolltargetX - currentContainerPOsitionX) * cc.friction;
        cc.position.x = this.calcPos(currentContainerPOsitionX, cc.x,this.wholewidth, this.cardWidth, this.vMargin);
      });
      this.currentScrollX = this.scrolltargetX;
      this.currentScrollY = this.scrolltargetY;
  });
  }
}