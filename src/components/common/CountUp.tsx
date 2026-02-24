import React, { useEffect, useState } from 'react';

export default function CountUp({ target, suffix = '', duration = 900 }: { target: number; suffix?: string; duration?: number }) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    const start = performance.now();

    const tick = (time: number) => {
      const progress = Math.min(1, (time - start) / duration);
      setValue(Math.floor(target * progress));
      if (progress < 1) {
        requestAnimationFrame(tick);
      }
    };

    requestAnimationFrame(tick);
  }, [target, duration]);

  return (
    <span className="tabular-nums">
      {value}
      {suffix}
    </span>
  );
}
