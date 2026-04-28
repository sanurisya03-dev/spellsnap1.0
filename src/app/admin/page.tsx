
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, LogIn, Plus, Trash2, ArrowLeft, Search, Loader2, Volume2, Sparkles, Eye, X } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useGameStore, type Difficulty } from "@/lib/game-store";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { generateWordImage } from "@/ai/flows/generate-word-image";
import { getPronunciation } from "@/ai/flows/pronunciation-flow";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useUser, useAuth } from "@/firebase";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";

export default function AdminDashboard() {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useUser();
  const auth = useAuth();
  const { allWords, addCustomWord, deleteCustomWord, isLoaded, loadingData } = useGameStore();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [newWord, setNewWord] = useState({ 
    word: "", 
    definition: "", 
    exampleSentence: "", 
    theme: "", 
    imageUrl: "",
    phonemes: "",
    audioUrl: "",
    difficulty: "beginner" as Difficulty
  });
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [isGeneratingPronunciation, setIsGeneratingPronunciation] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSignIn = async () => {
    if (!auth) return;
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      toast({ title: "Welcome!", description: "You can now manage the word bank." });
    } catch (error: any) {
      console.error("Sign in failed:", error);
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: error.message || "Please check your Firebase configuration.",
      });
    }
  };

  const handleAddWord = async () => {
    if (!newWord.word || !newWord.definition) {
      toast({ variant: "destructive", title: "Wait!", description: "A word needs a name and a definition!" });
      return;
    }
    
    setIsSaving(true);
    try {
      await addCustomWord(newWord);
      setNewWord({ word: "", definition: "", exampleSentence: "", theme: "", imageUrl: "", phonemes: "", audioUrl: "", difficulty: "beginner" });
      setIsDialogOpen(false);
      toast({ title: "Word Saved! ✨", description: `${newWord.word} has been added to the bank.` });
    } catch (error: any) {
      console.error(error);
      toast({ variant: "destructive", title: "Save Error", description: "Something went wrong while saving." });
    } finally {
      setIsSaving(false);
    }
  };

  const handleAIGenerateImage = async () => {
    if (!newWord.word) {
      toast({ variant: "destructive", title: "Word Missing", description: "Type a word first!" });
      return;
    }
    setIsGeneratingImage(true);
    try {
      const { imageUrl } = await generateWordImage({ word: newWord.word, theme: newWord.theme });
      setNewWord(prev => ({ ...prev, imageUrl }));
      toast({ title: "Image Generated!" });
    } catch (error) {
      console.error(error);
      toast({ variant: "destructive", title: "AI Error", description: "Failed to create an image." });
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleAIGeneratePronunciation = async () => {
    if (!newWord.word) {
      toast({ variant: "destructive", title: "Word Missing", description: "Type a word first!" });
      return;
    }
    setIsGeneratingPronunciation(true);
    try {
      const { phonemes, audioUrl } = await getPronunciation({ word: newWord.word });
      setNewWord(prev => ({ ...prev, phonemes, audioUrl }));
      toast({ title: "Sound Generated!" });
    } catch (error) {
      console.error(error);
      toast({ variant: "destructive", title: "AI Error", description: "Failed to generate pronunciation." });
    } finally {
      setIsGeneratingPronunciation(false);
    }
  };

  const playAudio = (url?: string, text?: string) => {
    if (url) {
      const audio = new Audio(url);
      audio.play().catch(() => speakText(text || ""));
    } else if (text) {
      speakText(text);
    }
  };

  const speakText = (text: string) => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      window.speechSynthesis.speak(utterance);
    }
  };

  const filteredWords = allWords.filter(w => 
    w.word.toLowerCase().includes(searchTerm.toLowerCase()) || 
    w.theme?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = async (e: React.MouseEvent, id: string, word: string) => {
    e.stopPropagation();
    if (confirm(`Are you sure you want to delete "${word}"?`)) {
      try {
        await deleteCustomWord(id);
        toast({ title: "Deleted", description: `"${word}" has been removed.`, variant: "destructive" });
      } catch (err) {
        toast({ title: "Error", description: "Failed to delete word.", variant: "destructive" });
      }
    }
  };

  if (!isLoaded) return <div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;

  return (
    <div className="min-h-screen bg-background p-4 sm:p-12 max-w-6xl mx-auto space-y-8">
      <header className="flex flex-col sm:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => router.push("/")} className="rounded-xl shrink-0 border-4 border-white shadow-lg"><ArrowLeft /></Button>
          <div>
            <h1 className="text-3xl font-black flex items-center gap-2"><Eye className="text-primary" /> Word Explorer</h1>
            <p className="text-sm text-muted-foreground font-medium">Curriculum Words</p>
          </div>
        </div>

        <div className="flex gap-3">
          {user ? (
            <>
              <Link href="/admin/generator">
                <Button variant="outline" className="rounded-xl border-4 border-white shadow-lg bg-white/50 h-14 font-black"><Sparkles className="mr-2 h-5 w-5 text-yellow-500" /> AI Assistant</Button>
              </Link>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="rounded-xl bg-primary hover:bg-primary/90 font-black px-8 h-14 shadow-xl border-4 border-white text-white"><Plus className="mr-2" /> Add Word</Button>
                </DialogTrigger>
                <DialogContent className="rounded-[3rem] p-8 max-w-2xl bg-white border-8 border-white shadow-3xl">
                  <DialogHeader><DialogTitle className="text-3xl font-black">NEW WORD</DialogTitle></DialogHeader>
                  <div className="grid gap-6 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="font-bold">Word</Label>
                        <input className="flex h-12 w-full rounded-xl border-4 border-primary/10 px-4 font-bold" value={newWord.word} onChange={e => setNewWord({...newWord, word: e.target.value.toUpperCase()})} placeholder="E.G. APPLE" />
                      </div>
                      <div className="space-y-2">
                        <Label className="font-bold">Difficulty Level</Label>
                        <Select value={newWord.difficulty} onValueChange={(v: Difficulty) => setNewWord({...newWord, difficulty: v})}>
                          <SelectTrigger className="h-12 border-4 border-primary/10 rounded-xl"><SelectValue /></SelectTrigger>
                          <SelectContent><SelectItem value="beginner">Beginner</SelectItem><SelectItem value="intermediate">Explorer</SelectItem><SelectItem value="advanced">Wizard</SelectItem></SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <Button variant="outline" onClick={handleAIGenerateImage} disabled={isGeneratingImage || !newWord.word} className="flex-1 h-12 rounded-xl font-bold border-2 border-secondary/20">
                        {isGeneratingImage ? <Loader2 className="animate-spin h-5 w-5" /> : <Sparkles className="h-5 w-5 mr-2 text-primary" />} Magic Image
                      </Button>
                      <Button variant="outline" onClick={handleAIGeneratePronunciation} disabled={isGeneratingPronunciation || !newWord.word} className="flex-1 h-12 rounded-xl font-bold border-2 border-secondary/20">
                        {isGeneratingPronunciation ? <Loader2 className="animate-spin h-5 w-5" /> : <Volume2 className="h-5 w-5 mr-2 text-primary" />} Magic Sound
                      </Button>
                    </div>
                    <div className="space-y-2">
                      <Label className="font-bold">What does it mean?</Label>
                      <Textarea value={newWord.definition} onChange={e => setNewWord({...newWord, definition: e.target.value})} className="rounded-xl border-2" placeholder="Describe the word simply..." />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button onClick={handleAddWord} disabled={isSaving} className="w-full btn-bouncy bg-primary text-white h-16 rounded-2xl text-xl font-black shadow-xl">
                      {isSaving ? <Loader2 className="animate-spin mr-2" /> : "SAVE TO BANK"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </>
          ) : (
            <Button onClick={handleSignIn} className="rounded-xl bg-primary hover:bg-primary/90 font-black px-8 h-14 shadow-xl border-4 border-white text-white"><LogIn className="mr-2" /> Teacher Log In</Button>
          )}
        </div>
      </header>

      <div className="relative">
        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-muted-foreground h-6 w-6" />
        <input placeholder="Search for a word..." className="flex w-full rounded-[2rem] border-8 border-white bg-background pl-16 h-20 shadow-2xl text-xl font-black focus:outline-none" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-20">
        {loadingData && filteredWords.length === 0 && (
          <div className="col-span-full py-20 text-center">
            <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
            <p className="mt-4 font-bold text-muted-foreground">Opening the vault...</p>
          </div>
        )}
        
        {filteredWords.map(word => (
          <Card key={word.id} className="rounded-[3rem] border-8 border-white shadow-2xl overflow-hidden group hover:-translate-y-2 transition-all cursor-pointer" onClick={() => playAudio(word.audioUrl, word.word)}>
            <div className="aspect-video relative bg-muted">
              {word.imageUrl && <Image src={word.imageUrl} alt={word.word} fill className="object-cover" />}
              <Badge className="absolute top-4 left-4 bg-white/90 text-primary font-black uppercase text-xs">{word.difficulty}</Badge>
              {user && (
                <Button variant="destructive" size="icon" onClick={(e) => handleDelete(e, word.id, word.word)} className="absolute top-4 right-4 h-10 w-10 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity">
                  <Trash2 className="h-5 w-5" />
                </Button>
              )}
            </div>
            <CardHeader className="p-6">
              <div className="flex justify-between items-center">
                <CardTitle className="text-4xl font-black text-primary uppercase">{word.word}</CardTitle>
                <Volume2 className="h-6 w-6 text-secondary" />
              </div>
              {word.phonemes && <p className="text-xs font-black text-secondary/70 tracking-widest uppercase">{word.phonemes}</p>}
            </CardHeader>
            <CardContent className="p-6 pt-0">
              <p className="text-lg italic text-muted-foreground font-bold leading-tight">"{word.definition}"</p>
            </CardContent>
          </Card>
        ))}
        
        {!loadingData && filteredWords.length === 0 && (
          <div className="col-span-full py-20 text-center space-y-4">
             <div className="bg-white p-10 rounded-full inline-block border-8 border-white shadow-xl">
               <BookOpen className="h-20 w-20 text-muted-foreground opacity-20" />
             </div>
             <p className="text-2xl font-black text-muted-foreground">The bank is currently empty.</p>
          </div>
        )}
      </div>
    </div>
  );
}
