import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { apiListMugs, apiCreateMug, apiUpdateMug, apiDeleteMug } from "../src/storage/mugStorage";
import MugGrid from "../src/components/MugGrid";
import { Settings, Plus, Home } from "lucide-react";

export default function AdminPage() {
  const [mugs, setMugs] = useState([]);

  useEffect(() => {
    apiListMugs().then(setMugs).catch(() => setMugs([]));
  }, []);

  const addMug = async () => {
    const name = `Caneca ${mugs.length + 1}`;
    try {
      const { list } = await apiCreateMug({ name, color: "#ffffff", texture: null });
      setMugs(list);
    } catch {}
  };

  const updateMug = async (id, patch) => {
    try {
      const { list } = await apiUpdateMug(id, patch);
      setMugs(list);
    } catch {}
  };

  const removeMug = async (id) => {
    try {
      const { list } = await apiDeleteMug(id);
      setMugs(list);
    } catch {}
  };

  return (
    <div className="page">
      <header className="page-header">
        <h1><Settings className="inline mr-2" size={28} />Admin • Canecas</h1>
        <div className="header-actions">
          <button className="btn btn-primary" onClick={addMug}><Plus size={16} />Adicionar caneca</button>
          <Link className="btn" href="/"><Home size={16} />Voltar</Link>
        </div>
      </header>
      <main className="container">
        <MugGrid
          mugs={mugs}
          editable
          onUpdate={updateMug}
          onRemove={removeMug}
          onSave={async (mug) => {
            // salva tudo que estiver no objeto atual (inclui settings e textura já processada)
            try {
              await apiUpdateMug(mug.id, { name: mug.name, color: mug.color, texture: mug.texture, settings: mug.settings });
            } catch {}
          }}
        />
      </main>
    </div>
  );
}

