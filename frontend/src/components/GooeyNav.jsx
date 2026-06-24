import { useRef, useState, useLayoutEffect } from 'react';

const GooeyNav = ({ items = [], onNavigate }) => {
  const [active, setActive] = useState(0);
  const [bgStyle, setBgStyle] = useState({});
  const btnRefs = useRef([]);
  const wrapRef = useRef(null);

  useLayoutEffect(() => {
    const el = btnRefs.current[active];
    const wrap = wrapRef.current;
    if (!el || !wrap) return;
    const wRect = wrap.getBoundingClientRect();
    const eRect = el.getBoundingClientRect();
    setBgStyle({ left: eRect.left - wRect.left, width: eRect.width });
  }, [active]);

  const handleClick = (i, item) => {
    setActive(i);
    onNavigate && onNavigate(item);
  };

  return (
    <div className="gooey-nav-wrap" ref={wrapRef}>
      <div className="gooey-nav-bg" style={bgStyle} />
      {items.map((item, i) => (
        <button
          key={i}
          ref={(el) => (btnRefs.current[i] = el)}
          className={`gooey-nav-btn${active === i ? ' active' : ''}`}
          onClick={() => handleClick(i, item)}
        >
          {item.icon && <span style={{ fontSize: 14 }}>{item.icon}</span>}
          {item.label}
        </button>
      ))}
    </div>
  );
};
export default GooeyNav;
