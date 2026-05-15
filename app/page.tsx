import ParticipantPanel from "@/components/ParticipantPanel";
import GameCanvas from "@/components/GameCanvas";
import RankingPanel from "@/components/RankingPanel";
import Header from "@/components/Header";

export default function Home() {
  return (
    <main className="flex h-screen w-screen flex-col overflow-hidden bg-rink-bg">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        {/* 좌측 패널 */}
        <aside className="w-[300px] shrink-0 border-r border-rink-border bg-rink-surface/40 backdrop-blur">
          <ParticipantPanel />
        </aside>

        {/* 중앙 캔버스 */}
        <section className="flex flex-1 items-center justify-center bg-rink-bg">
          <GameCanvas />
        </section>

        {/* 우측 순위 패널 */}
        <aside className="w-[260px] shrink-0 border-l border-rink-border bg-rink-surface/40 backdrop-blur">
          <RankingPanel />
        </aside>
      </div>
    </main>
  );
}
