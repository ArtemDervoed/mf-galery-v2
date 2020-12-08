/* eslint-disable */
import * as PIXI from 'pixi.js';
import normalizeWheel from 'normalize-wheel';
// import gsap from 'gsap';
import {hotGirls} from './hotGirls';

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
      height: window.innerHeight
    });

    this.friction = 0.5;

    this.dom.addEventListener('wheel', this.handleWheel);

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
    
    this.app.stage.addChild(this.container);
    this.app.stage.addChild(this.rectangleContainer);

    this.app.renderer.backgroundColor = 0xFFFfFF;
    this.preload();
  }

  randomInt = (min, max) => {
    return min + Math.floor((max - min) * Math.random());
  }

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
        // bunny.anchor.set(0.5);
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

  handleMouseMove = (event) => {

  }

  calcPos = (scroll, pos, whole, size) => {

    let temp = (scroll + pos + whole + size + 50) % whole - size - 50;

    return temp;
  }

  render = () => {
    this.app.ticker.add(() => {
      if (this.scrolltargetX === 1 || this.scrolltargetX === -1) { this.scrolltargetX = 0; }
      if (this.scrolltargetY === 1 || this.scrolltargetY === -1) { this.scrolltargetY = 0; }
      this.currentScrollX -= (this.currentScrollX - this.scrolltargetX) * 0.1;
      this.currentScrollY -= (this.currentScrollY - this.scrolltargetY) * 0.1;
      this.container.children.forEach(s => {
        s.position.x = this.calcPos(this.currentScrollX, s.position.x, this.wholewidth, this.cardWidth);
        s.position.y = this.calcPos(this.currentScrollY, s.position.y,this.wholeheight, this.cardHeight);
      });
  });
  }
}