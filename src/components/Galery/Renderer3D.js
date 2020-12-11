/* eslint-disable */
import * as PIXI from 'pixi.js';
import normalizeWheel from 'normalize-wheel';
import gsap from 'gsap';
import {hotGirls} from './hotGirls';
import {BulgePinchFilter} from '@pixi/filter-bulge-pinch';

// import CoverImage from './Card';

window.PIXI = PIXI

const map = (num, in_min, in_max, out_min, out_max) => {
  return ((num - in_min) * (out_max - out_min)) / (in_max - in_min) + out_min
 }

export default class Renderer3D {
  constructor(dom) {
    this.dom = dom;
    this.loadingScreenLoader = new PIXI.Loader();
    this.textures = [];

    this.rw = 0;
    this.rh = 0;

    this.app = new PIXI.Application({
      width: window.innerWidth,
      height: window.innerHeight,
      resizeTo: this.dom
    });

    this.friction = 0.5;

    this.mouse = { x: 0, y: 0 };

    // this.dom.addEventListener('wheel', this.handleWheel);

    this.scrolltargetX = 0;
    this.scrolltargetY = 0;
    this.currentScrollX = 0;
    this.currentScrollY = 0;

    this.scale = 1;
    this.oldscale = this.scale;

    this.cardWidth = 250;
    this.cardHeight = 350;

    this.countCardInRow = 8;
    this.countCardInCol = 7;

    this.vMargin = 80;
    this.hMargin = 80;

    this.wholewidth = this.countCardInRow * (this.cardWidth + this.vMargin);
    this.wholeheight = this.countCardInCol * (this.cardHeight + this.hMargin);
    this.dom.appendChild(this.app.view);
    
    this.container = new PIXI.Container();
    this.rectangleContainer = new PIXI.Container();
    this.bgFilter = new BulgePinchFilter()
    this.container.filters = [this.bgFilter];
    
    this.bgFilter.uniforms.radius = Math.max(window.innerWidth, window.innerHeight);
    this.bgFilter.uniforms.strength = 0;
    
    this.app.stage.addChild(this.container);
    // this.app.stage.addChild(this.rectangleContainer);

    this.dom.addEventListener('wheel', this.handleWheel);
    this.dom.addEventListener('mousedown', this.handleMouseDown);
    this.dom.addEventListener('mouseup', this.handleMouseUp);
    window.addEventListener('mouseover', this.handleMouseUp);

    // this.app.renderer.resizeTo(this.dom)

    this.app.renderer.backgroundColor = 0xFFFfFF;
    this.preload();
  }

  handleMouseMove = (e) => {
    console.log('move');
    const { width, height } = this.dom.getBoundingClientRect();
    const mouse = { x: 0, y: 0 };
    mouse.x = (e.clientX / width) * 2 - 1;
    mouse.y = -(e.clientY / height) * 2 + 1;

    const dx = -(this.mouse.x - mouse.x) * 250;
    const dy = (this.mouse.y - mouse.y) * 250;

    this.scrolltargetX = dx;
    this.scrolltargetY = dy;
    this.mouse = mouse;
  }

  handleMouseDown = (e) => {
    console.log('down');
    this.isDown = true;
    const { width, height } = this.dom.getBoundingClientRect();
    this.mouse.x = (e.clientX / width) * 2 - 1;
    this.mouse.y = -(e.clientY / height) * 2 + 1;
    // gsap.to(this.bgFilter.uniforms, {
    //   duration: 0.5,
    //   strength: 0.5,
    // })
    // this.oldscale = this.scale;

    // gsap.to(this, {
    //   duration: 0.5,
    //   scale: this.oldscale * 0.7,
    // })

    // this.container.children.forEach(s => {
    //   gsap.to(s.scale, {
    //     duration: 0.5,
    //     x: s.origScaleX * this.scale * 0.5,
    //     y: s.origScaleY * this.scale * 0.5,
    //   })
    // })

    window.addEventListener('mousemove', this.handleMouseMove);
  }

  handleMouseUp = () => {
    this.isDown = false;
    // gsap.to(this.bgFilter.uniforms, {
    //   duration: 0.5,
    //   strength: 0,
    // })
    gsap.to(this, {
      duration: 0.5,
      scrolltargetX: 0,
      scrolltargetY: 0,
    });

    // gsap.to(this, {
    //   duration: 0.5,
    //   scale: this.oldscale,
      // y: s.origScaleY * this.scale,
    // })

    // this.container.children.forEach(s => {
    //   gsap.to(s.scale, {
    //     duration: 0.5,
    //     x: s.origScaleX * this.scale,
    //     y: s.origScaleY * this.scale,
    //   })
    // })
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
        // const wrapperContainer = new PIXI.Container();
        // wrapperContainer.addChild(container);
        container.addChild(spritecContainer);
        container.addChild(mask);
        tempRow.push(container);
        // container.pivot.set(container.width / 2, container.height / 2)
        this.container.addChild(container);
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
      // const graphics = new PIXI.Graphics();

      // Rectangle
      // this.rw = this.container.width;
      // this.rh = this.container.height;
      // graphics.beginFill(0xDE3249, 0.25);
      // graphics.drawRect(0, 0, this.rw, this.rh);
      // graphics.endFill();
      // this.rectangleContainer.addChild(graphics);
    
    this.render();
    });
  };



  handleWheel = (e) => {
    const normalized = normalizeWheel(e);
    const { pixelY } = normalized;
    gsap.to(this, {
      scale: this.clamp(this.scale + pixelY / 100, 0.1, 1),
      duration: 0.5,
    })
  }

  calcPos = (scroll, pos, whole, size, margin) => {

    let temp = (scroll + pos + whole + size + margin) % whole - size - margin;

    return temp;
  }

  render = () => {
    this.app.ticker.add(() => {
      const sx = (this.currentScrollX - this.scrolltargetX);
      const sy = (this.currentScrollY - this.scrolltargetY);
      this.currentScrollX -= sx * 0.1;
      this.currentScrollY -= sy * 0.1;

      this.container.children.forEach(s => {
        // console.log(s);
        s.position.x = this.calcPos(this.currentScrollX, s.x, this.wholewidth, this.cardWidth, this.vMargin);
        s.position.y = this.calcPos(this.currentScrollY, s.y,this.wholeheight, this.cardHeight, this.hMargin);
        s.scale.x = this.scale;// * s.origScaleX;
        s.scale.y = this.scale;// * s.origScaleY;
      });
  });
  }
}