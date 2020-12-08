import * as PIXI from 'pixi.js';

const jsImageCover = (image, innerWidth, innerHeight) => {
  if (!innerHeight) {
    const widthK = innerWidth / image.width;
    return {
      width: image.width * widthK,
      height: image.height * widthK,
    };
  }
  const screenAspect = innerWidth / innerHeight;
  const imageAspect = image.width / image.height;
  if (screenAspect > imageAspect) {
    return {
      width: innerWidth,
      height: (innerWidth / image.width) * image.height,
    };
  }
  return {
    width: (innerHeight / image.height) * image.width,
    height: innerHeight,
  };
};


export default class CoverImage {
  constructor(sprite, imageSettings) {
    this.imageSettings = imageSettings;
    this.sprite = sprite;

    this.mask = new PIXI.Graphics();

    this.sprite.mask = this.mask;
    this.sprite.anchor.set(0.5);

    this.onResize(imageSettings);
  }

  getPositions = () => ({
    x: this.imageSettings.x || 0,
    y: this.imageSettings.y || 0,
  })

  getSize = () => ({
    width: this.imageSettings.width || 0,
    height: this.imageSettings.height || 0,
  })

  getType = () => (
    this.imageSettings.type || 'cover'
  )

  getCurrentImageSize = () => {
    const { width, height } =  this.getSize();
    if (this.sprite.texture) {
      return jsImageCover(this.sprite.texture, width, height);
    }

    return {
      width,
      height,
    };
  }

  renderMask = () => {
    const { x, y } = this.getPositions();
    const { width, height } = this.getSize();

    this.mask.clear();
    this.mask.beginFill(0x8bc5ff);
    this.mask.drawRect(x, y, width, height);
    this.mask.endFill();
  }

  renderImage = () => {
    const { width: originW, height: originH } = this.getSize();
    const { width, height } =  this.getCurrentImageSize();
    const { x, y } = this.getPositions();

    this.sprite.x = x + (originW / 2);
    this.sprite.y = y + (originH / 2);
    this.sprite.width = width;
    this.sprite.height = height;
  }

  setTexture = texture => {
    this.sprite.texture = texture;
    this.renderImage();
  }

  onResize = (imageSettings) => {
    this.imageSettings = imageSettings;
    this.renderImage();
    this.renderMask();
  }
}
