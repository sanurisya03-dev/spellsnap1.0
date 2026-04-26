"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, Star, TrendingUp, Trophy, BookOpen, Loader2, Cloud } from "lucide-react";
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
    <div className="min-h-screen bg-background p-8 md:p-16 relative">
      <div className="bg-animate">
        <Cloud className="floating-element text-accent/15" size={200} style={{ top: '10%', right: '10%' }} />
        <Star className="floating-element text-primary/25" size={80} style={{ bottom: '20%', left: '5%' }} />
      </div>

      <div className="max-w-5xl mx-auto space-y-12 z-10 relative">
        <header className="flex items-center gap-6">
          <Button variant="ghost" size="icon" onClick={() => router.push("/")} className="btn-bouncy bg-white shadow-xl h-16 w-16 border-4 border-white">
            <ArrowLeft className="h-8 w-8" />
          </Button>
          <div>
            <h1 className="text-6xl font-black text-foreground tracking-tighter">My <span className="text-primary">Stickers!</span></h1>
            <p className="text-2xl font-bold text-muted-foreground">Look at all your amazing hard work!</p>
          </div>
        </header>

        <main className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div className="space-y-8">
            <Card className="rounded-[4rem] bg-primary/10 border-8 border-white shadow-3xl relative overflow-hidden">
              <CardContent className="p-16 text-center space-y-6">
                <div className="bg-white p-10 rounded-full shadow-2xl inline-block border-8 border-primary/10">
                  <Star className="h-24 w-24 text-primary fill-primary animate-pulse" />
                </div>
                <div>
                  <p className="text-lg font-black text-primary uppercase tracking-widest">Shiny Stars</p>
                  <h2 className="text-9xl font-black text-foreground">{stats.stars}</h2>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-2 gap-6">
               <Card className="rounded-[3rem] border-8 border-white bg-white/60 backdrop-blur-xl shadow-2xl">
                  <CardContent className="p-8 text-center space-y-4">
                     <div className="bg-secondary/15 w-16 h-16 rounded-[2rem] flex items-center justify-center mx-auto mb-2 border-4 border-secondary/10">
                        <BookOpen className="text-secondary h-8 w-8" />
                     </div>
                     <p className="text-xs font-black text-muted-foreground uppercase tracking-widest">Words Spelled</p>
                     <p className="text-5xl font-black text-secondary">{stats.wordsMastered}</p>
                  </CardContent>
               </Card>
               <Card className="rounded-[3rem] border-8 border-white bg-white/60 backdrop-blur-xl shadow-2xl">
                  <CardContent className="p-8 text-center space-y-4">
                     <div className="bg-primary/15 w-16 h-16 rounded-[2rem] flex items-center justify-center mx-auto mb-2 border-4 border-primary/10">
                        <TrendingUp className="text-primary h-8 w-8" />
                     </div>
                     <p className="text-xs font-black text-muted-foreground uppercase tracking-widest">Letters Snapped</p>
                     <p className="text-5xl font-black text-primary">{stats.correctLetters}</p>
                  </CardContent>
               </Card>
            </div>
          </div>

          <div className="space-y-8">
             <h3 className="text-4xl font-black px-6">My Skills</h3>
             <div className="space-y-6">
                {[
                  { label: "Beginner", progress: Math.min(100, (stats.wordsMastered / 10) * 100), color: "bg-primary" },
                  { label: "Explorer", progress: Math.min(100, (stats.wordsMastered / 25) * 100), color: "bg-accent" },
                  { label: "Wizard", progress: Math.min(100, (stats.wordsMastered / 50) * 100), color: "bg-secondary" }
                ].map((lvl, i) => (
                  <Card key={i} className="rounded-[3rem] border-8 border-white bg-white/60 backdrop-blur-xl shadow-2xl">
                     <CardContent className="p-8 space-y-6">
                        <div className="flex justify-between items-end">
                           <span className="text-3xl font-black">{lvl.label}</span>
                           <span className="text-xl font-bold text-muted-foreground">{Math.round(lvl.progress)}%</span>
                        </div>
                        <Progress value={lvl.progress} className="h-8 bg-muted/40 border-4 border-white">
                           <div className={cn("h-full transition-all rounded-full", lvl.color)} style={{ width: `${lvl.progress}%` }} />
                        </Progress>
                     </CardContent>
                  </Card>
                ))}
             </div>
             
             <Card className="rounded-[3rem] bg-secondary/10 border-8 border-white shadow-2xl overflow-hidden">
                <CardContent className="p-10 flex items-center gap-6">
                   <div className="bg-white p-5 rounded-[2rem] shadow-xl border-4 border-secondary/10">
                      <Trophy className="text-secondary h-10 w-10" />
                   </div>
                   <div>
                      <p className="text-2xl font-black leading-tight">Keep Going!</p>
                      <p className="text-lg text-muted-foreground font-bold">You are becoming a spelling wizard!</p>
                   </div>
                </CardContent>
             </Card>
          </div>
        </main>

        <footer className="pt-12 text-center">
           <Button onClick={() => router.push("/")} className="btn-bouncy px-24 py-10 text-3xl h-auto bg-primary text-white">
              Ready for More?
           </Button>
        </footer>
      </div>
    </div>
  );
}
