"use client";

import Link from "next/link";
import { Sparkles, Play, Award, Settings, BookOpen, Star, LogIn, LogOut, User, Loader2, Rocket, Camera, Lightbulb, Cloud, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useGameStore } from "@/lib/game-store";
import { useUser, useAuth } from "@/firebase";
import { GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function LobbyPage() {
  const { stats, isLoaded } = useGameStore();
  const { user, loading: userLoading } = useUser();
  const auth = useAuth();

  const handleSignIn = async () => {
    if (!auth) return;
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Sign in failed:", error);
    }
  };

  const handleSignOut = async () => {
    if (!auth) return;
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Sign out failed:", error);
    }
  };

  if (!isLoaded || userLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen relative flex flex-col items-center">
      <div className="bg-animate">
        <Cloud className="floating-element text-primary/20" size={120} style={{ top: '10%', left: '5%', animationDelay: '0s' }} />
        <Star className="floating-element text-yellow-400/30" size={40} style={{ top: '20%', right: '10%', animationDelay: '2s' }} />
        <Cloud className="floating-element text-primary/20" size={80} style={{ bottom: '15%', left: '15%', animationDelay: '4s' }} />
        <Sun className="floating-element text-orange-400/20" size={150} style={{ top: '-20px', right: '-20px', animationDelay: '1s' }} />
        <Sparkles className="floating-element text-primary/30" size={50} style={{ bottom: '30%', right: '5%', animationDelay: '3s' }} />
      </div>

      <header className="w-full max-w-4xl p-6 flex justify-between items-center z-10">
        <div className="flex items-center gap-2">
          <div className="bg-primary p-3 rounded-2xl shadow-lg rotate-3">
            <Rocket className="text-white h-8 w-8" />
          </div>
          <h1 className="text-4xl font-black tracking-tighter text-foreground drop-shadow-sm">
            Spell<span className="text-primary">Snap!</span>
          </h1>
        </div>

        {user ? (
          <div className="flex items-center gap-3 bg-white/80 backdrop-blur-md p-2 pl-4 rounded-full border-2 border-white shadow-sm">
            <span className="font-bold hidden md:block">{user.displayName}</span>
            <Avatar className="h-10 w-10 border-2 border-primary">
              <AvatarImage src={user.photoURL || ""} />
              <AvatarFallback><User /></AvatarFallback>
            </Avatar>
            <Button variant="ghost" size="icon" onClick={handleSignOut} className="rounded-full">
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        ) : (
          <Button onClick={handleSignIn} className="btn-bouncy bg-primary text-white px-6 h-12 text-lg">
            <LogIn className="mr-2 h-5 w-5" /> Join In!
          </Button>
        )}
      </header>

      <main className="w-full max-w-4xl p-6 space-y-10 z-10 flex-1">
        <section className="bg-white/40 backdrop-blur-xl p-8 rounded-[3rem] border-4 border-white shadow-2xl flex flex-col md:flex-row items-center gap-8">
          <div className="flex-1 space-y-4 text-center md:text-left">
            <h2 className="text-5xl font-black leading-tight text-foreground">
              Ready for a <span className="text-primary">Spelling Adventure?</span>
            </h2>
            <p className="text-xl font-medium text-muted-foreground">
              Master new words, earn shiny stars, and become a spelling champion!
            </p>
            <div className="flex flex-wrap justify-center md:justify-start gap-4 pt-4">
              <div className="bg-white px-6 py-3 rounded-full shadow-sm flex items-center gap-2 border-2 border-primary/10">
                <Star className="text-primary fill-primary" />
                <span className="font-black text-2xl">{stats.stars}</span>
              </div>
              <div className="bg-white px-6 py-3 rounded-full shadow-sm flex items-center gap-2 border-2 border-secondary/10">
                <Award className="text-secondary" />
                <span className="font-black text-2xl">{stats.wordsMastered}</span>
              </div>
            </div>
          </div>
          <div className="relative group">
            <div className="absolute inset-0 bg-primary/20 rounded-full blur-3xl animate-pulse group-hover:bg-primary/40 transition-all" />
            <div className="relative z-10 bg-white p-10 rounded-[4rem] shadow-xl border-8 border-primary/20 rotate-3 group-hover:rotate-0 transition-transform">
               <Sun className="h-32 w-32 text-primary animate-spin-slow" />
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { id: 'beginner', title: 'Beginner', icon: Rocket, color: 'bg-primary', text: 'Short words (3-4 letters)', stats: '120 Sessions' },
            { id: 'intermediate', title: 'Explorer', icon: Camera, color: 'bg-orange-400', text: 'Medium words (5-7 letters)', stats: '85 Sessions' },
            { id: 'advanced', title: 'Wizard', icon: Lightbulb, color: 'bg-secondary', text: 'Complex words (8+ letters)', stats: '40 Sessions' }
          ].map((cat) => (
            <Link key={cat.id} href={`/game?difficulty=${cat.id}`} className="block">
              <Card className="card-snap overflow-hidden h-full">
                <CardContent className="p-0 flex flex-col">
                  <div className={`${cat.color} p-8 flex justify-center items-center`}>
                    <cat.icon className="h-16 w-16 text-white" />
                  </div>
                  <div className="p-6 text-center space-y-2">
                    <h4 className="text-2xl font-black">{cat.title}</h4>
                    <p className="text-muted-foreground font-bold text-sm leading-tight">{cat.text}</p>
                    <div className="pt-4">
                      <Button className="btn-bouncy w-full h-12 bg-white border-2 border-primary/10 text-primary hover:bg-primary hover:text-white group">
                        <Play className="mr-2 h-5 w-5 fill-current" /> Play
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </section>

        <footer className="flex flex-col md:flex-row gap-4">
           <Link href="/stats" className="flex-1">
              <Button variant="outline" className="w-full h-24 rounded-[2rem] border-4 border-white bg-white/50 hover:bg-white flex flex-col gap-1 transition-all shadow-lg">
                 <Award className="h-8 w-8 text-secondary" />
                 <span className="text-xs font-black uppercase tracking-widest">My Progress</span>
              </Button>
           </Link>
           <Link href="/admin" className="flex-1">
              <Button variant="outline" className="w-full h-24 rounded-[2rem] border-4 border-white bg-white/50 hover:bg-white flex flex-col gap-1 transition-all shadow-lg">
                 <Settings className="h-8 w-8 text-primary" />
                 <span className="text-xs font-black uppercase tracking-widest">Settings</span>
              </Button>
           </Link>
           <Link href="/admin/generator" className="flex-1">
              <Button variant="outline" className="w-full h-24 rounded-[2rem] border-4 border-white bg-white/50 hover:bg-white flex flex-col gap-1 transition-all shadow-lg">
                 <Sparkles className="h-8 w-8 text-yellow-500" />
                 <span className="text-xs font-black uppercase tracking-widest">AI Generator</span>
              </Button>
           </Link>
        </footer>
      </main>
    </div>
  );
}
