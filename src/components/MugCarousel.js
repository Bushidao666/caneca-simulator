import { useRef, useState } from "react";
import MugGLBViewer from "./MugGLBViewer";
import Modal from "./Modal";

export default function MugCarousel({ mugs }) {
  const [index, setIndex] = useState(0);
  const [open, setOpen] = useState(false);
  const downRef = useRef(null);
  const xRef = useRef(0);

  const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
  const prev = () => setIndex((i) => clamp(i - 1, 0, Math.max((mugs?.length || 1) - 1, 0)));
  const next = () => setIndex((i) => clamp(i + 1, 0, Math.max((mugs?.length || 1) - 1, 0)));

  const onDown = (e) => { downRef.current = true; xRef.current = (e.touches?.[0]?.clientX ?? e.clientX); };
  const onMove = (e) => {
    if (!downRef.current) return;
    const x = (e.touches?.[0]?.clientX ?? e.clientX);
    const dx = x - xRef.current;
    if (Math.abs(dx) > 40) {
      if (dx < 0) next(); else prev();
      downRef.current = false;
    }
  };
  const onUp = () => { downRef.current = false; };

  const mug = mugs?.[index];
  return (
    <div className="carousel" onMouseDown={onDown} onMouseMove={onMove} onMouseUp={onUp} onTouchStart={onDown} onTouchMove={onMove} onTouchEnd={onUp}>
      <button className="nav left" onClick={prev} disabled={index === 0}>{"<"}</button>
      <div className="slide" onClick={() => setOpen(true)}>
        {mug ? (
          <div className="slide-inner">
            <div className="slide-title">{mug.name}</div>
            <MugGLBViewer color={mug.color} texture={mug.texture} settings={mug.settings} />
          </div>
        ) : (
          <div className="empty">Nenhuma caneca disponível.</div>
        )}
      </div>
      <button className="nav right" onClick={next} disabled={index === Math.max((mugs?.length || 1) - 1, 0)}>{">"}</button>
      <div className="dots">
        {(mugs || []).map((_, i) => (
          <button key={i} className={"dot" + (i === index ? " active" : "")} onClick={() => setIndex(i)} />
        ))}
      </div>
      <Modal open={open} onClose={() => setOpen(false)} title={mug?.name || "Visualizar caneca"}>
        {mug ? (
          <div style={{ position: "absolute", inset: 0 }}>
            <MugGLBViewer color={mug.color} texture={mug.texture} settings={mug.settings} />
          </div>
        ) : null}
      </Modal>
    </div>
  );
}


