/* eslint-disable */
import * as PIXI from 'pixi.js';
import normalizeWheel from 'normalize-wheel';
import gsap from 'gsap';
import {hotGirls} from './hotGirls';
import {BulgePinchFilter} from '@pixi/filter-bulge-pinch';

// import CoverImage from './Card';

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

    this.cardWidth = 150;
    this.cardHeight = 200;

    this.countCardInRow = 12;
    this.countCardInCol = 13;

    this.wholewidth = this.countCardInRow * (this.cardWidth + 50);
    this.wholeheight = this.countCardInCol * (this.cardHeight + 50);
    this.dom.appendChild(this.app.view);
    
    this.container = new PIXI.Container();
    this.rectangleContainer = new PIXI.Container();
    this.bgFilter = new BulgePinchFilter()
    this.container.filters = [this.bgFilter];
    

    console.log(this.bgFilter.uniforms);
    this.bgFilter.uniforms.radius = Math.max(window.innerWidth, window.innerHeight);
    this.bgFilter.uniforms.strength = 0;
    
    this.app.stage.addChild(this.container);
    this.app.stage.addChild(this.rectangleContainer);

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
    mouse.x = (event.clientX / width) * 2 - 1;
    mouse.y = -(event.clientY / height) * 2 + 1;

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
    this.mouse.x = (event.clientX / width) * 2 - 1;
    this.mouse.y = -(event.clientY / height) * 2 + 1;
    gsap.to(this.bgFilter.uniforms, {
      duration: 0.5,
      strength: 0.5,
    })

    this.container.children.forEach(s => {
      gsap.to(s.scale, {
        duration: 0.5,
        x: s.origScaleX * 0.8,
        y: s.origScaleY * 0.8,
      })
    })

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

    this.container.children.forEach(s => {
      gsap.to(s.scale, {
        duration: 0.5,
        x: s.origScaleX,
        y: s.origScaleY,
      })
    })
    // this.direction.x = null;
    // this.direction.y = null;
    // this.direction.dx = 0;
    // this.direction.dy = 0;

    // this.scrolltargetX = 0;
    // this.scrolltargetY = 0;
    window.removeEventListener('mousemove', this.handleMouseMove);
  }

  randomInt = (min, max) => {
    return min + Math.floor((max - min) * Math.random());
  }

  clamp = (number, min, max) => {
    return Math.min(Math.max(number, min), max);
  };

  createGrid = (w, h) => {
    const grid = [];
    for (let coll = 0; coll < w; coll++) {
      const tempRow = [];
      const x = coll * (this.cardWidth + 50);
      for (let row = 0; row < h; row++) {
        let y = row * this.cardHeight + row * 50;
        if (coll % 2 === 0) {
          y+= (this.cardHeight + 50) / 2;
        }
        const texture = PIXI.Texture.from(hotGirls[this.randomInt(0, hotGirls.length - 1)]);
        const bunny = new PIXI.Sprite(texture);
        bunny.width = this.cardWidth;
        bunny.height = this.cardHeight;
        bunny.x = x;
        bunny.y = y;
        bunny.friction = this.clamp(Math.random(), 0.1, 0.5);
        bunny.anchor.set(0.5);
        bunny.origScaleX = bunny.scale.x;
        bunny.origScaleY = bunny.scale.y;
        tempRow.push(bunny);
        this.container.addChild(bunny);
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
    const { pixelY, pixelX } = normalized;

    this.scrolltargetX = pixelX;
    this.scrolltargetY = pixelY;

    this.container.children.forEach(s => {
    });
  }

  calcPos = (scroll, pos, whole, size) => {

    let temp = (scroll + pos + whole + size + 50) % whole - size - 50;

    return temp;
  }

  render = () => {
    this.app.ticker.add(() => {
      // if (this.scrolltargetX === 1 || this.scrolltargetX === -1) { this.scrolltargetX = 0; }
      // if (this.scrolltargetY === 1 || this.scrolltargetY === -1) { this.scrolltargetY = 0; }
      const sx = (this.currentScrollX - this.scrolltargetX);
      const sy = (this.currentScrollY - this.scrolltargetY);
      this.currentScrollX -= sx * 0.1;
      this.currentScrollY -= sy * 0.1;
      this.container.children.forEach(s => {
        // s.scale.set(s.scale.x + s.friction / 1000, s.scale.y + s.friction / 1000)
        s.position.x = this.calcPos(this.currentScrollX, s.position.x, this.wholewidth, this.cardWidth);
        s.position.y = this.calcPos(this.currentScrollY, s.position.y,this.wholeheight, this.cardHeight);
      });
  });
  }
}