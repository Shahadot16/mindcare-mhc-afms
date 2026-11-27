import { useEffect, useRef, useState } from 'react';
import { cx } from '@/components/ui';

/*
  "picture-develops" moment (taste-skill, film look): the photograph waits as a faint grey print,
  then develops once as it scrolls into view, darks first, then colour, settling from a slight
  zoom over about 1.6 s. Under reduced motion, or when it is already on screen at load, it is
  simply the photograph.
*/
const PRINT = { filter: 'grayscale(1) contrast(.55) brightness(1.32)', transform: 'scale(1.06)' };

export default function DevelopPhoto({ className, imgClassName, alt, ...img }) {
  const frame = useRef(null);
  const [armed, setArmed] = useState(false);

  useEffect(() => {
    const el = frame.current;
    const pic = el?.querySelector('img');
    if (!el || !pic?.animate || !('IntersectionObserver' in window)) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (el.getBoundingClientRect().top < window.innerHeight * 0.85) return; // already visible: no wait

    setArmed(true);
    let anim;
    const io = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      io.disconnect();
      anim = pic.animate([
        { ...PRINT },
        { filter: 'grayscale(.8) contrast(.82) brightness(1.14)', offset: 0.3 },
        { filter: 'grayscale(.35) contrast(.95) brightness(1.04)', offset: 0.62 },
        { filter: 'grayscale(0) contrast(1) brightness(1)', transform: 'none' },
      ], { duration: 1600, easing: 'cubic-bezier(.3, .2, .3, 1)', fill: 'both' });
      setArmed(false);
      anim.onfinish = () => anim.cancel();
    }, { threshold: 0.35 });
    io.observe(el);
    return () => { io.disconnect(); anim?.cancel(); };
  }, []);

  return (
    <div ref={frame} className={cx('photo-frame relative isolate overflow-hidden', className)}>
      <img alt={alt} loading="lazy" decoding="async" {...img} style={armed ? PRINT : undefined}
        className={cx('size-full object-cover', imgClassName)} />
    </div>
  );
}
