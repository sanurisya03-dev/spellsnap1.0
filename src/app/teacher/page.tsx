
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
import { useGameStore, Classroom, PupilProgress, WordItem } from "@/lib/game-store";
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

  const [activeTab, setActiveTab] = useState("classes");
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newClassName, setNewClassName] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const handleSignIn = async () => {
    if (!auth) return;
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Sign in failed:", error);
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
    if (!db || !user?.uid) return;
    
    if (!newClassName.trim()) {
      toast({
        variant: "destructive",
        title: "Class Name Required",
        description: "Please enter a name for your classroom."
      });
      return;
    }

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
    
    addDoc(classroomRef, data)
      .then(() => {
        toast({ title: "Class Created!", description: `The join code is ${code}` });
        setNewClassName("");
        setIsCreateOpen(false);
      })
      .catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
          path: classroomRef.path,
          operation: 'create',
          requestResourceData: data,
        } satisfies SecurityRuleContext);
        errorEmitter.emit('permission-error', permissionError);
      })
      .finally(() => {
        setIsCreating(false);
      });
  };

  const toggleWordAssignment = (wordId: string) => {
    if (!db || !selectedClass) return;
    
    const current = selectedClass.assignedWordIds || [];
    const next = current.includes(wordId) 
      ? current.filter(id => id !== wordId)
      : [...current, wordId];
    
    const docRef = doc(db, 'classrooms', selectedClass.id);
    
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
        <div className="bg-primary/10 p-12 rounded-[4rem] border-8 border-white shadow-3xl">
          <Settings className="h-24 w-24 text-primary mx-auto mb-6" />
          <h1 className="text-4xl font-black mb-4">Teacher Access</h1>
          <p className="text-xl text-muted-foreground max-w-md mx-auto mb-8">
            Please sign in with your teacher account to manage classrooms and assignments.
          </p>
          <Button onClick={handleSignIn} className="btn-bouncy px-12 py-8 text-2xl bg-primary text-white">
            <LogIn className="mr-3 h-6 w-6" /> Teacher Login
          </Button>
        </div>
        <Button variant="ghost" onClick={() => router.push("/")} className="text-muted-foreground font-bold">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Lobby
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6 md:p-12 max-w-6xl mx-auto space-y-8">
      <header className="flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => router.push("/")} className="rounded-xl">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-black flex items-center gap-2">
              <LayoutDashboard className="text-primary" /> Teacher Dashboard
            </h1>
            <p className="text-muted-foreground">Manage your pupils and curriculum</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/admin">
            <Button variant="outline" className="rounded-xl font-bold border-2">
              <BookOpen className="mr-2 h-5 w-5 text-orange-500" /> Manage Word Bank
            </Button>
          </Link>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="rounded-xl bg-primary hover:bg-primary/90 font-bold">
                <Plus className="mr-2 h-5 w-5" /> Create New Class
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-[3rem]">
              <DialogHeader>
                <DialogTitle className="text-2xl font-black">New Classroom</DialogTitle>
                <DialogDescription>Create a space for your pupils to learn.</DialogDescription>
              </DialogHeader>
              <div className="py-4 space-y-4">
                <div className="space-y-2">
                  <Label className="font-bold">Class Name</Label>
                  <Input 
                    placeholder="e.g., Year 3 Blue" 
                    value={newClassName} 
                    onChange={(e) => setNewClassName(e.target.value)} 
                    className="rounded-xl border-2 h-12"
                    disabled={isCreating}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button 
                  onClick={handleCreateClass} 
                  className="w-full bg-primary hover:bg-primary/90 h-14 rounded-2xl font-black text-lg"
                  disabled={isCreating}
                >
                  {isCreating ? <Loader2 className="animate-spin h-5 w-5 mr-2" /> : "Create Class"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <aside className="md:col-span-1 space-y-4">
          <h3 className="font-black text-sm uppercase tracking-widest text-muted-foreground ml-2">My Classes</h3>
          <div className="flex flex-col gap-2">
            {myClasses?.map(c => (
              <Button 
                key={c.id}
                variant={selectedClassId === c.id ? "default" : "outline"}
                onClick={() => setSelectedClassId(c.id)}
                className="justify-start h-14 rounded-2xl border-2 font-bold transition-all"
              >
                <Users className="mr-2 h-5 w-5" /> {c.name}
              </Button>
            ))}
            {myClasses?.length === 0 && (
              <div className="text-center p-6 text-muted-foreground bg-muted/20 rounded-3xl border-2 border-dashed">
                No classes yet.
              </div>
            )}
          </div>
        </aside>

        <main className="md:col-span-3">
          {selectedClass ? (
            <div className="space-y-6">
              <div className="bg-white p-8 rounded-[3rem] border-8 border-white shadow-2xl flex justify-between items-center">
                 <div>
                    <h2 className="text-4xl font-black text-foreground">{selectedClass.name}</h2>
                    <p className="text-muted-foreground font-bold">Manage lessons and view pupil results.</p>
                 </div>
                 <div className="bg-accent/10 p-4 rounded-3xl border-4 border-accent/20 flex flex-col items-center">
                    <span className="text-[10px] font-black uppercase tracking-widest text-accent">Join Code</span>
                    <button onClick={() => copyCode(selectedClass.code)} className="flex items-center gap-2 hover:opacity-80">
                       <span className="text-3xl font-black text-accent">{selectedClass.code}</span>
                       <Copy className="h-4 w-4 text-accent" />
                    </button>
                 </div>
              </div>

              <Tabs defaultValue="assignments" className="w-full">
                <TabsList className="bg-muted/50 p-1 h-14 rounded-2xl border-2 mb-6">
                  <TabsTrigger value="assignments" className="rounded-xl font-bold h-full px-8 data-[state=active]:bg-white data-[state=active]:shadow-sm">Assignments</TabsTrigger>
                  <TabsTrigger value="pupils" className="rounded-xl font-bold h-full px-8 data-[state=active]:bg-white data-[state=active]:shadow-sm">Pupil Progress</TabsTrigger>
                </TabsList>

                <TabsContent value="assignments" className="space-y-6 animate-in fade-in zoom-in duration-300">
                  <div className="flex justify-between items-center">
                     <div>
                       <h3 className="text-2xl font-black">Assign Words</h3>
                       <p className="text-xs text-muted-foreground">Select words from your bank to assign to this class.</p>
                     </div>
                     <Link href="/admin">
                        <Button variant="ghost" size="sm" className="text-primary font-black">
                          Edit Bank <ExternalLink className="ml-1 h-3 w-3" />
                        </Button>
                     </Link>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {allWords.map(word => {
                      const isAssigned = selectedClass.assignedWordIds?.includes(word.id);
                      return (
                        <Card key={word.id} className={`rounded-3xl border-2 transition-all ${isAssigned ? 'border-primary bg-primary/5' : 'border-muted hover:border-primary/50'}`}>
                          <CardContent className="p-4 flex justify-between items-center gap-4">
                            <div className="flex-1">
                               <p className="text-xl font-black uppercase text-foreground">{word.word}</p>
                               <div className="flex gap-2">
                                 <span className="text-[10px] font-bold text-muted-foreground uppercase">{word.difficulty}</span>
                                 <span className="text-[10px] font-bold text-accent uppercase">{word.theme}</span>
                               </div>
                            </div>
                            <Button 
                              size="sm" 
                              variant={isAssigned ? "default" : "outline"}
                              onClick={() => toggleWordAssignment(word.id)}
                              className="rounded-xl font-black"
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

                <TabsContent value="pupils" className="space-y-6 animate-in fade-in zoom-in duration-300">
                  <div className="space-y-4">
                    {pupils?.map(p => (
                      <Card key={p.id} className="rounded-3xl border-2 border-muted overflow-hidden">
                        <CardContent className="p-6 flex justify-between items-center">
                          <div className="flex items-center gap-4">
                            <div className="bg-secondary/10 p-3 rounded-2xl border-2 border-secondary/20">
                              <Trophy className="text-secondary h-6 w-6" />
                            </div>
                            <div>
                               <p className="text-xl font-black">{p.pupilName || "Unknown Pupil"}</p>
                               <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Pupil ID: {p.id.substring(0, 8)}</p>
                            </div>
                          </div>
                          <div className="flex gap-4">
                            <div className="text-center">
                               <p className="text-[10px] font-black uppercase text-muted-foreground">Stars</p>
                               <p className="text-2xl font-black text-primary">{p.stars}</p>
                            </div>
                            <div className="text-center border-l pl-4">
                               <p className="text-[10px] font-black uppercase text-muted-foreground">Words</p>
                               <p className="text-2xl font-black text-secondary">{p.wordsMastered}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                    {pupils?.length === 0 && (
                       <div className="text-center p-20 bg-muted/10 rounded-[4rem] border-4 border-dashed border-muted">
                          <Users className="h-16 w-16 mx-auto text-muted mb-4 opacity-50" />
                          <p className="text-xl font-bold text-muted-foreground">No pupils have joined this class yet.</p>
                       </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          ) : (
            <div className="h-[60vh] flex flex-col items-center justify-center text-center bg-white/50 border-8 border-white rounded-[4rem] shadow-3xl p-12 space-y-6">
               <div className="bg-primary/10 p-8 rounded-full border-4 border-primary/20">
                  <LayoutDashboard className="h-20 w-20 text-primary" />
               </div>
               <div>
                  <h3 className="text-4xl font-black">Select a Classroom</h3>
                  <p className="text-xl font-medium text-muted-foreground max-w-md">Pick a class from the left to manage word lists and see pupil scores.</p>
               </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
