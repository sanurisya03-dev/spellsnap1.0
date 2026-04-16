"use client";

import Link from "next/link";
import { Sparkles, Play, Award, Settings, BookOpen, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useGameStore } from "@/lib/game-store";

export default function LobbyPage() {
  const { stats, isLoaded } = useGameStore();

  if (!isLoaded) return null;

  return (
    <div className="min-h-screen flex flex-col items-center p-6 md:p-12 space-y-8 max-w-5xl mx-auto">
      {/* Header section */}
      <header className="w-full flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="text-center md:text-left">
          <h1 className="text-5xl font-black text-accent tracking-tight flex items-center gap-2">
            SpellSnap! <Sparkles className="text-primary animate-pulse" />
          </h1>
          <p className="text-muted-foreground font-medium mt-1">A Digital Spelling Innovation</p>
        </div>

        <div className="flex items-center gap-4 bg-white p-3 rounded-2xl shadow-sm border border-primary/20">
          <div className="flex items-center gap-2">
            <div className="bg-primary/20 p-2 rounded-full">
              <Star className="text-primary fill-primary h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-bold text-muted-foreground uppercase">Stars</span>
              <span className="text-xl font-black">{stats.stars}</span>
            </div>
          </div>
          <div className="h-10 w-px bg-border mx-2" />
          <div className="flex items-center gap-2">
            <div className="bg-accent/20 p-2 rounded-full">
              <Award className="text-accent h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-bold text-muted-foreground uppercase">Words</span>
              <span className="text-xl font-black">{stats.wordsMastered}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Hero / Game Modes */}
      <main className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
        {/* Beginner */}
        <Card className="overflow-hidden border-2 border-transparent hover:border-primary transition-all group">
          <CardContent className="p-0">
            <div className="bg-primary/10 h-32 flex items-center justify-center">
              <Play className="h-16 w-16 text-primary group-hover:scale-110 transition-transform" />
            </div>
            <div className="p-6 text-center space-y-4">
              <h3 className="text-2xl font-bold">Beginner</h3>
              <p className="text-sm text-muted-foreground">Short words (3-4 letters) with visual hints and pre-filled letters.</p>
              <Link href="/game?difficulty=beginner" className="block w-full">
                <Button className="w-full rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold h-12">
                  Start Level 1
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Intermediate */}
        <Card className="overflow-hidden border-2 border-transparent hover:border-accent transition-all group">
          <CardContent className="p-0">
            <div className="bg-accent/10 h-32 flex items-center justify-center">
              <Award className="h-16 w-16 text-accent group-hover:scale-110 transition-transform" />
            </div>
            <div className="p-6 text-center space-y-4">
              <h3 className="text-2xl font-bold">Intermediate</h3>
              <p className="text-sm text-muted-foreground">Medium words (5-7 letters). No pre-filled letters, but images included!</p>
              <Link href="/game?difficulty=intermediate" className="block w-full">
                <Button className="w-full rounded-xl bg-accent hover:bg-accent/90 text-accent-foreground font-bold h-12">
                  Start Level 2
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Advanced */}
        <Card className="overflow-hidden border-2 border-transparent hover:border-foreground transition-all group">
          <CardContent className="p-0">
            <div className="bg-foreground/5 h-32 flex items-center justify-center">
              <Sparkles className="h-16 w-16 text-foreground group-hover:scale-110 transition-transform" />
            </div>
            <div className="p-6 text-center space-y-4">
              <h3 className="text-2xl font-bold">Advanced</h3>
              <p className="text-sm text-muted-foreground">Complex words (8+ letters). Definitions only. Timed challenges!</p>
              <Link href="/game?difficulty=advanced" className="block w-full">
                <Button variant="outline" className="w-full rounded-xl border-2 border-foreground hover:bg-foreground hover:text-white font-bold h-12">
                  Enter Challenge
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Navigation Footer */}
      <footer className="w-full grid grid-cols-2 md:grid-cols-4 gap-4 pt-8 border-t">
        <Link href="/admin">
          <Button variant="ghost" className="w-full h-16 rounded-2xl flex flex-col gap-1 hover:bg-primary/10">
            <Settings className="h-6 w-6" />
            <span className="text-xs font-bold uppercase">Admin Panel</span>
          </Button>
        </Link>
        <Link href="/stats">
          <Button variant="ghost" className="w-full h-16 rounded-2xl flex flex-col gap-1 hover:bg-accent/10">
            <BookOpen className="h-6 w-6" />
            <span className="text-xs font-bold uppercase">My Progress</span>
          </Button>
        </Link>
        <Link href="/admin/generator">
          <Button variant="ghost" className="w-full h-16 rounded-2xl flex flex-col gap-1 hover:bg-primary/10">
            <Sparkles className="h-6 w-6" />
            <span className="text-xs font-bold uppercase">AI Generator</span>
          </Button>
        </Link>
        <div className="hidden md:flex items-center justify-center opacity-50 italic text-sm">
          Created for Malaysian ESL Primary Learners
        </div>
      </footer>
    </div>
  );
}