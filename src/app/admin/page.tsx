"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, ArrowLeft, Search, GraduationCap, Loader2, Volume2, Sparkles, CheckCircle, Circle, MoreVertical, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useGameStore, type Difficulty } from "@/lib/game-store";
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
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { generateWordImage } from "@/ai/flows/generate-word-image";
import { getPronunciation } from "@/ai/flows/pronunciation-flow";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export default function AdminDashboard() {
  const router = useRouter();
  const { toast } = useToast();
  const { allWords, customWords, addCustomWord, deleteCustomWord, isLoaded, activeClass, toggleWordAssignment } = useGameStore();
  
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
  
  // State for revealed actions overlay
  const [revealedWordId, setRevealedWordId] = useState<string | null>(null);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  const handleAddWord = () => {
    if (!newWord.word || !newWord.definition) return;
    addCustomWord(newWord);
    setNewWord({ word: "", definition: "", exampleSentence: "", theme: "", imageUrl: "", phonemes: "", audioUrl: "", difficulty: "beginner" });
    setIsDialogOpen(false);
    toast({ title: "Word Added", description: `${newWord.word} is now in the bank!` });
  };

  const handleAIGenerateImage = async () => {
    if (!newWord.word) return;
    setIsGeneratingImage(true);
    try {
      const { imageUrl } = await generateWordImage({ word: newWord.word, theme: newWord.theme });
      setNewWord(prev => ({ ...prev, imageUrl }));
    } catch (error) {
      console.error(error);
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleAIGeneratePronunciation = async () => {
    if (!newWord.word) return;
    setIsGeneratingPronunciation(true);
    try {
      const { phonemes, audioUrl } = await getPronunciation({ word: newWord.word });
      setNewWord(prev => ({ ...prev, phonemes, audioUrl }));
    } catch (error) {
      console.error(error);
    } finally {
      setIsGeneratingPronunciation(false);
    }
  };

  const filteredWords = allWords.filter(w => 
    w.word.toLowerCase().includes(searchTerm.toLowerCase()) || 
    w.theme?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    w.difficulty.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = (id: string, word: string) => {
    if (confirm(`Are you sure you want to delete "${word}" from the bank?`)) {
      deleteCustomWord(id);
      setRevealedWordId(null);
      toast({ title: "Word Deleted", variant: "destructive" });
    }
  };

  // Gesture Handlers
  const handleTouchStart = (id: string) => {
    longPressTimer.current = setTimeout(() => {
      setRevealedWordId(id);
    }, 600); // 600ms hold for long press
  };

  const handleTouchEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }
  };

  const handleDoubleClick = (id: string) => {
    setRevealedWordId(id);
  };

  return (
    <div className="min-h-screen bg-background p-4 sm:p-12 max-w-6xl mx-auto space-y-8">
      <header className="flex flex-col sm:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => router.push("/")} className="rounded-xl shrink-0">
            <ArrowLeft />
          </Button>
          <div>
            <h1 className="text-3xl font-black flex items-center gap-2">
              <GraduationCap className="text-accent h-8 w-8" /> Word Bank
            </h1>
            <p className="text-sm text-muted-foreground font-medium">Manage all spelling words and assignments</p>
          </div>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-xl bg-primary hover:bg-primary/90 font-bold px-8 h-14 shadow-lg">
              <Plus className="mr-2 h-5 w-5" /> Add New Word
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-[3rem] p-10 max-w-2xl overflow-y-auto max-h-[90vh]">
            <DialogHeader>
              <DialogTitle className="text-3xl font-black">New Word</DialogTitle>
              <DialogDescription>Create a custom challenge with AI-generated visuals and sound.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-6 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="font-bold">Spelling Word</Label>
                  <Input placeholder="E.g., COMPUTER" value={newWord.word} onChange={e => setNewWord({...newWord, word: e.target.value.toUpperCase()})} />
                </div>
                <div className="space-y-2">
                  <Label className="font-bold">Difficulty</Label>
                  <Select value={newWord.difficulty} onValueChange={(v: Difficulty) => setNewWord({...newWord, difficulty: v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">Beginner</SelectItem>
                      <SelectItem value="intermediate">Explorer</SelectItem>
                      <SelectItem value="advanced">Wizard</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label className="font-bold">Image URL</Label>
                    <Button variant="ghost" size="sm" onClick={handleAIGenerateImage} disabled={isGeneratingImage || !newWord.word} className="text-accent font-black h-8">
                      {isGeneratingImage ? <Loader2 className="animate-spin h-4 w-4 mr-1" /> : <Sparkles className="h-4 w-4 mr-1" />} AI Art
                    </Button>
                  </div>
                  <Input placeholder="https://..." value={newWord.imageUrl} onChange={e => setNewWord({...newWord, imageUrl: e.target.value})} />
                </div>
                <div className="space-y-2">
                   <div className="flex justify-between items-center">
                    <Label className="font-bold">Sound & IPA</Label>
                    <Button variant="ghost" size="sm" onClick={handleAIGeneratePronunciation} disabled={isGeneratingPronunciation || !newWord.word} className="text-secondary font-black h-8">
                      {isGeneratingPronunciation ? <Loader2 className="animate-spin h-4 w-4 mr-1" /> : <Volume2 className="h-4 w-4 mr-1" />} AI Speak
                    </Button>
                  </div>
                  <Input placeholder="/ipa-phonetics/" value={newWord.phonemes} onChange={e => setNewWord({...newWord, phonemes: e.target.value})} />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="font-bold">Definition</Label>
                <Textarea placeholder="Explain to a child..." value={newWord.definition} onChange={e => setNewWord({...newWord, definition: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label className="font-bold">Example Sentence</Label>
                <Textarea placeholder="The computer is..." value={newWord.exampleSentence} onChange={e => setNewWord({...newWord, exampleSentence: e.target.value})} />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleAddWord} className="w-full btn-bouncy bg-primary text-white h-16 rounded-2xl text-xl font-black shadow-xl">
                SAVE TO BANK!
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </header>

      <main className="space-y-8">
        <div className="bg-white/50 p-4 rounded-3xl border-2 border-dashed text-center">
          <p className="text-xs font-black text-muted-foreground uppercase tracking-widest">
            💡 Double-click or hold a card to Assign or Delete
          </p>
        </div>

        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input 
            placeholder="Search words, themes, or difficulty..." 
            className="pl-12 h-16 rounded-3xl border-4 border-white shadow-xl text-lg font-bold"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredWords.map((word) => {
            const isCustom = customWords.some(w => w.id === word.id);
            const isAssigned = activeClass?.assignedWordIds?.includes(word.id);
            const isRevealed = revealedWordId === word.id;
            
            return (
              <Card 
                key={word.id} 
                onDoubleClick={() => handleDoubleClick(word.id)}
                onTouchStart={() => handleTouchStart(word.id)}
                onTouchEnd={handleTouchEnd}
                className={cn(
                  "rounded-[3rem] border-8 shadow-2xl overflow-hidden flex flex-col group transition-all relative select-none cursor-pointer",
                  isAssigned ? "border-primary/40 bg-primary/5" : "border-white bg-background",
                  isRevealed ? "scale-105 shadow-primary/20" : "hover:-translate-y-2"
                )}
              >
                {/* Actions Overlay */}
                {isRevealed && (
                  <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center p-6 space-y-4 animate-in fade-in duration-200">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => setRevealedWordId(null)}
                      className="absolute top-4 right-4 text-white hover:bg-white/20 rounded-full"
                    >
                      <X className="h-8 w-8" />
                    </Button>
                    
                    <h3 className="text-2xl font-black text-white uppercase">{word.word}</h3>
                    
                    <div className="w-full flex flex-col gap-3">
                      {activeClass ? (
                        <Button 
                          onClick={() => {
                            toggleWordAssignment(word.id);
                            setRevealedWordId(null);
                          }}
                          className={cn(
                            "w-full h-14 rounded-2xl font-black text-lg",
                            isAssigned ? "bg-white text-primary" : "bg-primary text-white"
                          )}
                        >
                          {isAssigned ? <X className="mr-2" /> : <CheckCircle className="mr-2" />}
                          {isAssigned ? "REMOVE FROM CLASS" : "ASSIGN TO CLASS"}
                        </Button>
                      ) : (
                        <p className="text-white/60 text-xs font-bold text-center">Join a class to assign words</p>
                      )}
                      
                      {isCustom && (
                        <Button 
                          variant="destructive" 
                          onClick={() => handleDelete(word.id, word.word)}
                          className="w-full h-14 rounded-2xl font-black text-lg"
                        >
                          <Trash2 className="mr-2" /> DELETE WORD
                        </Button>
                      )}
                    </div>
                  </div>
                )}

                <div className="aspect-video relative bg-muted">
                  <Image 
                    src={word.imageUrl || `https://picsum.photos/seed/${word.id}/600/400`} 
                    alt={word.word}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform"
                  />
                  <div className="absolute top-4 left-4 flex flex-wrap gap-2">
                    <Badge className="bg-white/90 text-primary font-black uppercase text-[10px]">{word.difficulty}</Badge>
                    {isCustom && <Badge className="bg-accent text-white font-black uppercase text-[10px]">Custom</Badge>}
                    {isAssigned && <Badge className="bg-primary text-white font-black uppercase text-[10px]">Assigned</Badge>}
                  </div>

                  <div className="absolute top-4 right-4">
                    <div className="bg-white/80 p-2 rounded-full shadow-lg">
                      <MoreVertical className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </div>
                </div>

                <CardHeader className="p-6 pb-2">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-3xl font-black text-primary uppercase">{word.word}</CardTitle>
                    <div className="flex gap-2">
                      {word.audioUrl && <Volume2 className="h-5 w-5 text-accent" />}
                    </div>
                  </div>
                  {word.phonemes && <p className="text-xs font-black text-accent/70 tracking-widest">{word.phonemes}</p>}
                </CardHeader>
                <CardContent className="p-6 pt-2 space-y-4 flex-1">
                  <p className="text-sm italic text-muted-foreground">"{word.definition}"</p>
                  <p className="text-xs font-medium bg-muted/30 p-3 rounded-xl border border-dashed">{word.exampleSentence}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </main>
    </div>
  );
}
