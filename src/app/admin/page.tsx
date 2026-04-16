"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, ArrowLeft, Search, GraduationCap, LayoutGrid } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useGameStore } from "@/lib/game-store";
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

export default function AdminDashboard() {
  const router = useRouter();
  const { allWords, customWords, addCustomWord, deleteCustomWord, isLoaded } = useGameStore();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [newWord, setNewWord] = useState({ word: "", definition: "", exampleSentence: "", theme: "" });
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  if (!isLoaded) return null;

  const handleAddWord = () => {
    if (!newWord.word || !newWord.definition) return;
    addCustomWord({
      id: Math.random().toString(36).substr(2, 9),
      ...newWord
    });
    setNewWord({ word: "", definition: "", exampleSentence: "", theme: "" });
    setIsDialogOpen(false);
  };

  const filteredWords = allWords.filter(w => 
    w.word.toLowerCase().includes(searchTerm.toLowerCase()) || 
    w.theme?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background p-6 md:p-12 max-w-6xl mx-auto space-y-8">
      <header className="flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => router.push("/")} className="rounded-xl">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-black flex items-center gap-2">
              <GraduationCap className="text-accent" /> Word Management
            </h1>
            <p className="text-muted-foreground">Customise spelling lists for your pupils</p>
          </div>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-6">
              <Plus className="mr-2 h-5 w-5" /> Add New Word
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] rounded-3xl">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black">Add Spelling Word</DialogTitle>
              <DialogDescription>
                Create a new challenge for your learners.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="word" className="font-bold">Spelling Word</Label>
                <Input 
                  id="word" 
                  placeholder="e.g., ELEPHANT" 
                  value={newWord.word} 
                  onChange={(e) => setNewWord({...newWord, word: e.target.value.toUpperCase()})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="theme" className="font-bold">Theme / Category</Label>
                <Input 
                  id="theme" 
                  placeholder="e.g., Animals" 
                  value={newWord.theme} 
                  onChange={(e) => setNewWord({...newWord, theme: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="definition" className="font-bold">Simple Definition</Label>
                <Textarea 
                  id="definition" 
                  placeholder="A simple explanation for kids..." 
                  value={newWord.definition}
                  onChange={(e) => setNewWord({...newWord, definition: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="example" className="font-bold">Example Sentence</Label>
                <Textarea 
                  id="example" 
                  placeholder="Use the word in a sentence..." 
                  value={newWord.exampleSentence}
                  onChange={(e) => setNewWord({...newWord, exampleSentence: e.target.value})}
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleAddWord} className="w-full bg-accent hover:bg-accent/90 rounded-xl font-bold">
                Save to Word Bank
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </header>

      <main className="space-y-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-5 w-5" />
          <Input 
            placeholder="Search words or themes..." 
            className="pl-10 h-12 rounded-2xl border-2 border-primary/20 focus:border-primary transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredWords.map((word) => (
            <Card key={word.id} className="rounded-3xl border-2 hover:border-primary transition-all group overflow-hidden">
              <CardHeader className="bg-primary/5 pb-4">
                <div className="flex justify-between items-start">
                   <div>
                     <span className="bg-white px-3 py-1 rounded-full text-[10px] font-black uppercase text-accent border border-accent/20">
                       {word.theme || "General"}
                     </span>
                     <CardTitle className="text-2xl font-black mt-2 text-primary">{word.word}</CardTitle>
                   </div>
                   {customWords.some(w => w.id === word.id) && (
                     <Button 
                       variant="ghost" 
                       size="icon" 
                       onClick={() => deleteCustomWord(word.id)}
                       className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                     >
                       <Trash2 className="h-5 w-5" />
                     </Button>
                   )}
                </div>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div>
                  <h4 className="text-xs font-bold text-muted-foreground uppercase mb-1">Definition</h4>
                  <p className="text-sm line-clamp-2 italic">"{word.definition}"</p>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-muted-foreground uppercase mb-1">Example</h4>
                  <p className="text-sm font-medium">{word.exampleSentence}</p>
                </div>
              </CardContent>
            </Card>
          ))}
          
          {filteredWords.length === 0 && (
            <div className="col-span-full py-24 text-center space-y-4">
              <div className="bg-muted/30 w-20 h-20 rounded-full flex items-center justify-center mx-auto">
                <Search className="h-10 w-10 text-muted-foreground" />
              </div>
              <div>
                <h3 className="text-xl font-bold">No words found</h3>
                <p className="text-muted-foreground">Try a different search or add a new word!</p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}