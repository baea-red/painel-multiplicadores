import { TopNav } from '@/components/layout/topnav'
import { BottomNav } from '@/components/layout/bottom-nav'
import { RouteGuard } from '@/components/layout/route-guard'

export default function PainelLayout({ children }: { children: React.ReactNode }) {
  return (
    <RouteGuard>
      <div className="min-h-screen flex flex-col bg-background">
        <TopNav />
        {/* pb-16 no mobile para não sobrepor o bottom nav */}
        <main className="flex-1 overflow-auto pb-16 md:pb-0">
          {children}
        </main>
        <BottomNav />
      </div>
    </RouteGuard>
  )
}
