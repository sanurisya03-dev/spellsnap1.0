"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, ArrowLeft, Search, GraduationCap, Loader2, Image as ImageIcon, Sparkles, BrainCircuit } from "lucide-react";
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
import Image from "next/image";

export default function AdminDashboard() {
  const router = useRouter();
  const { allWords, customWords, addCustomWord, deleteCustomWord, isLoaded } = useGameStore();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [newWord, setNewWord] = useState({ 
    word: "", 
    definition: "", 
    exampleSentence: "", 
    theme: "", 
    imageUrl: "",
    difficulty: "beginner" as Difficulty
  });
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  const handleAddWord = () => {
    if (!newWord.word || !newWord.definition) return;
    addCustomWord({
      ...newWord
    });
    setNewWord({ word: "", definition: "", exampleSentence: "", theme: "", imageUrl: "", difficulty: "beginner" });
    setIsDialogOpen(false);
  };

  const handleAIGenerateImage = async () => {
    if (!newWord.word) return;
    setIsGeneratingImage(true);
    try {
      const { imageUrl } = await generateWordImage({ word: newWord.word, theme: newWord.theme });
      setNewWord(prev => ({ ...prev, imageUrl }));
    } catch (error) {
      console.error("Failed to generate image:", error);
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const filteredWords = allWords.filter(w => 
    w.word.toLowerCase().includes(searchTerm.toLowerCase()) || 
    w.theme?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    w.difficulty.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background p-4 sm:p-8 md:p-12 max-w-6xl mx-auto space-y-6 md:space-y-8">
      <header className="flex flex-col sm:flex-row justify-between items-center gap-4 sm:gap-6">
        <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto">
          <Button variant="outline" size="icon" onClick={() => router.push("/")} className="rounded-xl shrink-0">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-3xl font-black flex items-center gap-2 truncate">
              <GraduationCap className="text-accent h-5 w-5 sm:h-8 sm:w-8" /> Word Management
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground truncate">Customise spelling lists and visuals</p>
          </div>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-4 sm:px-6 h-10 sm:h-12">
              <Plus className="mr-1.5 sm:mr-2 h-4 w-4 sm:h-5 sm:w-5" /> Add New Word
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-2xl sm:rounded-3xl w-[95vw] sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="text-xl sm:text-2xl font-black">Add Spelling Word</DialogTitle>
              <DialogDescription className="text-xs sm:text-base">
                Create a new challenge with custom difficulty and visuals.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-3 sm:gap-4 py-2 sm:py-4 max-h-[60vh] overflow-y-auto pr-1">
              <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="word" className="font-bold text-xs sm:text-sm">Spelling Word</Label>
                <Input 
                  id="word" 
                  placeholder="e.g., ELEPHANT" 
                  value={newWord.word} 
                  onChange={(e) => setNewWord({...newWord, word: e.target.value.toUpperCase()})}
                  className="h-10 sm:h-12"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-1.5 sm:space-y-2">
                  <Label htmlFor="difficulty" className="font-bold text-xs sm:text-sm">Difficulty</Label>
                  <Select 
                    value={newWord.difficulty} 
                    onValueChange={(val: Difficulty) => setNewWord({...newWord, difficulty: val})}
                  >
                    <SelectTrigger id="difficulty" className="h-10 sm:h-12">
                      <SelectValue placeholder="Select Level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">Beginner</SelectItem>
                      <SelectItem value="intermediate">Explorer</SelectItem>
                      <SelectItem value="advanced">Wizard</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5 sm:space-y-2">
                  <Label htmlFor="theme" className="font-bold text-xs sm:text-sm">Theme</Label>
                  <Input 
                    id="theme" 
                    placeholder="Animals" 
                    value={newWord.theme} 
                    onChange={(e) => setNewWord({...newWord, theme: e.target.value})}
                    className="h-10 sm:h-12"
                  />
                </div>
              </div>
              <div className="space-y-1.5 sm:space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="imageUrl" className="font-bold text-xs sm:text-sm">Image URL (or AI Magic)</Label>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleAIGenerateImage} 
                    disabled={!newWord.word || isGeneratingImage}
                    className="h-7 text-[10px] font-black text-accent hover:bg-accent/10"
                  >
                    {isGeneratingImage ? <Loader2 className="animate-spin h-3 w-3 mr-1" /> : <Sparkles className="h-3 w-3 mr-1" />}
                    AI Magic
                  </Button>
                </div>
                <Input 
                  id="imageUrl" 
                  placeholder="Paste URL or click AI Magic" 
                  value={newWord.imageUrl}
                  onChange={(e) => setNewWord({...newWord, imageUrl: e.target.value})}
                  className="h-10 sm:h-12"
                />
              </div>
              <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="definition" className="font-bold text-xs sm:text-sm">Simple Definition</Label>
                <Textarea 
                  id="definition" 
                  placeholder="A simple explanation for kids..." 
                  value={newWord.definition}
                  onChange={(e) => setNewWord({...newWord, definition: e.target.value})}
                  className="min-h-[60px]"
                />
              </div>
              <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="example" className="font-bold text-xs sm:text-sm">Example Sentence</Label>
                <Textarea 
                  id="example" 
                  placeholder="Use the word in a sentence..." 
                  value={newWord.exampleSentence}
                  onChange={(e) => setNewWord({...newWord, exampleSentence: e.target.value})}
                  className="min-h-[60px]"
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleAddWord} className="w-full bg-accent hover:bg-accent/90 rounded-xl font-bold h-10 sm:h-12">
                Save Word
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </header>

      <main className="space-y-4 sm:space-y-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4 sm:h-5 sm:w-5" />
          <Input 
            placeholder="Search words, themes, or difficulty..." 
            className="pl-9 sm:pl-10 h-10 sm:h-12 rounded-xl sm:rounded-2xl border-2 border-primary/20 focus:border-primary transition-all text-sm sm:text-base"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {filteredWords.map((word) => (
            <Card key={word.id} className="rounded-2xl sm:rounded-3xl border-2 hover:border-primary transition-all group overflow-hidden flex flex-col">
              <div className="aspect-video relative w-full overflow-hidden bg-muted">
                <Image 
                  src={word.imageUrl || `https://picsum.photos/seed/${word.id}/600/400`} 
                  alt={word.word}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-3 left-3 flex gap-1.5">
                  <span className="bg-white/90 backdrop-blur-sm px-2 py-0.5 rounded-full text-[8px] sm:text-[10px] font-black uppercase text-accent border border-accent/20">
                    {word.theme || "General"}
                  </span>
                  <span className={`bg-white/90 backdrop-blur-sm px-2 py-0.5 rounded-full text-[8px] sm:text-[10px] font-black uppercase border ${
                    word.difficulty === 'beginner' ? 'text-primary border-primary/20' : 
                    word.difficulty === 'intermediate' ? 'text-accent border-accent/20' : 
                    'text-secondary border-secondary/20'
                  }`}>
                    {word.difficulty}
                  </span>
                </div>
              </div>
              <CardHeader className="pb-1 sm:pb-2 p-4">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-xl sm:text-2xl font-black text-primary uppercase truncate pr-2">{word.word}</CardTitle>
                  {customWords.some(w => w.id === word.id) && (
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => deleteCustomWord(word.id)}
                      className="text-destructive hover:bg-destructive/10 shrink-0 h-8 w-8"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="pt-0 p-4 space-y-2 sm:space-y-3 flex-1">
                <div>
                  <h4 className="text-[8px] sm:text-[10px] font-black text-muted-foreground uppercase mb-0.5">Meaning</h4>
                  <p className="text-xs sm:text-sm italic line-clamp-2">"{word.definition}"</p>
                </div>
                <div>
                  <h4 className="text-[8px] sm:text-[10px] font-black text-muted-foreground uppercase mb-0.5">Example</h4>
                  <p className="text-xs sm:text-sm font-medium leading-tight line-clamp-2">{word.exampleSentence}</p>
                </div>
              </CardContent>
            </Card>
          ))}
          {filteredWords.length === 0 && (
            <div className="col-span-full py-12 text-center text-muted-foreground">
               <p className="text-lg font-bold">No words found match your search.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
