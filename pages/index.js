import Link from "next/link";
import MugCarousel from "../src/components/MugCarousel";
import { apiListMugs } from "../src/storage/mugStorage";
import { useEffect, useState } from "react";
import { Trophy, Settings } from "lucide-react";

export default function HomePage() {
  const [mugs, setMugs] = useState([]);

  useEffect(() => {
    apiListMugs().then(setMugs).catch(() => setMugs([]));
  }, []);

  return (
    <div className="page">
      <header className="page-header">
        <h1><Trophy className="inline mr-2" size={32} />Simulador de Canecas</h1>
        <div className="header-actions">
          <Link className="btn" href="/admin"><Settings size={16} />Admin</Link>
        </div>
      </header>
      <main className="container">
        <MugCarousel mugs={mugs} />
      </main>
    </div>
  );
}

