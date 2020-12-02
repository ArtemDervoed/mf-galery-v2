import * as THREE from 'three';
import SimplexNoise from 'simplex-noise';
// import { FaceNormalsHelper } from 'three/examples/jsm/helpers/FaceNormalsHelper.js';


export default class Card {
  constructor(pos, size, texture) {
    this.pos = pos;

    this.width = size.width;
    this.height = size.height;
    this.texture = texture;
    this.simplex = new SimplexNoise();
    const value2d = this.simplex.noise2D(this.pos.x, this.pos.y);

    // console.log(this.texture);

    this.friction = THREE.MathUtils.lerp(Math.abs(value2d), 0.25, 0.8); //THREE.MathUtils.randFloat(0.15, 0.5);
    const { x, y } = this.getUvRate(this.texture.image, this.width, this.height);
    this.uvRate = new THREE.Vector2(x, y);

    this.geometry = new THREE.PlaneGeometry(this.width, this.height, 32 );
    // this.material = new THREE.MeshPhongMaterial({ color: this.color || 0xff0000 } );
    this.material = new THREE.ShaderMaterial({
      uniforms: {
        uTexture: {
          value: this.texture,
        },
        uvRate: {
          type: 'v2',
          value: this.uvRate,
        },
        pixeles: {type: 'v2', value: new THREE.Vector2(this.width, this.height)},
      },
      vertexShader: `
      precision highp float;

      uniform vec2 uvRate;

      varying vec2 vUv;
      
      void main() {
        vUv = uv;
        vUv -= 0.5;
        vUv *= uvRate;
        vUv += 0.5;

        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0 );
      }
      `,
      fragmentShader: `
      precision highp float;

      uniform sampler2D uTexture;
      uniform vec2 pixeles;
      uniform vec2 uvRate;

      varying float vFrontShadow;
      varying vec2 vUv;
      
      void main()	{
        vec2 uv = gl_FragCoord.xy / pixeles.xy;
        vec4 tex1 = texture2D(uTexture ,vUv);
        gl_FragColor = tex1;
        // gl_FragColor = vec4(1., 0., 0., 1.);
      }
      `,
    });
    this.plane = new THREE.Mesh(this.geometry, this.material);
    // this.helper = new FaceNormalsHelper( this.plane, 2, 0x00ff00, 1 );
    this.plane.position.set(this.pos.x, this.pos.y, this.pos.z);
    this.raycaster = new THREE.Raycaster(this.plane.position);
    this.arrowHelper = new THREE.ArrowHelper(this.raycaster.ray.direction, this.plane.position, 50, 0x000000 );
  }

  getUvRate = (image, width, height) => {
    const wrapperAspect = width / height;
    const imageAspect = image.width / image.height;
  
    if (wrapperAspect > imageAspect) {
      const sizes = {
        width,
        height: (width / image.width) * image.height,
      };
      return { x: 1, y: (height / sizes.height) / (width / sizes.width) };
    }
    const sizes = {
      width: (height / image.height) * image.width,
      height,
    };
    const x = (width / sizes.width) / (height / sizes.height);
    return {x, y: 1};
  };

  setTargetPlane = (plane) => {
    this.rayTarget = plane;
  }

  // map = (in_min, in_max, out_min, out_max) => {
  //   return ((this - in_min) * (out_max - out_min)) / (in_max - in_min) + out_min
  //  }

  getCard = () => this.plane;

  getHelper = () => this.helper;

  animate = () => {
    
  }

  moveY = (delta) => {
    // let currentContainerPOsition = this.plane.position.y;
    // currentContainerPOsition += (delta - currentContainerPOsition) * this.friction;

    // this.pos.y = currentContainerPOsition;
    this.plane.position.y += delta;
  }

  update = (pos) => {
    let currentContainerPOsitionZ = this.plane.position.z;
    currentContainerPOsitionZ += (pos.z - currentContainerPOsitionZ) * this.friction;
    this.pos.z = currentContainerPOsitionZ;
    this.plane.position.z = this.pos.z;

    let currentContainerPOsitionY = this.plane.position.y;
    currentContainerPOsitionY += (this.pos.y - currentContainerPOsitionY) * this.friction;
    this.plane.position.y = currentContainerPOsitionY;

    let currentContainerPOsitionX = this.plane.position.x;
    currentContainerPOsitionX += (this.pos.x - currentContainerPOsitionX) * this.friction;
    this.plane.position.x = currentContainerPOsitionX;
    const intersects = this.raycaster.intersectObjects([this.rayTarget]);

    for ( let i = 0; i < intersects.length; i ++ ) {

      console.log(intersects[ i ]);
  
    }


    // let currentContainerPOsitionY = this.plane.position.y;
    // currentContainerPOsitionY += (pos.y - currentContainerPOsitionY) * this.friction;

    // this.pos.y = currentContainerPOsitionY;
    // this.plane.position.y = this.pos.y;
  }

  render = () => {

  }
}