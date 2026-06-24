import { useRef } from 'react';

const SpotlightCard = ({ children, className = '', spotlightColor = 'rgba(124,58,237,0.18)', style = {} }) => {
  const divRef = useRef(null);
  const handleMouseMove = (e) => {
    const rect = divRef.current.getBoundingClientRect();
    divRef.current.style.setProperty('--mouse-x', `${e.clientX - rect.left}px`);
    divRef.current.style.setProperty('--mouse-y', `${e.clientY - rect.top}px`);
    divRef.current.style.setProperty('--spotlight-color', spotlightColor);
  };
  return (
    <div ref={divRef} onMouseMove={handleMouseMove} className={`card-spotlight ${className}`} style={style}>
      {children}
    </div>
  );
};
export default SpotlightCard;
