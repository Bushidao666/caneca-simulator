import { useState } from "react";
import MugGLBViewer from "./MugGLBViewer";
import Modal from "./Modal";
import { Trash2 } from "lucide-react";

export default function MugGrid({ mugs, editable = false, onUpdate, onRemove }) {
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
            <div onClick={() => setOpenId(mug.id)} style={{ cursor: "pointer" }}>
              <div onClick={(e) => e.stopPropagation()}>
                <MugGLBViewer color={mug.color} texture={mug.texture} onChange={(patch) => editable && onUpdate && onUpdate(mug.id, patch)} editable={editable} />
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
            <MugGLBViewer color={openMug.color} texture={openMug.texture} editable={false} />
          </div>
        ) : null}
      </Modal>
    </div>
  );
}

