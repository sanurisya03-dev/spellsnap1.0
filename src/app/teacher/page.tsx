
"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { 
  Plus, 
  Settings, 
  ArrowLeft, 
  Users, 
  BookOpen, 
  Trophy, 
  Loader2, 
  Search, 
  Check, 
  X,
  Copy,
  LayoutDashboard,
  LogIn,
  ExternalLink
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useGameStore, Classroom, PupilProgress } from "@/lib/game-store";
import { useUser, useFirestore, useCollection, useAuth } from "@/firebase";
import { collection, doc, setDoc, query, where, addDoc } from "firebase/firestore";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors';
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import Link from "next/link";

export default function TeacherDashboard() {
  const router = useRouter();
  const { user, loading: userLoading } = useUser();
  const { allWords, isLoaded } = useGameStore();
  const db = useFirestore();
  const auth = useAuth();
  const { toast } = useToast();

  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newClassName, setNewClassName] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleSignIn = async () => {
    if (!auth) {
      toast({
        variant: "destructive",
        title: "Connection Error",
        description: "Firebase is still initializing. Please wait a moment."
      });
      return;
    }
    
    setIsLoggingIn(true);
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      toast({ title: "Welcome back!", description: "Signed in successfully." });
    } catch (error: any) {
      console.error("Sign in failed:", error);
      toast({
        variant: "destructive",
        title: "Sign in failed",
        description: error.message || "Could not complete sign in."
      });
    } finally {
      setIsLoggingIn(false);
    }
  };

  const classQuery = useMemo(() => {
    if (!db || !user?.uid) return null;
    return query(collection(db, 'classrooms'), where('teacherId', '==', user.uid));
  }, [db, user?.uid]);
  const { data: myClasses, loading: classesLoading } = useCollection<Classroom>(classQuery);

  const selectedClass = useMemo(() => 
    myClasses?.find(c => c.id === selectedClassId), 
    [myClasses, selectedClassId]
  );

  const pupilQuery = useMemo(() => {
    if (!db || !selectedClassId) return null;
    return collection(db, 'classrooms', selectedClassId, 'pupils');
  }, [db, selectedClassId]);
  const { data: pupils } = useCollection<PupilProgress>(pupilQuery);

  const handleCreateClass = () => {
    if (!db || !user?.uid) {
      toast({
        variant: "destructive",
        title: "Action required",
        description: "Please sign in to create a class."
      });
      return;
    }
    
    if (!newClassName.trim()) {
      toast({
        variant: "destructive",
        title: "Class Name Required",
        description: "Please enter a name for your classroom."
      });
      return;
    }

    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    const data = {
      name: newClassName.trim(),
      code,
      teacherId: user.uid,
      assignedWordIds: [],
      createdAt: new Date().toISOString()
    };

    const classroomRef = collection(db, 'classrooms');
    const newDocRef = doc(classroomRef); // Pre-generate the reference for optimistic logic

    // OPTIMISTIC UI: Close dialog and show success immediately
    setIsCreateOpen(false);
    setNewClassName("");
    toast({ title: "Class Created!", description: `The join code is ${code}` });

    // Initiate write in background without blocking UI
    setDoc(newDocRef, data)
      .catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
          path: newDocRef.path,
          operation: 'create',
          requestResourceData: data,
        } satisfies SecurityRuleContext);
        errorEmitter.emit('permission-error', permissionError);
      });
  };

  const toggleWordAssignment = (wordId: string) => {
    if (!db || !selectedClass) return;
    
    const current = selectedClass.assignedWordIds || [];
    const next = current.includes(wordId) 
      ? current.filter(id => id !== wordId)
      : [...current, wordId];
    
    const docRef = doc(db, 'classrooms', selectedClass.id);
    
    // Non-blocking mutation
    setDoc(docRef, { assignedWordIds: next }, { merge: true })
      .catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
          path: docRef.path,
          operation: 'update',
          requestResourceData: { assignedWordIds: next },
        } satisfies SecurityRuleContext);
        errorEmitter.emit('permission-error', permissionError);
      });
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({ title: "Code Copied!", description: "Share this with your pupils." });
  };

  if (!isLoaded || classesLoading || userLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-8 text-center space-y-8">
        <div className="bg-white/80 backdrop-blur-2xl p-8 md:p-16 rounded-[3rem] md:rounded-[4rem] border-8 border-white shadow-3xl max-w-2xl w-full">
          <div className="bg-primary/10 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-8 border-4 border-primary/20">
            <Settings className="h-12 w-12 text-primary" />
          </div>
          <h1 className="text-4xl md:text-5xl font-black mb-4 tracking-tight">Teacher Access</h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-10 leading-relaxed">
            Ready to innovate your classroom? Sign in with your teacher account to create classes and manage word lists.
          </p>
          <Button 
            onClick={handleSignIn} 
            disabled={isLoggingIn}
            className="btn-bouncy w-full md:w-auto px-12 py-8 text-2xl bg-primary text-white shadow-xl flex items-center justify-center gap-3"
          >
            {isLoggingIn ? <Loader2 className="h-7 w-7 animate-spin" /> : <LogIn className="h-7 w-7" />}
            {isLoggingIn ? "Signing In..." : "Teacher Login"}
          </Button>
        </div>
        <Button variant="ghost" onClick={() => router.push("/")} className="text-muted-foreground font-black flex items-center gap-2 hover:text-primary transition-colors">
          <ArrowLeft className="h-5 w-5" /> Back to Lobby
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6 md:p-12 max-w-6xl mx-auto space-y-8 relative z-10">
      <header className="flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => router.push("/")} className="rounded-xl bg-white shadow-sm border-2">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-black flex items-center gap-2">
              <LayoutDashboard className="text-primary" /> Teacher Dashboard
            </h1>
            <p className="text-muted-foreground font-medium">Empower your pupils with fun spelling!</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/admin">
            <Button variant="outline" className="rounded-xl font-bold border-2 bg-white hover:bg-orange-50 hover:border-orange-200 transition-all">
              <BookOpen className="mr-2 h-5 w-5 text-orange-500" /> Manage Bank
            </Button>
          </Link>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="rounded-xl bg-primary hover:bg-primary/90 font-bold px-6 shadow-md hover:shadow-lg transition-all">
                <Plus className="mr-2 h-5 w-5" /> Create Class
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-[3rem] p-8 md:p-12">
              <DialogHeader>
                <DialogTitle className="text-3xl font-black">New Classroom</DialogTitle>
                <DialogDescription className="text-lg font-medium">Give your new class a name to start assigning words.</DialogDescription>
              </DialogHeader>
              <div className="py-8 space-y-6">
                <div className="space-y-3">
                  <Label className="font-bold text-lg">Class Name</Label>
                  <Input 
                    placeholder="e.g., Year 3 Blue" 
                    value={newClassName} 
                    onChange={(e) => setNewClassName(e.target.value)} 
                    className="rounded-2xl border-4 border-muted focus:border-primary h-16 text-xl px-6 transition-all"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button 
                  onClick={handleCreateClass} 
                  className="w-full btn-bouncy bg-primary text-white h-16 rounded-2xl font-black text-xl shadow-xl"
                >
                  <Check className="h-6 w-6 mr-3" />
                  CREATE CLASS NOW!
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <aside className="md:col-span-1 space-y-4">
          <h3 className="font-black text-sm uppercase tracking-widest text-muted-foreground ml-2">My Classrooms</h3>
          <div className="flex flex-col gap-3">
            {myClasses?.map(c => (
              <Button 
                key={c.id}
                variant={selectedClassId === c.id ? "default" : "outline"}
                onClick={() => setSelectedClassId(c.id)}
                className={`justify-start h-16 rounded-2xl border-2 font-bold transition-all shadow-sm ${selectedClassId === c.id ? 'bg-primary border-primary scale-105 shadow-md' : 'bg-white hover:border-primary/30'}`}
              >
                <Users className={`mr-2 h-5 w-5 ${selectedClassId === c.id ? 'text-white' : 'text-accent'}`} /> {c.name}
              </Button>
            ))}
            {myClasses?.length === 0 && (
              <div className="text-center p-8 text-muted-foreground bg-white/50 rounded-3xl border-2 border-dashed flex flex-col items-center gap-3">
                <Users className="h-8 w-8 opacity-20" />
                <p className="text-sm font-bold">No classes created yet. Click "Create Class" to begin!</p>
              </div>
            )}
          </div>
        </aside>

        <main className="md:col-span-3">
          {selectedClass ? (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
              <Card className="rounded-[3rem] border-8 border-white shadow-2xl overflow-hidden bg-white/90 backdrop-blur-xl">
                <CardContent className="p-8 md:p-12 flex flex-col md:flex-row justify-between items-center gap-8">
                   <div className="space-y-2 text-center md:text-left">
                      <h2 className="text-4xl md:text-5xl font-black text-foreground tracking-tight">{selectedClass.name}</h2>
                      <p className="text-lg md:text-xl text-muted-foreground font-bold italic">Curriculum & Student Progress</p>
                   </div>
                   <div className="bg-accent/10 p-6 rounded-[2rem] border-4 border-accent/20 flex flex-col items-center gap-1 shadow-inner w-full md:w-auto">
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-accent">Student Join Code</span>
                      <button onClick={() => copyCode(selectedClass.code)} className="flex items-center gap-3 group">
                         <span className="text-4xl font-black text-accent tracking-widest">{selectedClass.code}</span>
                         <Copy className="h-5 w-5 text-accent group-hover:scale-125 transition-transform" />
                      </button>
                   </div>
                </CardContent>
              </Card>

              <Tabs defaultValue="assignments" className="w-full">
                <TabsList className="bg-white/50 backdrop-blur-sm p-1 h-16 rounded-2xl border-2 mb-6 w-full md:w-fit">
                  <TabsTrigger value="assignments" className="rounded-xl font-bold h-full px-10 data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-md transition-all">Assignments</TabsTrigger>
                  <TabsTrigger value="pupils" className="rounded-xl font-bold h-full px-10 data-[state=active]:bg-secondary data-[state=active]:text-white data-[state=active]:shadow-md transition-all">Pupil Progress</TabsTrigger>
                </TabsList>

                <TabsContent value="assignments" className="space-y-6 animate-in fade-in zoom-in duration-300 outline-none">
                  <div className="flex justify-between items-center px-2">
                     <div>
                       <h3 className="text-2xl font-black">Curriculum Builder</h3>
                       <p className="text-sm font-medium text-muted-foreground">Select words to assign to this class.</p>
                     </div>
                     <Link href="/admin">
                        <Button variant="ghost" size="sm" className="text-primary font-black hover:bg-primary/5">
                          Open Word Bank <ExternalLink className="ml-1 h-3 w-3" />
                        </Button>
                     </Link>
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {allWords.map(word => {
                      const isAssigned = selectedClass.assignedWordIds?.includes(word.id);
                      return (
                        <Card key={word.id} className={`rounded-3xl border-4 transition-all duration-300 ${isAssigned ? 'border-primary bg-primary/5 shadow-md scale-[1.02]' : 'border-white bg-white/50 hover:border-primary/20 shadow-sm'}`}>
                          <CardContent className="p-6 flex justify-between items-center gap-6">
                            <div className="flex-1 min-w-0">
                               <p className="text-2xl font-black uppercase text-foreground truncate">{word.word}</p>
                               <div className="flex flex-wrap gap-2 mt-1">
                                 <span className="text-[10px] font-black text-muted-foreground uppercase bg-muted/20 px-2 py-0.5 rounded-full">{word.difficulty}</span>
                                 <span className="text-[10px] font-black text-accent uppercase bg-accent/10 px-2 py-0.5 rounded-full">{word.theme || "General"}</span>
                               </div>
                            </div>
                            <Button 
                              size="sm" 
                              variant={isAssigned ? "default" : "outline"}
                              onClick={() => toggleWordAssignment(word.id)}
                              className={`rounded-xl font-black h-12 px-6 ${isAssigned ? 'bg-primary' : 'border-2'}`}
                            >
                              {isAssigned ? <X className="h-4 w-4 mr-1" /> : <Plus className="h-4 w-4 mr-1" />}
                              {isAssigned ? "Remove" : "Assign"}
                            </Button>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </TabsContent>

                <TabsContent value="pupils" className="space-y-6 animate-in fade-in zoom-in duration-300 outline-none">
                  <div className="space-y-4">
                    {pupils?.map(p => (
                      <Card key={p.id} className="rounded-3xl border-4 border-white bg-white/80 shadow-md hover:shadow-lg transition-all overflow-hidden">
                        <CardContent className="p-6 md:p-8 flex flex-col sm:flex-row justify-between items-center gap-6">
                          <div className="flex items-center gap-4">
                            <div className="bg-secondary/10 p-4 rounded-2xl border-2 border-secondary/20 shadow-inner">
                              <Trophy className="text-secondary h-8 w-8" />
                            </div>
                            <div>
                               <p className="text-2xl font-black">{p.pupilName || "Explorer"}</p>
                               <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">ID: {p.id.substring(0, 8)}</p>
                            </div>
                          </div>
                          <div className="flex gap-6 w-full sm:w-auto justify-center">
                            <div className="text-center">
                               <p className="text-[10px] font-black uppercase text-muted-foreground mb-1">Stars</p>
                               <p className="text-3xl font-black text-primary">{p.stars}</p>
                            </div>
                            <div className="text-center border-l-2 pl-6">
                               <p className="text-[10px] font-black uppercase text-muted-foreground mb-1">Mastered</p>
                               <p className="text-3xl font-black text-secondary">{p.wordsMastered}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                    {pupils?.length === 0 && (
                       <div className="text-center py-20 bg-white/40 rounded-[4rem] border-4 border-dashed border-white flex flex-col items-center gap-4">
                          <div className="bg-white p-8 rounded-full shadow-lg border-2 border-muted/20">
                            <Users className="h-16 w-16 text-muted opacity-30" />
                          </div>
                          <p className="text-xl font-bold text-muted-foreground max-w-xs">No pupils have joined this classroom yet.</p>
                          <p className="text-sm text-muted-foreground italic">Share code <b>{selectedClass.code}</b> with your students!</p>
                       </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          ) : (
            <div className="h-[60vh] flex flex-col items-center justify-center text-center bg-white/40 border-8 border-white rounded-[4rem] shadow-3xl p-12 space-y-8 animate-in fade-in duration-700">
               <div className="bg-white p-12 rounded-full shadow-2xl border-4 border-primary/20 rotate-3">
                  <LayoutDashboard className="h-24 w-24 text-primary animate-bounce-subtle" />
               </div>
               <div className="space-y-4">
                  <h3 className="text-4xl font-black tracking-tight">Select a Classroom</h3>
                  <p className="text-xl font-medium text-muted-foreground max-w-md mx-auto leading-relaxed">
                    Choose a class from the left sidebar to start building a custom curriculum and track student success!
                  </p>
               </div>
               <Button onClick={() => setIsCreateOpen(true)} variant="outline" className="rounded-full border-4 h-16 px-10 text-xl font-black hover:bg-primary hover:text-white transition-all">
                 <Plus className="mr-2 h-6 w-6" /> Create My First Class
               </Button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
