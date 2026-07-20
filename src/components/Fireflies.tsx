'use client';

import { useEffect, useState } from 'react';

interface FirefliesProps {
  quantity?: number;
  colors?: string[]; // Array of hex colors for the fireflies
}

export default function Fireflies({ 
  quantity = 20, 
  colors = ['#2dd4bf', '#eab308', '#a3e635'] // teal, gold, lime
}: FirefliesProps) {
  const [styleContent, setStyleContent] = useState('');
  const colorsStr = JSON.stringify(colors);

  useEffect(() => {
    let css = `
      .fireflies-container {
        position: absolute;
        inset: 0;
        overflow: hidden;
        z-index: 0;
        pointer-events: none;
      }
      .firefly-particle {
        position: absolute;
        left: 50%;
        top: 50%;
        width: 5px;
        height: 5px;
        margin: -2.5px 0 0 0px;
        pointer-events: none;
      }
      .firefly-particle::before,
      .firefly-particle::after {
        content: "";
        position: absolute;
        width: 100%;
        height: 100%;
        border-radius: 50%;
        transform-origin: -10vw;
      }
      .firefly-particle::before {
        background: rgba(0, 0, 0, 0.4);
        animation: drift ease alternate infinite;
      }
      .firefly-particle::after {
        opacity: 0;
        animation: drift ease alternate infinite, flash ease infinite;
      }
      @keyframes drift {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `;

    const stableColors = JSON.parse(colorsStr);
    for (let i = 1; i <= quantity; i++) {
      const color = stableColors[i % stableColors.length];
      const steps = 10;
      let moveKeyframes = `@keyframes move${i} {\n`;
      for (let step = 0; step <= steps; step++) {
        const pct = (step / steps) * 100;
        const x = Math.floor(Math.random() * 80 - 40); // -40vw to 40vw
        const y = Math.floor(Math.random() * 80 - 40); // -40vh to 40vh
        const scale = (Math.random() * 0.75 + 0.25).toFixed(2);
        moveKeyframes += `  ${pct}% { transform: translateX(${x}vw) translateY(${y}vh) scale(${scale}); }\n`;
      }
      moveKeyframes += `}\n`;

      let flashKeyframes = `@keyframes flash${i} {\n`;
      flashKeyframes += `  0%, 30%, 100% {\n`;
      flashKeyframes += `    opacity: 0;\n`;
      flashKeyframes += `    box-shadow: 0 0 0px 0px ${color};\n`;
      flashKeyframes += `  }\n`;
      flashKeyframes += `  5% {\n`;
      flashKeyframes += `    opacity: 0.9;\n`;
      flashKeyframes += `    box-shadow: 0 0 15px 4px ${color}, 0 0 5px 1px ${color};\n`;
      flashKeyframes += `  }\n`;
      flashKeyframes += `}\n`;

      css += moveKeyframes + flashKeyframes;

      const animDuration = Math.floor(Math.random() * 50 + 75); // 75s to 125s
      const driftDuration = Math.floor(Math.random() * 10 + 10); // 10s to 20s
      const flashDuration = Math.floor(Math.random() * 6000 + 4000); // 4s to 10s
      const flashDelay = Math.floor(Math.random() * 8000); // 0s to 8s

      css += `
        .firefly-particle:nth-of-type(${i}) {
          animation: move${i} ${animDuration}s alternate infinite ease-in-out;
        }
        .firefly-particle:nth-of-type(${i})::before {
          animation-duration: ${driftDuration}s;
        }
        .firefly-particle:nth-of-type(${i})::after {
          background: ${color};
          animation-duration: ${driftDuration}s, ${flashDuration}ms;
          animation-delay: 0ms, ${flashDelay}ms;
          animation-name: drift, flash${i};
        }
      `;
    }

    setStyleContent(css);
  }, [quantity, colorsStr]);

  if (!styleContent) return null;

  return (
    <div className="fireflies-container">
      <style dangerouslySetInnerHTML={{ __html: styleContent }} />
      {Array.from({ length: quantity }).map((_, i) => (
        <div key={i} className="firefly-particle" />
      ))}
    </div>
  );
}
