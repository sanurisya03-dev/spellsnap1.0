"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, Star, TrendingUp, Trophy, Calendar, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useGameStore } from "@/lib/game-store";
import { Progress } from "@/components/ui/progress";

export default function StatsPage() {
  const router = useRouter();
  const { stats, isLoaded } = useGameStore();

  if (!isLoaded) return null;

  return (
    <div className="min-h-screen bg-background p-6 md:p-12 max-w-4xl mx-auto space-y-12">
      <header className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => router.push("/")} className="rounded-xl">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-black flex items-center gap-2">
            <TrendingUp className="text-primary" /> My Achievements
          </h1>
          <p className="text-muted-foreground">Track your journey to becoming a Spelling Master!</p>
        </div>
      </header>

      <main className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Main Stats */}
        <div className="grid grid-cols-1 gap-6">
          <Card className="rounded-[2.5rem] bg-primary/10 border-none overflow-hidden relative">
            <div className="absolute top-4 right-4 text-primary opacity-20 rotate-12">
               <Trophy size={120} />
            </div>
            <CardContent className="p-10 flex flex-col items-center justify-center text-center space-y-4">
              <div className="bg-white p-6 rounded-full shadow-lg">
                <Star className="h-16 w-16 text-primary fill-primary animate-pulse" />
              </div>
              <div>
                <p className="text-sm font-black text-primary uppercase tracking-widest">Total Stars</p>
                <h2 className="text-7xl font-black text-foreground">{stats.stars}</h2>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 gap-4">
             <Card className="rounded-3xl border-2 border-accent/20">
                <CardContent className="p-6 text-center space-y-2">
                   <div className="bg-accent/10 w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-2">
                      <BookOpen className="text-accent" />
                   </div>
                   <p className="text-xs font-bold text-muted-foreground uppercase">Words Spelled</p>
                   <p className="text-4xl font-black text-accent">{stats.wordsMastered}</p>
                </CardContent>
             </Card>
             <Card className="rounded-3xl border-2 border-primary/20">
                <CardContent className="p-6 text-center space-y-2">
                   <div className="bg-primary/10 w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-2">
                      <TrendingUp className="text-primary" />
                   </div>
                   <p className="text-xs font-bold text-muted-foreground uppercase">Letters Snapped</p>
                   <p className="text-4xl font-black text-primary">{stats.correctLetters}</p>
                </CardContent>
             </Card>
          </div>
        </div>

        {/* Level Progress */}
        <div className="space-y-6">
           <h3 className="text-2xl font-black px-2">Skill Levels</h3>
           <div className="space-y-4">
              {[
                { label: "Beginner", progress: Math.min(100, (stats.wordsMastered / 10) * 100), color: "bg-primary" },
                { label: "Intermediate", progress: Math.min(100, (stats.wordsMastered / 25) * 100), color: "bg-accent" },
                { label: "Advanced", progress: Math.min(100, (stats.wordsMastered / 50) * 100), color: "bg-foreground" }
              ].map((lvl, i) => (
                <Card key={i} className="rounded-3xl border-2 border-muted overflow-hidden">
                   <CardContent className="p-6 space-y-4">
                      <div className="flex justify-between items-end">
                         <span className="text-xl font-black">{lvl.label}</span>
                         <span className="text-sm font-bold text-muted-foreground">{Math.round(lvl.progress)}%</span>
                      </div>
                      <Progress value={lvl.progress} className={cn("h-4", lvl.color === "bg-primary" ? "bg-primary/10" : lvl.color === "bg-accent" ? "bg-accent/10" : "bg-foreground/10")}>
                         <div className={cn("h-full transition-all", lvl.color)} style={{ width: `${lvl.progress}%` }} />
                      </Progress>
                   </CardContent>
                </Card>
              ))}
           </div>
           
           <Card className="rounded-3xl bg-muted/30 border-none">
              <CardContent className="p-6 flex items-center gap-4">
                 <div className="bg-white p-3 rounded-2xl shadow-sm">
                    <Calendar className="text-muted-foreground" />
                 </div>
                 <div>
                    <p className="text-sm font-bold">Keep going!</p>
                    <p className="text-xs text-muted-foreground">Practice every day to sharpen your spelling memory.</p>
                 </div>
              </CardContent>
           </Card>
        </div>
      </main>

      <footer className="pt-8 text-center">
         <Button onClick={() => router.push("/")} className="px-12 py-8 text-2xl font-black rounded-2xl bg-primary hover:bg-primary/90 shadow-lg">
            Ready to earn more stars?
         </Button>
      </footer>
    </div>
  );
}