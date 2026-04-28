
"use client";

import Link from "next/link";
import { Sparkles, Play, Award, Settings, Star, LogIn, LogOut, User, Loader2, Rocket, Camera, Lightbulb, Cloud, Sun, DoorOpen, Users, BookOpen, GraduationCap, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useGameStore } from "@/lib/game-store";
import { useUser, useAuth } from "@/firebase";
import { GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";

export default function LobbyPage() {
  const { stats, isLoaded, activeClass, leaveClass, loadingData } = useGameStore();
  const { user, loading: userLoading } = useUser();
  const auth = useAuth();
  const { toast } = useToast();

  const handleSignIn = async () => {
    if (!auth) return;
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      toast({ title: "Welcome back!", description: "Ready to snap some words?" });
    } catch (error: any) {
      if (error.code === 'auth/unauthorized-domain') {
        toast({
          variant: "destructive",
          title: "Domain Not Authorized",
          description: "Please add this domain to Authorized Domains in the Firebase Console.",
        });
      } else {
        console.error("Sign in failed:", error);
      }
    }
  };

  const handleSignOut = async () => {
    if (!auth) return;
    try {
      await signOut(auth);
      toast({ title: "Signed out", description: "See you next time!" });
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
              <LogIn className="mr-1 md:mr-2 h-4 w-4 md:h-6 md:w-6" /> Sign In
            </Button>
          )}
        </div>
      </header>

      <main className="w-full max-w-5xl p-4 md:p-8 space-y-12 z-10 flex-1">
        <section className="text-center space-y-4">
          <h2 className="text-4xl md:text-7xl font-black tracking-tight text-foreground">
            Welcome to <span className="sparkle-text">SpellSnap!</span>
          </h2>
          <p className="text-xl md:text-2xl font-bold text-muted-foreground max-w-2xl mx-auto">
            Ready to explore words or manage your classroom?
          </p>
        </section>

        {/* Role Selection Cards */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Student Portal */}
          <Card className="rounded-[3rem] border-8 border-white bg-white/60 backdrop-blur-2xl shadow-3xl overflow-hidden group h-full">
            <CardContent className="p-10 flex flex-col items-center text-center space-y-6">
              <div className="bg-accent p-8 rounded-[2rem] shadow-xl group-hover:rotate-6 transition-transform">
                <Play className="h-16 w-16 text-white fill-current" />
              </div>
              <div>
                <h3 className="text-4xl font-black text-accent uppercase">Student</h3>
                <p className="text-lg font-bold text-muted-foreground mt-2">Join a class to earn stars, or explore words right now!</p>
              </div>
              <div className="w-full space-y-4">
                <Link href="/join" className="block">
                  <Button className="btn-bouncy bg-accent text-white h-16 px-12 text-xl w-full">Join My Class</Button>
                </Link>
                <Link href="/admin" className="block">
                  <Button variant="outline" className="btn-bouncy border-4 border-accent text-accent bg-white h-16 px-12 text-xl w-full shadow-none hover:bg-accent/5">Browse Word Explorer</Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Teacher Portal */}
          <Card className="rounded-[3rem] border-8 border-white bg-white/60 backdrop-blur-2xl shadow-3xl overflow-hidden group h-full">
            <CardContent className="p-10 flex flex-col items-center text-center space-y-6">
              <div className="bg-primary p-8 rounded-[2rem] shadow-xl group-hover:-rotate-6 transition-transform">
                <GraduationCap className="h-16 w-16 text-white" />
              </div>
              <div>
                <h3 className="text-4xl font-black text-primary uppercase">Teacher</h3>
                <p className="text-lg font-bold text-muted-foreground mt-2">Create classes, assign words, and track pupil progress!</p>
              </div>
              <Link href="/teacher" className="block w-full">
                <Button className="btn-bouncy bg-primary text-white h-16 px-12 text-xl w-full">Teacher Dashboard</Button>
              </Link>
            </CardContent>
          </Card>
        </section>

        {/* Quick Access Grid */}
        <section className="pt-8">
          <h4 className="text-center font-black text-sm uppercase tracking-[0.3em] text-muted-foreground mb-8">Quick Access</h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
             <Link href="/game?difficulty=beginner" className="block">
                <Button variant="outline" className="w-full h-24 rounded-[2rem] border-4 border-white bg-white/70 hover:bg-white flex flex-col gap-2 transition-all shadow-lg p-2 group">
                   <Rocket className="h-6 w-6 text-primary group-hover:scale-125 transition-transform" />
                   <span className="text-[10px] font-black uppercase text-primary">Practice</span>
                </Button>
             </Link>
             <Link href="/stats" className="block">
                <Button variant="outline" className="w-full h-24 rounded-[2rem] border-4 border-white bg-white/70 hover:bg-white flex flex-col gap-2 transition-all shadow-lg p-2 group">
                   <Award className="h-6 w-6 text-secondary group-hover:scale-125 transition-transform" />
                   <span className="text-[10px] font-black uppercase text-secondary">My Stats</span>
                </Button>
             </Link>
             <Link href="/admin" className="block">
                <Button variant="outline" className="w-full h-24 rounded-[2rem] border-4 border-white bg-white/70 hover:bg-white flex flex-col gap-2 transition-all shadow-lg p-2 group">
                   <BookOpen className="h-6 w-6 text-orange-500 group-hover:scale-125 transition-transform" />
                   <span className="text-[10px] font-black uppercase text-orange-600">Word Explorer</span>
                </Button>
             </Link>
             <Link href="/admin/generator" className="block">
                <Button variant="outline" className="w-full h-24 rounded-[2rem] border-4 border-white bg-white/70 hover:bg-white flex flex-col gap-2 transition-all shadow-lg p-2 group">
                   <Sparkles className="h-6 w-6 text-yellow-500 group-hover:scale-125 transition-transform" />
                   <span className="text-[10px] font-black uppercase text-yellow-600">AI Magic</span>
                </Button>
             </Link>
             <Link href="/teacher" className="block">
                <Button variant="outline" className="w-full h-24 rounded-[2rem] border-4 border-white bg-white/70 hover:bg-white flex flex-col gap-2 transition-all shadow-lg p-2 group">
                   <Settings className="h-6 w-6 text-accent group-hover:scale-125 transition-transform" />
                   <span className="text-[10px] font-black uppercase text-accent">Classes</span>
                </Button>
             </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
