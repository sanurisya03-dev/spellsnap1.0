"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, Star, TrendingUp, Trophy, Calendar, BookOpen, Loader2, Cloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useGameStore } from "@/lib/game-store";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

export default function StatsPage() {
  const router = useRouter();
  const { stats, isLoaded } = useGameStore();

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6 md:p-12 relative">
      <div className="bg-animate">
        <Cloud className="floating-element text-primary/10" size={150} style={{ top: '10%', right: '10%' }} />
        <Star className="floating-element text-yellow-400/20" size={60} style={{ bottom: '20%', left: '5%' }} />
      </div>

      <div className="max-w-4xl mx-auto space-y-10 z-10 relative">
        <header className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push("/")} className="btn-bouncy bg-white shadow-sm h-12 w-12">
            <ArrowLeft className="h-6 w-6" />
          </Button>
          <div>
            <h1 className="text-4xl font-black text-foreground tracking-tighter">My <span className="text-primary">Stickers!</span></h1>
            <p className="text-muted-foreground font-bold">See all the cool things you've achieved!</p>
          </div>
        </header>

        <main className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <Card className="rounded-[3rem] bg-primary/10 border-4 border-white shadow-2xl relative overflow-hidden">
              <CardContent className="p-10 text-center space-y-4">
                <div className="bg-white p-6 rounded-full shadow-xl inline-block border-4 border-primary/10">
                  <Star className="h-16 w-16 text-primary fill-primary animate-pulse" />
                </div>
                <div>
                  <p className="text-sm font-black text-primary uppercase tracking-widest">Total Stars</p>
                  <h2 className="text-7xl font-black text-foreground">{stats.stars}</h2>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-2 gap-4">
               <Card className="rounded-[2.5rem] border-4 border-white bg-white/50 backdrop-blur-sm shadow-xl">
                  <CardContent className="p-6 text-center space-y-2">
                     <div className="bg-secondary/10 w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-2 border-2 border-secondary/10">
                        <BookOpen className="text-secondary" />
                     </div>
                     <p className="text-[10px] font-black text-muted-foreground uppercase">Words Spelled</p>
                     <p className="text-4xl font-black text-secondary">{stats.wordsMastered}</p>
                  </CardContent>
               </Card>
               <Card className="rounded-[2.5rem] border-4 border-white bg-white/50 backdrop-blur-sm shadow-xl">
                  <CardContent className="p-6 text-center space-y-2">
                     <div className="bg-primary/10 w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-2 border-2 border-primary/10">
                        <TrendingUp className="text-primary" />
                     </div>
                     <p className="text-[10px] font-black text-muted-foreground uppercase">Letters Snapped</p>
                     <p className="text-4xl font-black text-primary">{stats.correctLetters}</p>
                  </CardContent>
               </Card>
            </div>
          </div>

          <div className="space-y-6">
             <h3 className="text-2xl font-black px-4">My Skills</h3>
             <div className="space-y-4">
                {[
                  { label: "Beginner", progress: Math.min(100, (stats.wordsMastered / 10) * 100), color: "bg-primary" },
                  { label: "Explorer", progress: Math.min(100, (stats.wordsMastered / 25) * 100), color: "bg-orange-400" },
                  { label: "Wizard", progress: Math.min(100, (stats.wordsMastered / 50) * 100), color: "bg-secondary" }
                ].map((lvl, i) => (
                  <Card key={i} className="rounded-3xl border-4 border-white bg-white/50 backdrop-blur-sm shadow-lg">
                     <CardContent className="p-6 space-y-4">
                        <div className="flex justify-between items-end">
                           <span className="text-xl font-black">{lvl.label}</span>
                           <span className="text-sm font-bold text-muted-foreground">{Math.round(lvl.progress)}%</span>
                        </div>
                        <Progress value={lvl.progress} className="h-4 bg-muted/30">
                           <div className={cn("h-full transition-all rounded-full", lvl.color)} style={{ width: `${lvl.progress}%` }} />
                        </Progress>
                     </CardContent>
                  </Card>
                ))}
             </div>
             
             <Card className="rounded-3xl bg-secondary/10 border-4 border-white shadow-lg">
                <CardContent className="p-6 flex items-center gap-4">
                   <div className="bg-white p-3 rounded-2xl shadow-sm border-2 border-secondary/10">
                      <Trophy className="text-secondary" />
                   </div>
                   <div>
                      <p className="text-lg font-black leading-none">Keep Snapping!</p>
                      <p className="text-sm text-muted-foreground font-medium">Every word you spell makes you smarter!</p>
                   </div>
                </CardContent>
             </Card>
          </div>
        </main>

        <footer className="pt-8 text-center">
           <Button onClick={() => router.push("/")} className="btn-bouncy px-16 py-8 text-2xl h-auto bg-primary text-white">
              Ready for More?
           </Button>
        </footer>
      </div>
    </div>
  );
}
