import * as THREE from 'three';

const ZoomShader = {

  uniforms: {
    uZoom: { value: 0 },
    tDiffuse: { value: null },
    color:    { value: new THREE.Color(0x88CCFF) },
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1);
    }
  `,
  fragmentShader: `
    varying vec2 vUv;
    uniform sampler2D tDiffuse;
    uniform vec3 color;
    uniform float uZoom;
    void main() {
      vec2 coord = vUv;
      // float distance = clamp(length(coord - 0.5), 0.025, 1.) + 0.25;
      float distance = length(coord - 0.5) + 0.25;
      coord -= 0.5;
      coord *= distance;
      coord += 0.5;
      vec2 fcoord = mix(vUv, coord, uZoom);
      vec4 previousPassColor = texture2D(tDiffuse, fcoord);
      gl_FragColor = vec4(previousPassColor.rgb, previousPassColor.a);
      // gl_FragColor = vec4(distance);
    }
  `,

};

export { ZoomShader };