import React from 'react';
import Renderer3D from './Renderer3D';

// import { useSwipeable } from 'react-swipeable';
import './Galery.css'

const Galery = () => {
  const galeryRef = React.useRef(null);
  let galeryClass = React.useRef(null);

  React.useEffect(() => {
    galeryClass = new Renderer3D(galeryRef.current);
    console.log(galeryClass);
  }, [galeryRef])
  return <div className="root" ref={galeryRef} />
};

export default Galery;