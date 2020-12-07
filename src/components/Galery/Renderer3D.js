/* eslint-disable */
import * as THREE from 'three';
import normalizeWheel from 'normalize-wheel';
import {EffectComposer} from 'three/examples/jsm/postprocessing/EffectComposer.js';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls';
import {RenderPass} from 'three/examples/jsm/postprocessing/RenderPass.js'
// import {FilmPass} from 'three/examples/jsm/postprocessing/FilmPass.js';
import {ZoomShader} from './zoomShader';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import gsap from 'gsap';
import {hotGirls} from './hotGirls';

import Card from './Card';

const map = (num, in_min, in_max, out_min, out_max) => {
  return ((num - in_min) * (out_max - out_min)) / (in_max - in_min) + out_min
 }

export default class Renderer3D {
  constructor(dom) {
    this.dom = dom;
    this.textures = [];

    this.scale = 1;

    this.isZoomBehaviour = true;

    this.currentScrollZ = 0;
    this.currentScrollX = 0;
    this.currentScrollY = 0;

    this.direction = {
      x: null,
      y: null,
      dx: 0,
      dy: 0,
    }

    this.allCards = [];

    this.currentPageScrollY = 0;

    this.mouse = new THREE.Vector3(0, 0, 0)
    
    // Границы
    this.farPos = -1;
    this.nearPos = 3;
    
    this.finalPos = this.farPos;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 2000 );
    this.camera.position.z = 5;
    

    this.renderer = new THREE.WebGLRenderer();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    // this.renderer.setClearColorHex( 0xffffff, 1 );

    this.composer = new EffectComposer(this.renderer);
    this.renderPass = new RenderPass(this.scene, this.camera);
    this.composer.addPass(this.renderPass);

    this.colorPass = new ShaderPass(ZoomShader);
    this.colorPass.renderToScreen = true;
    this.composer.addPass(this.colorPass);
    dom.appendChild(this.renderer.domElement);

    // Координаты
    this.pos = new THREE.Vector3(0, 0, this.farPos);


    this.light = new THREE.AmbientLight( 0xffffff );
    this.scene.add(this.light);
    this.cardsGroup = new THREE.Group();
    this.scene.add(this.cardsGroup);
    this.scene.background = new THREE.Color( 0xffffff );

    this.cards = [];

    this.collsCount = 10;
    this.rowsCount = 5;

    this.vMargn = 1;
    this.hMargn = 1;

    this.cardHeight = 3;
    this.cardWidth = 2;

    this.vOffset = (this.cardHeight + this.vMargn) / 2;

    const planeWidth = (this.cardWidth + this.vMargn) * this.collsCount;
    const planeHeight = (this.cardHeight + this.hMargn) * this.rowsCount + this.vOffset * 2;

    this.geometry = new THREE.PlaneGeometry(planeWidth, planeHeight, 32 );
    this.material = new THREE.MeshBasicMaterial( {color: 0xffff00, side: THREE.DoubleSide} );
    this.plane = new THREE.Mesh(this.geometry, this.material);
    // this.scene.add(this.plane);

    this.controls = new OrbitControls( this.camera, this.renderer.domElement );

    const loadManager = new THREE.LoadingManager();
    const loader = new THREE.TextureLoader(loadManager);
    hotGirls.forEach(url => {
      this.textures.push(loader.load(url));
    });

    loadManager.onLoad = () => {
      const imgsCount = this.collsCount * this.rowsCount;
      let coll = [];
      for (let i = 0; i < imgsCount; i += 1) {
        const card = new Card(
          new THREE.Vector3(0, 0, this.pos.z),
          {
            width: this.cardWidth,
            height: this.cardHeight
          },
          this.textures[THREE.MathUtils.randInt(0, this.textures.length - 1)]
        );
        this.allCards.push(card);
        coll.push(card)
        // console.log(i % this.rowsCount);
        if (i % this.rowsCount === this.rowsCount - 1) {
          const collGroup = this.buildCol(coll);
          this.cardsGroup.add(collGroup);
          this.cards.push(collGroup);
          coll = [];
        }
        // this.scene.add(card.getCard());
      }
      this.setPosToColls(this.cards);
      this.setGroupOffsetToCenter();
    };
    // this.cardsGroup.computeBoundingBox();
    console.log(this.cardsGroup);
    this.dom.addEventListener('wheel', this.handleWheel);
    this.dom.addEventListener('mousedown', this.handleMouseDown);
    this.dom.addEventListener('mouseup', this.handleMouseUp);

    
    this.render();
  }

  buildCol = (images) => {
    const coll = new THREE.Group();
    images.forEach((c, i) => {
      let posY = i * (this.cardHeight + this.vMargn);
      c.plane.position.y = posY;
      coll.add(c.getCard());
    })
    return coll;
  }

  setPosToColls = (groups) => {
    groups.forEach((g, i) => {
      const posX = i * (this.cardWidth + this.hMargn);
      g.position.x = posX;
      if (i % 2 === 0) {
        g.position.y += this.vOffset
      }
    });
  }

  setGroupOffsetToCenter = () => {
    this.cardsGroup.position.x = -(this.collsCount - 1) * (this.cardWidth + this.hMargn) / 2;
    this.cardsGroup.position.y = -(this.rowsCount - 1) * (this.cardHeight + this.vMargn) / 2;;
  }

  handleWheel = (e) => {
    const normalized = normalizeWheel(e);
    const { pixelY, pixelX } = normalized;
    if (this.isZoomBehaviour) {
      this.currentScrollZ = THREE.MathUtils.clamp(this.currentScrollZ + pixelY, this.farPos, this.nearPos);
      const finalPos = THREE.MathUtils.lerp(this.farPos, this.nearPos, this.currentScrollZ / 250);
      
      gsap.to(this, {
        duration: 0.5,
        finalPos,
        overwrite: 5,
      })
    } else {
      this.allCards.forEach(c => {
        gsap.to(c.plane.position, {
          duration: 0.5,
          y: c.plane.position.y + pixelY,
          x: c.plane.position.x + -pixelX,
          overwrite: 5,
        })
      })
    }
  }

  handleMouseDown = (e) => {
    this.isDown = true;
    const { width, height } = this.dom.getBoundingClientRect();
    this.mouse.x = (event.clientX / width) * 2 - 1;
    this.mouse.y = -(event.clientY / height) * 2 + 1;
    gsap.to(this, {
      duration: 0.5,
      scale: 0.75,
    })
    gsap.to(this.colorPass.uniforms.uZoom, {
      duration: 0.5,
      value: 0.5,
    })
    this.dom.addEventListener('mousemove', this.handleMouseMove);
  }

  handleMouseUp = () => {
    this.isDown = false;
    gsap.to(this.colorPass.uniforms.uZoom, {
      duration: 0.5,
      value: 0,
    })
    gsap.to(this, {
      duration: 0.5,
      scale: 1,
    });
    this.direction.x = null;
    this.direction.y = null;
    this.direction.dx = 0;
    this.direction.dy = 0;
    this.dom.removeEventListener('mousemove', this.handleMouseMove);
  }

  handleMouseMove = (event) => {
    const { width, height } = this.dom.getBoundingClientRect();
    const mouse = new THREE.Vector2();
    mouse.x = (event.clientX / width) * 2 - 1;
    mouse.y = -(event.clientY / height) * 2 + 1;

    const dx = (this.mouse.x - mouse.x) * 250;
    const dy = (this.mouse.y - mouse.y) * 250;
    this.currentScrollX += dx;
    this.currentScrollY += dy;
    this.allCards.forEach(c => {
      c.pos.x += dx;
      c.pos.y += dy;
    });

    this.direction.x = dx < 0 ? 'right' : 'left';
    this.direction.y = dy < 0 ? 'up' : 'down';
    this.direction.dx = dx;
    this.direction.dy = dy;
    if (dx === 0) {
      this.direction.x = null;
    }

    if (dy === 0) {
      this.direction.y = null;
    }
    this.mouse = mouse;
  }

  animate = () => {
    
  }

  update = () => {
    // console.log(this.currentPageScrollY);
    this.scale = THREE.MathUtils.clamp(this.colorPass.uniforms.uZoom.value, 0, 0.25);
    // this.allCards.forEach(c => {
    //   c.update(this.pos);
    //   c.plane.scale.x = this.scale;
    //   c.plane.scale.y = this.scale;
    //   c.plane.scale.z = this.scale;
    // })
    this.pos.z = this.finalPos;
    this.pos.x = this.currentScrollX;
    this.pos.y = this.currentScrollY;
    
  }

  render = () => {
    // console.log(this.direction);
    this.animate();
    this.update();
    this.controls.update();
    requestAnimationFrame(this.render);
    // this.renderer.render(this.scene, this.camera);
    this.composer.render();
  }
}