"use client";

import Link from "next/link";
import { Sparkles, Play, Award, Settings, Star, LogIn, LogOut, User, Loader2, Rocket, Camera, Lightbulb, Cloud, Sun, DoorOpen, Users, BookOpen } from "lucide-react";
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

  if (!isLoaded) {
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

      <header className="w-full max-w-6xl p-4 md:p-8 flex justify-between items-center z-20">
        <div className="flex items-center gap-2 md:gap-3">
          <div className="bg-primary p-2 md:p-4 rounded-2xl md:rounded-3xl shadow-xl -rotate-6">
            <Rocket className="text-white h-5 w-5 md:h-10 md:w-10" />
          </div>
          <h1 className="text-xl sm:text-3xl md:text-5xl font-black tracking-tighter text-foreground drop-shadow-md">
            Spell<span className="text-primary">Snap!</span>
          </h1>
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          {loadingData && (
            <div className="bg-white/50 backdrop-blur-sm p-1.5 rounded-full border border-white animate-pulse">
               <Loader2 className="h-3 w-3 md:h-4 md:w-4 animate-spin text-primary" />
            </div>
          )}
          {user ? (
            <div className="flex items-center gap-2 md:gap-4 bg-white/90 backdrop-blur-xl p-1.5 md:p-3 pl-3 md:pl-6 rounded-full border-2 md:border-4 border-white shadow-xl">
              <div className="flex flex-col text-right">
                <span className="font-black hidden sm:block text-primary text-sm md:text-base leading-none">{user.displayName}</span>
                {activeClass && <span className="text-[8px] md:text-[10px] font-bold text-accent uppercase tracking-wider">{activeClass.name}</span>}
              </div>
              <Avatar className="h-8 w-8 md:h-12 md:w-12 border-2 md:border-4 border-primary">
                <AvatarImage src={user.photoURL || ""} />
                <AvatarFallback><User className="h-4 w-4 md:h-6 md:w-6" /></AvatarFallback>
              </Avatar>
              <Button variant="ghost" size="icon" onClick={handleSignOut} className="rounded-full hover:bg-secondary/10 h-7 w-7 md:h-10 md:w-10">
                <LogOut className="h-3.5 w-3.5 md:h-6 md:w-6 text-secondary" />
              </Button>
            </div>
          ) : (
            <Button onClick={handleSignIn} className="btn-bouncy bg-primary text-white px-4 md:px-10 h-10 md:h-16 text-sm md:text-xl">
              <LogIn className="mr-1 md:mr-2 h-4 w-4 md:h-6 md:w-6" /> Join!
            </Button>
          )}
        </div>
      </header>

      <main className="w-full max-w-5xl p-4 md:p-8 space-y-6 md:space-y-12 z-10 flex-1">
        <section className="bg-white/60 backdrop-blur-2xl p-6 md:p-12 rounded-[2rem] md:rounded-[4rem] border-4 md:border-8 border-white shadow-3xl flex flex-col md:flex-row items-center gap-6 md:gap-12 text-center md:text-left">
          <div className="flex-1 space-y-4 md:space-y-6">
            <div className="space-y-2">
              <h2 className="text-3xl sm:text-4xl md:text-6xl font-black leading-tight text-foreground">
                Ready to <span className="sparkle-text">Snap Words?</span>
              </h2>
              {activeClass && (
                <div className="flex items-center gap-2 justify-center md:justify-start">
                   <div className="bg-accent/10 px-2 py-1 md:px-3 md:py-1.5 rounded-full border-2 border-accent/20 flex items-center gap-2">
                      <Users className="h-3 w-3 md:h-4 md:w-4 text-accent" />
                      <span className="font-black text-accent uppercase tracking-tighter text-[8px] md:text-xs">Class: {activeClass.name}</span>
                   </div>
                   <Button variant="ghost" size="sm" onClick={leaveClass} className="text-[8px] md:text-[10px] font-bold text-muted-foreground hover:text-destructive">
                     Leave
                   </Button>
                </div>
              )}
            </div>
            <p className="text-base sm:text-lg md:text-2xl font-bold text-muted-foreground leading-relaxed">
              {activeClass 
                ? "Your teacher has assigned special words for you to learn!" 
                : "Play games, earn stars, and become the classroom champion!"}
            </p>
            <div className="flex flex-wrap justify-center md:justify-start gap-3 md:gap-6 pt-2 md:pt-4">
              <div className="bg-white px-4 py-2 md:px-8 md:py-4 rounded-2xl md:rounded-3xl shadow-lg flex items-center gap-2 md:gap-3 border-2 md:border-4 border-primary/20">
                <Star className="text-primary fill-primary h-5 w-5 md:h-8 md:w-8" />
                <span className="font-black text-xl md:text-3xl">{stats.stars}</span>
              </div>
              <div className="bg-white px-4 py-2 md:px-8 md:py-4 rounded-2xl md:rounded-3xl shadow-lg flex items-center gap-2 md:gap-3 border-2 md:border-4 border-secondary/20">
                <Award className="text-secondary h-5 w-5 md:h-8 md:w-8" />
                <span className="font-black text-xl md:text-3xl">{stats.wordsMastered}</span>
              </div>
            </div>
          </div>
          <div className="relative group shrink-0 hidden sm:block">
            <div className="absolute inset-0 bg-primary/30 rounded-full blur-3xl animate-pulse group-hover:bg-primary/50 transition-all" />
            <div className="relative z-10 bg-white p-6 md:p-12 rounded-[3rem] md:rounded-[5rem] shadow-2xl border-4 md:border-8 border-primary/20 rotate-6 group-hover:rotate-0 transition-transform duration-500">
               <Sun className="h-20 w-20 md:h-40 md:w-40 text-primary animate-spin-slow" />
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8">
          {[
            { id: 'beginner', title: 'Beginner', icon: Rocket, color: 'bg-primary', text: 'Short words (3-4 letters)' },
            { id: 'intermediate', title: 'Explorer', icon: Camera, color: 'bg-accent', text: 'Medium words (5-7 letters)' },
            { id: 'advanced', title: 'Wizard', icon: Lightbulb, color: 'bg-secondary', text: 'Complex words (8+ letters)' }
          ].map((cat) => (
            <Link key={cat.id} href={`/game?difficulty=${cat.id}`} className="block h-full">
              <Card className="card-snap overflow-hidden h-full flex flex-col">
                <CardContent className="p-0 flex flex-col flex-1">
                  <div className={`${cat.color} p-6 md:p-12 flex justify-center items-center`}>
                    <cat.icon className="h-12 w-12 md:h-20 md:w-20 text-white" />
                  </div>
                  <div className="p-4 md:p-8 text-center space-y-2 md:space-y-4 flex-1 flex flex-col justify-between">
                    <div>
                      <h4 className="text-xl md:text-3xl font-black">{cat.title}</h4>
                      <p className="text-sm md:text-lg text-muted-foreground font-bold leading-tight">{cat.text}</p>
                    </div>
                    <div className="pt-4 md:pt-6">
                      <Button className="btn-bouncy w-full h-10 md:h-16 bg-white border-2 md:border-4 border-primary/10 text-primary hover:bg-primary hover:text-white text-base md:text-xl">
                        <Play className="mr-1.5 md:mr-2 h-4 w-4 md:h-6 md:w-6 fill-current" /> Let's Play!
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </section>

        <footer className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 md:gap-4 pt-4 md:pt-8">
           <Link href="/join">
              <Button variant="outline" className="w-full h-20 md:h-28 rounded-2xl md:rounded-[2rem] border-2 md:border-4 border-white bg-white/70 hover:bg-white flex flex-col gap-1 md:gap-2 transition-all shadow-lg group p-2">
                 <DoorOpen className="h-5 w-5 md:h-8 md:w-8 text-accent group-hover:scale-125 transition-transform" />
                 <span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-accent text-center">Join Class</span>
              </Button>
           </Link>
           <Link href="/stats">
              <Button variant="outline" className="w-full h-20 md:h-28 rounded-2xl md:rounded-[2rem] border-2 md:border-4 border-white bg-white/70 hover:bg-white flex flex-col gap-1 md:gap-2 transition-all shadow-lg group p-2">
                 <Award className="h-5 w-5 md:h-8 md:w-8 text-secondary group-hover:scale-125 transition-transform" />
                 <span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-secondary text-center">Progress</span>
              </Button>
           </Link>
           <Link href="/teacher">
              <Button variant="outline" className="w-full h-20 md:h-28 rounded-2xl md:rounded-[2rem] border-2 md:border-4 border-white bg-white/70 hover:bg-white flex flex-col gap-1 md:gap-2 transition-all shadow-lg group p-2">
                 <Settings className="h-5 w-5 md:h-8 md:w-8 text-primary group-hover:scale-125 transition-transform" />
                 <span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-primary text-center">Teachers</span>
              </Button>
           </Link>
           <Link href="/admin">
              <Button variant="outline" className="w-full h-20 md:h-28 rounded-2xl md:rounded-[2rem] border-2 md:border-4 border-white bg-white/70 hover:bg-white flex flex-col gap-1 md:gap-2 transition-all shadow-lg group p-2">
                 <BookOpen className="h-5 w-5 md:h-8 md:w-8 text-orange-500 group-hover:scale-125 transition-transform" />
                 <span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-orange-600 text-center">Word Bank</span>
              </Button>
           </Link>
           <Link href="/admin/generator">
              <Button variant="outline" className="w-full h-20 md:h-28 rounded-2xl md:rounded-[2rem] border-2 md:border-4 border-white bg-white/70 hover:bg-white flex flex-col gap-1 md:gap-2 transition-all shadow-lg group p-2">
                 <Sparkles className="h-5 w-5 md:h-8 md:w-8 text-yellow-500 group-hover:scale-125 transition-transform" />
                 <span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-yellow-600 text-center">AI Magic</span>
              </Button>
           </Link>
        </footer>
      </main>
    </div>
  );
}
