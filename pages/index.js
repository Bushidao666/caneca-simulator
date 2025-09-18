import Link from "next/link";
import MugCarousel from "../src/components/MugCarousel";
import { useState } from "react";
import { Trophy, Settings } from "lucide-react";
import { ensureMugsTable, query } from "../src/lib/db";

export default function HomePage({ initialMugs = [] }) {
  const [mugs, setMugs] = useState(initialMugs);

  // Sem refetch no client: usamos somente dados do DB via SSR

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

export async function getServerSideProps() {
  try {
    await ensureMugsTable();
    const { rows } = await query("select * from mugs order by id asc");
    return { props: { initialMugs: rows } };
  } catch (e) {
    return { props: { initialMugs: [] } };
  }
}

