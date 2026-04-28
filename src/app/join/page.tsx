
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DoorOpen, ArrowLeft, Loader2, Sparkles, CheckCircle2, LogIn, Lock, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useGameStore } from "@/lib/game-store";
import { useToast } from "@/hooks/use-toast";
import { useUser, useAuth } from "@/firebase";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import Link from "next/link";

export default function JoinClassPage() {
  const router = useRouter();
  const { joinClass, isLoaded } = useGameStore();
  const { user, loading: userLoading } = useUser();
  const auth = useAuth();
  const { toast } = useToast();
  
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleSignIn = async () => {
    if (!auth) return;
    setIsLoggingIn(true);
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      toast({ title: "Welcome!", description: "Now you can join your class." });
    } catch (error: any) {
      console.error("Sign in failed:", error);
      toast({ 
        variant: "destructive", 
        title: "Login Failed", 
        description: error.message || "Could not sign in." 
      });
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleJoin = async () => {
    if (code.length < 4) return;
    if (!user) {
      toast({
        variant: "destructive",
        title: "Login Required",
        description: "Please sign in first to join a class."
      });
      return;
    }

    setLoading(true);
    try {
      const result = await joinClass(code);
      if (result) {
        setSuccess(true);
        setTimeout(() => router.push("/"), 2000);
      } else {
        toast({
          variant: "destructive",
          title: "Code not found",
          description: "Please double check the class code with your teacher."
        });
      }
    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Error Joining",
        description: "Something went wrong. Please try again."
      });
    } finally {
      setLoading(false);
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
    <div className="min-h-screen bg-background p-6 flex flex-col items-center justify-center relative overflow-hidden">
      <div className="bg-animate" />
      
      <div className="w-full max-w-md space-y-8 z-10">
        <header className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => router.push("/")} className="rounded-xl border-4 border-white bg-white/50 backdrop-blur-xl">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-3xl font-black flex items-center gap-2">
            <DoorOpen className="text-accent" /> Join a Class
          </h1>
        </header>

        {!user ? (
          <Card className="rounded-[3rem] border-8 border-white shadow-3xl bg-white/80 backdrop-blur-2xl text-center p-10 space-y-6">
            <div className="bg-primary/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto border-4 border-primary/20">
               <Lock className="h-10 w-10 text-primary" />
            </div>
            <div>
              <CardTitle className="text-3xl font-black">Who are you?</CardTitle>
              <CardDescription className="text-lg font-medium mt-2">Sign in to save your stars and progress!</CardDescription>
            </div>
            <Button 
              onClick={handleSignIn} 
              disabled={isLoggingIn}
              className="w-full btn-bouncy h-20 text-2xl bg-primary text-white shadow-xl"
            >
              {isLoggingIn ? <Loader2 className="animate-spin mr-2" /> : <LogIn className="mr-2 h-6 w-6" />}
              SIGN IN TO JOIN
            </Button>
            <div className="pt-4 border-t-2 border-dashed">
              <Link href="/admin">
                <Button variant="ghost" className="text-muted-foreground font-black text-sm">
                  <BookOpen className="mr-2 h-4 w-4" /> Just want to browse words?
                </Button>
              </Link>
            </div>
          </Card>
        ) : (
          <Card className="rounded-[3rem] border-8 border-white shadow-3xl bg-white/80 backdrop-blur-2xl">
            <CardHeader className="text-center pb-2">
              <div className="bg-accent/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-accent/20">
                 <Sparkles className="h-10 w-10 text-accent" />
              </div>
              <CardTitle className="text-3xl font-black">Enter Class Code</CardTitle>
              <CardDescription className="text-lg font-medium">Ask your teacher for the code!</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="relative">
                <Input 
                  className="text-center text-4xl font-black h-24 rounded-3xl border-4 border-accent uppercase tracking-[0.5em] focus:ring-accent"
                  maxLength={6}
                  placeholder="XXXXXX"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  disabled={loading || success}
                />
              </div>

              {!success ? (
                <Button 
                  onClick={handleJoin} 
                  disabled={loading || code.length < 4}
                  className="w-full btn-bouncy h-20 text-2xl bg-accent text-white shadow-xl"
                >
                  {loading ? <Loader2 className="animate-spin mr-2" /> : "JOIN NOW!"}
                </Button>
              ) : (
                <div className="flex flex-col items-center gap-3 animate-in zoom-in text-accent">
                   <CheckCircle2 className="h-16 w-16" />
                   <p className="text-2xl font-black">WELCOME TO CLASS!</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <footer className="text-center">
           <Link href="/admin">
              <Button variant="link" className="text-muted-foreground font-bold underline">Not ready for class? Explorer words instead.</Button>
           </Link>
        </footer>
      </div>
    </div>
  );
}
