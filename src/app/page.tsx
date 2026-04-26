
"use client";

import Link from "next/link";
import { Sparkles, Play, Award, Settings, Star, LogIn, LogOut, User, Loader2, Rocket, Camera, Lightbulb, Cloud, Sun, DoorOpen, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useGameStore } from "@/lib/game-store";
import { useUser, useAuth } from "@/firebase";
import { GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function LobbyPage() {
  const { stats, isLoaded, activeClass, leaveClass, loadingData } = useGameStore();
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
        <Cloud className="floating-element text-accent/30" size={120} style={{ top: '10%', left: '5%', animationDelay: '0s' }} />
        <Star className="floating-element text-primary/40" size={40} style={{ top: '20%', right: '10%', animationDelay: '2s' }} />
        <Cloud className="floating-element text-accent/30" size={80} style={{ bottom: '15%', left: '15%', animationDelay: '4s' }} />
        <Sun className="floating-element text-primary/30" size={200} style={{ top: '-40px', right: '-40px', animationDelay: '1s' }} />
        <Sparkles className="floating-element text-secondary/40" size={50} style={{ bottom: '30%', right: '5%', animationDelay: '3s' }} />
      </div>

      <header className="w-full max-w-5xl p-8 flex justify-between items-center z-10">
        <div className="flex items-center gap-3">
          <div className="bg-primary p-4 rounded-3xl shadow-xl -rotate-6">
            <Rocket className="text-white h-10 w-10" />
          </div>
          <h1 className="text-5xl font-black tracking-tighter text-foreground drop-shadow-md">
            Spell<span className="text-primary">Snap!</span>
          </h1>
        </div>

        <div className="flex items-center gap-4">
          {loadingData && (
            <div className="bg-white/50 backdrop-blur-sm p-2 rounded-full border-2 border-white animate-pulse">
               <Loader2 className="h-4 w-4 animate-spin text-primary" />
            </div>
          )}
          {user ? (
            <div className="flex items-center gap-4 bg-white/90 backdrop-blur-xl p-3 pl-6 rounded-full border-4 border-white shadow-xl">
              <div className="flex flex-col text-right">
                <span className="font-black hidden md:block text-primary leading-none">{user.displayName}</span>
                {activeClass && <span className="text-[10px] font-bold text-accent uppercase tracking-wider">{activeClass.name}</span>}
              </div>
              <Avatar className="h-12 w-12 border-4 border-primary">
                <AvatarImage src={user.photoURL || ""} />
                <AvatarFallback><User /></AvatarFallback>
              </Avatar>
              <Button variant="ghost" size="icon" onClick={handleSignOut} className="rounded-full hover:bg-secondary/10">
                <LogOut className="h-6 w-6 text-secondary" />
              </Button>
            </div>
          ) : (
            <Button onClick={handleSignIn} className="btn-bouncy bg-primary text-white px-10 h-16 text-xl">
              <LogIn className="mr-3 h-6 w-6" /> Join the Fun!
            </Button>
          )}
        </div>
      </header>

      <main className="w-full max-w-5xl p-8 space-y-12 z-10 flex-1">
        <section className="bg-white/60 backdrop-blur-2xl p-12 rounded-[4rem] border-8 border-white shadow-3xl flex flex-col md:flex-row items-center gap-12">
          <div className="flex-1 space-y-6 text-center md:text-left">
            <div className="space-y-2">
              <h2 className="text-6xl font-black leading-tight text-foreground">
                Ready to <span className="sparkle-text">Snap Words?</span>
              </h2>
              {activeClass && (
                <div className="flex items-center gap-3 justify-center md:justify-start">
                   <div className="bg-accent/10 px-4 py-2 rounded-full border-2 border-accent/20 flex items-center gap-2">
                      <Users className="h-5 w-5 text-accent" />
                      <span className="font-black text-accent uppercase tracking-tighter">Class: {activeClass.name}</span>
                   </div>
                   <Button variant="ghost" size="sm" onClick={leaveClass} className="text-xs font-bold text-muted-foreground hover:text-destructive">
                     Leave Class
                   </Button>
                </div>
              )}
            </div>
            <p className="text-2xl font-bold text-muted-foreground leading-relaxed">
              {activeClass 
                ? "Your teacher has assigned special words for you to learn!" 
                : "Play games, earn stars, and become the classroom champion!"}
            </p>
            <div className="flex flex-wrap justify-center md:justify-start gap-6 pt-4">
              <div className="bg-white px-8 py-4 rounded-3xl shadow-lg flex items-center gap-3 border-4 border-primary/20">
                <Star className="text-primary fill-primary h-8 w-8" />
                <span className="font-black text-3xl">{stats.stars}</span>
              </div>
              <div className="bg-white px-8 py-4 rounded-3xl shadow-lg flex items-center gap-3 border-4 border-secondary/20">
                <Award className="text-secondary h-8 w-8" />
                <span className="font-black text-3xl">{stats.wordsMastered}</span>
              </div>
            </div>
          </div>
          <div className="relative group">
            <div className="absolute inset-0 bg-primary/30 rounded-full blur-3xl animate-pulse group-hover:bg-primary/50 transition-all" />
            <div className="relative z-10 bg-white p-12 rounded-[5rem] shadow-2xl border-8 border-primary/20 rotate-6 group-hover:rotate-0 transition-transform duration-500">
               <Sun className="h-40 w-40 text-primary animate-spin-slow" />
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { id: 'beginner', title: 'Beginner', icon: Rocket, color: 'bg-primary', text: 'Short words (3-4 letters)' },
            { id: 'intermediate', title: 'Explorer', icon: Camera, color: 'bg-accent', text: 'Medium words (5-7 letters)' },
            { id: 'advanced', title: 'Wizard', icon: Lightbulb, color: 'bg-secondary', text: 'Complex words (8+ letters)' }
          ].map((cat) => (
            <Link key={cat.id} href={`/game?difficulty=${cat.id}`} className="block">
              <Card className="card-snap overflow-hidden h-full">
                <CardContent className="p-0 flex flex-col">
                  <div className={`${cat.color} p-12 flex justify-center items-center`}>
                    <cat.icon className="h-20 w-20 text-white" />
                  </div>
                  <div className="p-8 text-center space-y-4">
                    <h4 className="text-3xl font-black">{cat.title}</h4>
                    <p className="text-muted-foreground font-bold text-lg leading-tight">{cat.text}</p>
                    <div className="pt-6">
                      <Button className="btn-bouncy w-full h-16 bg-white border-4 border-primary/10 text-primary hover:bg-primary hover:text-white text-xl">
                        <Play className="mr-3 h-6 w-6 fill-current" /> Let's Play!
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </section>

        <footer className="grid grid-cols-1 md:grid-cols-4 gap-6 pt-8">
           <Link href="/join">
              <Button variant="outline" className="w-full h-28 rounded-[3rem] border-8 border-white bg-white/70 hover:bg-white flex flex-col gap-2 transition-all shadow-xl group">
                 <DoorOpen className="h-10 w-10 text-accent group-hover:scale-125 transition-transform" />
                 <span className="text-sm font-black uppercase tracking-widest text-accent">Join Class</span>
              </Button>
           </Link>
           <Link href="/stats">
              <Button variant="outline" className="w-full h-28 rounded-[3rem] border-8 border-white bg-white/70 hover:bg-white flex flex-col gap-2 transition-all shadow-xl group">
                 <Award className="h-10 w-10 text-secondary group-hover:scale-125 transition-transform" />
                 <span className="text-sm font-black uppercase tracking-widest text-secondary">My Progress</span>
              </Button>
           </Link>
           <Link href="/teacher">
              <Button variant="outline" className="w-full h-28 rounded-[3rem] border-8 border-white bg-white/70 hover:bg-white flex flex-col gap-2 transition-all shadow-xl group">
                 <Settings className="h-10 w-10 text-primary group-hover:scale-125 transition-transform" />
                 <span className="text-sm font-black uppercase tracking-widest text-primary">Teachers</span>
              </Button>
           </Link>
           <Link href="/admin/generator">
              <Button variant="outline" className="w-full h-28 rounded-[3rem] border-8 border-white bg-white/70 hover:bg-white flex flex-col gap-2 transition-all shadow-xl group">
                 <Sparkles className="h-10 w-10 text-yellow-500 group-hover:scale-125 transition-transform" />
                 <span className="text-sm font-black uppercase tracking-widest text-yellow-600">AI Magic</span>
              </Button>
           </Link>
        </footer>
      </main>
    </div>
  );
}
