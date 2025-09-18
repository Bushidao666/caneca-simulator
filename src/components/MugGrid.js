import { useState } from "react";
import MugGLBViewer from "./MugGLBViewer";
import Modal from "./Modal";
import { Trash2, Save } from "lucide-react";

export default function MugGrid({ mugs, editable = false, onUpdate, onRemove, onSave }) {
  const [openId, setOpenId] = useState(null);
  const openMug = mugs?.find((m) => m.id === openId);

  return (
    <div className="grid">
      {mugs && mugs.length ? (
        mugs.map((mug) => (
          <div key={mug.id} className="card">
            <div className="card-header">
              <input
                className="name-input"
                type="text"
                defaultValue={mug.name || `Caneca ${mug.id}`}
                disabled={!editable}
                onChange={(e) => editable && onUpdate && onUpdate(mug.id, { name: e.target.value })}
              />
              {editable ? (
                <button className="btn btn-danger" onClick={() => onRemove && onRemove(mug.id)}><Trash2 size={16} />Remover</button>
              ) : null}
            </div>
            {editable ? (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, padding: 12, borderBottom: "1px solid var(--border-color)", background: "var(--bg-tertiary)" }}>
                <div className="control-group">
                  <label>Repeat X</label>
                  <input type="number" step="0.1" defaultValue={mug.settings?.repeatX ?? 1} onChange={(e) => onUpdate && onUpdate(mug.id, { settings: { ...(mug.settings||{}), repeatX: parseFloat(e.target.value||"0") } })} />
                </div>
                <div className="control-group">
                  <label>Repeat Y</label>
                  <input type="number" step="0.1" defaultValue={mug.settings?.repeatY ?? 1} onChange={(e) => onUpdate && onUpdate(mug.id, { settings: { ...(mug.settings||{}), repeatY: parseFloat(e.target.value||"0") } })} />
                </div>
                <div className="control-group">
                  <label>Rotação (°)</label>
                  <input type="number" step="1" defaultValue={mug.settings?.rotation ?? 0} onChange={(e) => onUpdate && onUpdate(mug.id, { settings: { ...(mug.settings||{}), rotation: parseFloat(e.target.value||"0") } })} />
                </div>
                <div className="control-group">
                  <label>Offset X</label>
                  <input type="number" step="0.01" defaultValue={mug.settings?.offsetX ?? 0} onChange={(e) => onUpdate && onUpdate(mug.id, { settings: { ...(mug.settings||{}), offsetX: parseFloat(e.target.value||"0") } })} />
                </div>
                <div className="control-group">
                  <label>Offset Y</label>
                  <input type="number" step="0.01" defaultValue={mug.settings?.offsetY ?? 0} onChange={(e) => onUpdate && onUpdate(mug.id, { settings: { ...(mug.settings||{}), offsetY: parseFloat(e.target.value||"0") } })} />
                </div>
                <div className="control-group">
                  <label>Auto-rotate</label>
                  <input type="checkbox" defaultChecked={mug.settings?.autoRotate ?? true} onChange={(e) => onUpdate && onUpdate(mug.id, { settings: { ...(mug.settings||{}), autoRotate: e.target.checked } })} />
                </div>
                <div className="control-group">
                  <label>Velocidade</label>
                  <input type="number" step="0.1" defaultValue={mug.settings?.autoRotateSpeed ?? 1} onChange={(e) => onUpdate && onUpdate(mug.id, { settings: { ...(mug.settings||{}), autoRotateSpeed: parseFloat(e.target.value||"0") } })} />
                </div>
                <div className="control-group" style={{ gridColumn: "span 2" }}>
                  <label>Ambiente (HDR/Imagem URL)</label>
                  <input type="text" placeholder="https://.../studio.hdr" defaultValue={mug.settings?.envUrl ?? ""} onChange={(e) => onUpdate && onUpdate(mug.id, { settings: { ...(mug.settings||{}), envUrl: e.target.value } })} />
                </div>
                <div className="control-group" style={{ alignSelf: "end" }}>
                  <button className="btn btn-primary" onClick={() => onSave && onSave(mug)}>
                    <Save size={16} />Salvar
                  </button>
                </div>
              </div>
            ) : null}
            <div onClick={() => setOpenId(mug.id)} style={{ cursor: "pointer" }}>
              <div onClick={(e) => e.stopPropagation()}>
                <MugGLBViewer
                  color={mug.color}
                  texture={mug.texture}
                  settings={mug.settings}
                  onChange={(patch) => editable && onUpdate && onUpdate(mug.id, patch)}
                  editable={editable}
                />
              </div>
            </div>
          </div>
        ))
      ) : (
        <div className="empty">Nenhuma caneca configurada.</div>
      )}
      <Modal open={!!openId} onClose={() => setOpenId(null)} title={openMug?.name || "Visualizar caneca"}>
        {openMug ? (
          <div style={{ position: "absolute", inset: 0 }}>
            <MugGLBViewer color={openMug.color} texture={openMug.texture} settings={openMug.settings} editable={false} />
          </div>
        ) : null}
      </Modal>
    </div>
  );
}

