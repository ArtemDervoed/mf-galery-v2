import React from 'react';
import Renderer3D from './Renderer3D';
import './Galery.css'

const Galery = () => {
  const galeryRef = React.useRef(null);

  React.useEffect(() => {
    const ImgGalery = new Renderer3D(galeryRef.current);
    console.log(ImgGalery);
  }, [galeryRef])
  return <div className="root" ref={galeryRef} />
};

export default Galery;