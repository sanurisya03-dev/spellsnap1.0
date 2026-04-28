
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
  Filter,
  CheckCircle,
  Circle,
  GraduationCap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useGameStore, Classroom, PupilProgress, Difficulty } from "@/lib/game-store";
import { useUser, useFirestore, useCollection, useAuth } from "@/firebase";
import { collection, doc, setDoc, query, where } from "firebase/firestore";
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
import { useToast } from "@/hooks/use-toast";
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

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
  const [isCreating, setIsCreating] = useState(false);
  const [assignmentSearch, setAssignmentSearch] = useState("");
  const [assignmentFilter, setAssignmentFilter] = useState<Difficulty | "all">("all");

  const handleSignIn = async () => {
    if (!auth) return;
    setIsLoggingIn(true);
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      toast({ title: "Welcome Teacher!", description: `Signed in as ${auth.currentUser?.displayName}` });
    } catch (error: any) {
      if (error.code === 'auth/unauthorized-domain') {
        toast({
          variant: "destructive",
          title: "Domain Not Authorized",
          description: "Please add this domain to Authorized Domains in the Firebase Console.",
        });
      } else {
        console.error(error);
        toast({ variant: "destructive", title: "Login Failed", description: error.message });
      }
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

  const filteredAssignments = useMemo(() => {
    return allWords.filter(w => {
      const matchesSearch = w.word.toLowerCase().includes(assignmentSearch.toLowerCase());
      const matchesFilter = assignmentFilter === "all" || w.difficulty === assignmentFilter;
      return matchesSearch && matchesFilter;
    });
  }, [allWords, assignmentSearch, assignmentFilter]);

  const handleCreateClass = async () => {
    if (!db || !user?.uid || !newClassName.trim()) return;

    setIsCreating(true);
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    const data = {
      name: newClassName.trim(),
      code,
      teacherId: user.uid,
      assignedWordIds: [],
      createdAt: new Date().toISOString()
    };

    const classroomRef = collection(db, 'classrooms');
    const newDocRef = doc(classroomRef);

    try {
      await setDoc(newDocRef, data);
      setIsCreateOpen(false);
      setNewClassName("");
      toast({ title: "Class Created!", description: `Code: ${code}. Share this with your students!` });
    } catch (err: any) {
      console.error("Error creating class:", err);
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: newDocRef.path,
        operation: 'create',
        requestResourceData: data,
      }));
      toast({ variant: "destructive", title: "Creation Failed", description: "Check permissions or try again." });
    } finally {
      setIsCreating(false);
    }
  };

  const toggleWordAssignment = (wordId: string) => {
    if (!db || !selectedClass) return;
    
    const current = selectedClass.assignedWordIds || [];
    const next = current.includes(wordId) 
      ? current.filter(id => id !== wordId)
      : [...current, wordId];
    
    const docRef = doc(db, 'classrooms', selectedClass.id);
    setDoc(docRef, { assignedWordIds: next }, { merge: true });
  };

  const handleAssignAll = () => {
    if (!db || !selectedClass) return;
    const allIds = filteredAssignments.map(w => w.id);
    const current = selectedClass.assignedWordIds || [];
    const next = Array.from(new Set([...current, ...allIds]));
    setDoc(doc(db, 'classrooms', selectedClass.id), { assignedWordIds: next }, { merge: true });
    toast({ title: "Words Assigned", description: `Added ${allIds.length} words to class.` });
  };

  const handleRemoveAll = () => {
    if (!db || !selectedClass) return;
    const allIdsToRemove = filteredAssignments.map(w => w.id);
    const next = (selectedClass.assignedWordIds || []).filter(id => !allIdsToRemove.includes(id));
    setDoc(doc(db, 'classrooms', selectedClass.id), { assignedWordIds: next }, { merge: true });
    toast({ title: "Words Removed", description: "Cleared selected words from class." });
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({ title: "Code Copied!" });
  };

  if (!isLoaded || classesLoading || userLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-8 text-center space-y-8">
        <div className="bg-white/80 backdrop-blur-2xl p-16 rounded-[4rem] border-8 border-white shadow-3xl max-w-2xl w-full">
          <div className="bg-primary/10 p-10 rounded-full w-fit mx-auto mb-8 border-4 border-primary/20">
            <GraduationCap className="h-24 w-24 text-primary" />
          </div>
          <h1 className="text-5xl font-black mb-4 uppercase tracking-tighter">Teacher Portal</h1>
          <p className="text-xl font-bold text-muted-foreground mb-10">Sign in to create classes, manage curriculum, and track your pupils' progress.</p>
          <Button onClick={handleSignIn} disabled={isLoggingIn} className="btn-bouncy px-12 py-8 text-2xl bg-primary text-white shadow-xl h-auto w-full max-w-sm">
            {isLoggingIn ? <Loader2 className="h-6 w-6 animate-spin mr-2" /> : <LogIn className="h-6 w-6 mr-2" />}
            I AM A TEACHER
          </Button>
          <div className="mt-8">
            <Button variant="ghost" onClick={() => router.push("/")} className="text-muted-foreground font-black flex items-center gap-2 mx-auto"><ArrowLeft /> Back to Main Screen</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 sm:p-12 max-w-6xl mx-auto space-y-8">
      <header className="flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => router.push("/")} className="rounded-xl shrink-0 border-4 border-white shadow-lg bg-white/50"><ArrowLeft /></Button>
          <div>
            <h1 className="text-3xl font-black flex items-center gap-2">Teacher Dashboard</h1>
            <p className="text-sm text-muted-foreground font-medium">Manage your class and curriculum</p>
          </div>
        </div>

        <div className="flex gap-3">
          <Link href="/admin"><Button variant="outline" className="rounded-xl font-bold border-4 border-white bg-white/50 shadow-lg"><BookOpen className="mr-2 h-5 w-5 text-orange-500" /> Word Bank</Button></Link>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild><Button className="rounded-xl bg-primary hover:bg-primary/90 font-bold px-6 shadow-xl border-4 border-white h-12"><Plus className="mr-2 h-5 w-5" /> New Class</Button></DialogTrigger>
            <DialogContent className="rounded-[3rem] p-12 max-w-lg border-8 border-white shadow-3xl bg-white/90 backdrop-blur-xl">
              <DialogHeader>
                <DialogTitle className="text-3xl font-black uppercase">Create Class</DialogTitle>
                <DialogDescription className="text-lg font-medium">Give your new class a name to get started.</DialogDescription>
              </DialogHeader>
              <div className="py-8"><Input placeholder="e.g., Year 3 Blue" value={newClassName} onChange={(e) => setNewClassName(e.target.value)} className="h-16 text-xl rounded-2xl border-4 border-accent/20 focus:ring-accent" /></div>
              <DialogFooter>
                <Button onClick={handleCreateClass} disabled={isCreating} className="w-full btn-bouncy bg-primary text-white h-16 rounded-2xl text-xl font-black shadow-xl">
                  {isCreating ? <Loader2 className="animate-spin mr-2" /> : "CREATE CLASS!"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <aside className="md:col-span-1 space-y-4">
          <h3 className="font-black text-sm uppercase tracking-widest text-muted-foreground px-2">My Classes</h3>
          <div className="flex flex-col gap-3">
            {myClasses?.length === 0 && (
              <div className="bg-white/40 p-6 rounded-3xl border-4 border-white border-dashed text-center">
                <p className="text-xs font-bold text-muted-foreground">No classes yet!</p>
              </div>
            )}
            {myClasses?.map(c => (
              <Button 
                key={c.id}
                variant={selectedClassId === c.id ? "default" : "outline"}
                onClick={() => setSelectedClassId(c.id)}
                className={`justify-start h-16 rounded-2xl border-4 font-black transition-all ${selectedClassId === c.id ? 'bg-primary border-white text-white scale-105 shadow-xl' : 'bg-white/50 border-white hover:bg-white'}`}
              >
                <Users className={`mr-2 h-6 w-6 ${selectedClassId === c.id ? 'text-white' : 'text-accent'}`} /> {c.name}
              </Button>
            ))}
          </div>
        </aside>

        <main className="md:col-span-3">
          {selectedClass ? (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
              <Card className="rounded-[3rem] border-8 border-white shadow-2xl bg-white/90 backdrop-blur-xl">
                <CardContent className="p-10 flex flex-col md:flex-row justify-between items-center gap-8">
                   <div className="text-center md:text-left">
                      <h2 className="text-5xl font-black tracking-tighter">{selectedClass.name}</h2>
                      <div className="flex items-center gap-2 mt-3">
                        <Badge className="bg-primary/20 text-primary border-2 border-primary/20 font-black px-4 py-1.5 rounded-full">{selectedClass.assignedWordIds?.length || 0} Words</Badge>
                        <Badge className="bg-accent/20 text-accent border-2 border-accent/20 font-black px-4 py-1.5 rounded-full">{pupils?.length || 0} Pupils</Badge>
                      </div>
                   </div>
                   <div className="bg-accent/10 p-6 rounded-[2.5rem] border-4 border-accent/20 flex flex-col items-center gap-1 shadow-inner min-w-[200px]">
                      <span className="text-[10px] font-black uppercase text-accent tracking-[0.2em]">Join Code</span>
                      <button onClick={() => copyCode(selectedClass.code)} className="flex items-center gap-3 group">
                         <span className="text-4xl font-black text-accent tracking-widest">{selectedClass.code}</span>
                         <Copy className="h-6 w-6 text-accent group-hover:scale-125 transition-transform" />
                      </button>
                   </div>
                </CardContent>
              </Card>

              <Tabs defaultValue="assignments" className="w-full">
                <TabsList className="bg-white/50 p-1.5 h-16 rounded-[1.5rem] border-4 border-white mb-6 w-full md:w-fit shadow-lg">
                  <TabsTrigger value="assignments" className="flex-1 rounded-xl font-black h-full px-10 data-[state=active]:bg-primary data-[state=active]:text-white uppercase tracking-widest text-xs transition-all">Curriculum</TabsTrigger>
                  <TabsTrigger value="pupils" className="flex-1 rounded-xl font-black h-full px-10 data-[state=active]:bg-secondary data-[state=active]:text-white uppercase tracking-widest text-xs transition-all">Pupil Progress</TabsTrigger>
                </TabsList>

                <TabsContent value="assignments" className="space-y-6 outline-none">
                  <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white/60 backdrop-blur-md p-6 rounded-[2rem] border-4 border-white shadow-xl">
                    <div className="relative w-full md:w-72">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <Input placeholder="Search word bank..." value={assignmentSearch} onChange={e => setAssignmentSearch(e.target.value)} className="pl-11 rounded-xl border-2 border-primary/10" />
                    </div>
                    <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full no-scrollbar">
                      {(["all", "beginner", "intermediate", "advanced"] as const).map(lvl => (
                        <Button 
                          key={lvl} 
                          variant={assignmentFilter === lvl ? "secondary" : "ghost"} 
                          size="sm" 
                          onClick={() => setAssignmentFilter(lvl)}
                          className={`rounded-full font-black text-[10px] uppercase tracking-widest border-2 ${assignmentFilter === lvl ? 'bg-primary text-white border-primary' : 'border-white/50'}`}
                        >
                          {lvl}
                        </Button>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={handleAssignAll} className="rounded-xl font-black border-4 border-white bg-white/50 hover:bg-white text-xs">ASSIGN ALL</Button>
                      <Button variant="ghost" size="sm" onClick={handleRemoveAll} className="rounded-xl font-black text-destructive hover:bg-destructive/10 text-xs">CLEAR ALL</Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredAssignments.map(word => {
                      const isAssigned = selectedClass.assignedWordIds?.includes(word.id);
                      return (
                        <Card key={word.id} className={`rounded-[2rem] border-8 transition-all ${isAssigned ? 'border-primary bg-primary/5 shadow-xl scale-[1.02]' : 'border-white bg-white/60 shadow-md'}`}>
                          <CardContent className="p-6 flex flex-col gap-4">
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="text-2xl font-black uppercase tracking-tight text-primary">{word.word}</h4>
                                <Badge variant="outline" className="text-[10px] font-black uppercase tracking-widest mt-1 border-primary/20">{word.difficulty}</Badge>
                              </div>
                              <Button 
                                size="icon" 
                                variant="ghost"
                                onClick={() => toggleWordAssignment(word.id)}
                                className={`rounded-full h-12 w-12 border-4 transition-all ${isAssigned ? 'bg-primary border-white text-white hover:scale-110 shadow-lg' : 'border-white bg-white/50 hover:border-primary/50'}`}
                              >
                                {isAssigned ? <CheckCircle className="h-6 w-6" /> : <Circle className="h-6 w-6" />}
                              </Button>
                            </div>
                            <p className="text-sm italic font-medium text-muted-foreground line-clamp-2">"{word.definition}"</p>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </TabsContent>

                <TabsContent value="pupils" className="space-y-4 outline-none">
                  {pupils?.length === 0 && (
                    <div className="bg-white/40 p-12 rounded-[3rem] border-8 border-white border-dashed text-center">
                       <p className="text-xl font-bold text-muted-foreground">No pupils have joined this class yet!</p>
                       <p className="text-sm text-muted-foreground mt-2">Share code <span className="font-black text-accent">{selectedClass.code}</span> with them.</p>
                    </div>
                  )}
                  {pupils?.map(p => (
                    <Card key={p.id} className="rounded-[2.5rem] border-8 border-white bg-white/80 shadow-2xl hover:scale-[1.01] transition-all">
                      <CardContent className="p-8 flex flex-col sm:flex-row justify-between items-center gap-6">
                        <div className="flex items-center gap-4">
                          <div className="bg-secondary/10 p-5 rounded-[1.5rem] border-4 border-secondary/20 shadow-inner"><Trophy className="text-secondary h-8 w-8" /></div>
                          <div className="text-center sm:text-left">
                             <p className="text-2xl font-black">{p.pupilName || "Explorer"}</p>
                             <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Pupil ID: {p.id.substring(0, 8)}</p>
                          </div>
                        </div>
                        <div className="flex gap-8 bg-white/50 p-4 rounded-2xl border-2 border-white">
                          <div className="text-center">
                             <p className="text-[10px] font-black uppercase text-muted-foreground mb-1 tracking-widest">Stars</p>
                             <p className="text-4xl font-black text-primary">{p.stars}</p>
                          </div>
                          <div className="text-center border-l-4 border-white/50 pl-8">
                             <p className="text-[10px] font-black uppercase text-muted-foreground mb-1 tracking-widest">Mastered</p>
                             <p className="text-4xl font-black text-secondary">{p.wordsMastered}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </TabsContent>
              </Tabs>
            </div>
          ) : (
            <div className="h-[60vh] flex flex-col items-center justify-center text-center bg-white/40 border-[1rem] border-white rounded-[4rem] shadow-3xl p-12 space-y-8 animate-in fade-in">
               <div className="bg-primary/20 p-10 rounded-full border-4 border-primary/20 animate-bounce-subtle">
                 <LayoutDashboard className="h-24 w-24 text-primary" />
               </div>
               <div>
                 <h3 className="text-4xl font-black uppercase tracking-tight">Select a Class</h3>
                 <p className="text-xl font-bold text-muted-foreground max-w-md mx-auto mt-4">Choose one of your classrooms from the sidebar to start managing your pupils and words!</p>
               </div>
               <Button onClick={() => setIsCreateOpen(true)} className="btn-bouncy rounded-full px-12 h-20 text-2xl font-black bg-primary text-white shadow-2xl">Create Your First Class</Button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
