import React from 'react';
import Renderer3D from './Renderer3D';
import {hotGirls} from './hotGirls';

// import { useSwipeable } from 'react-swipeable';
import './Galery.css'

const Galery = () => {
  // eslint-disable-next-line
  const galeryRef = React.useRef(null);
  // eslint-disable-next-line
  let galeryClass = React.useRef(null);

  React.useEffect(() => {
    // eslint-disable-next-line
    galeryClass = new Renderer3D(galeryRef.current, hotGirls);
  }, [galeryRef, galeryClass])
  return <div className="root" ref={galeryRef} />
};

export default Galery;