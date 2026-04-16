"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, ArrowLeft, Loader2, Plus, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { generateWordList, type GenerateWordListOutput } from "@/ai/flows/ai-powered-word-list-assistant";
import { useGameStore } from "@/lib/game-store";

export default function AIGeneratorPage() {
  const router = useRouter();
  const { addCustomWord } = useGameStore();
  
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<GenerateWordListOutput | null>(null);
  const [form, setForm] = useState({
    theme: "",
    gradeLevel: "Year 1",
    learnerNeeds: "General vocabulary building"
  });
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());

  const handleGenerate = async () => {
    if (!form.theme) return;
    setLoading(true);
    setResults(null);
    setAddedIds(new Set());
    
    try {
      const output = await generateWordList(form);
      setResults(output);
    } catch (error) {
      console.error("AI Generation failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddWord = (wordObj: any, index: number) => {
    addCustomWord({
      id: `ai-${Date.now()}-${index}`,
      word: wordObj.word.toUpperCase(),
      definition: wordObj.definition,
      exampleSentence: wordObj.exampleSentence,
      theme: form.theme
    });
    setAddedIds(prev => new Set(Array.from(prev).concat([index.toString()])));
  };

  return (
    <div className="min-h-screen bg-background p-6 md:p-12 max-w-5xl mx-auto space-y-8">
      <header className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => router.push("/admin")} className="rounded-xl">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-black flex items-center gap-2">
            <Sparkles className="text-primary" /> AI Word Assistant
          </h1>
          <p className="text-muted-foreground">Automatically generate curriculum-aligned spelling lists</p>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <aside className="md:col-span-1">
          <Card className="rounded-3xl border-2 border-primary/20 shadow-sm sticky top-12">
            <CardHeader>
              <CardTitle className="text-xl font-bold">Parameters</CardTitle>
              <CardDescription>Tell the AI what you need</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="font-bold">Topic / Theme</Label>
                <Input 
                  placeholder="e.g., Space, Animals, Jobs" 
                  value={form.theme}
                  onChange={(e) => setForm({...form, theme: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label className="font-bold">Grade Level</Label>
                <Select value={form.gradeLevel} onValueChange={(val) => setForm({...form, gradeLevel: val})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Year" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Year 1">Year 1</SelectItem>
                    <SelectItem value="Year 2">Year 2</SelectItem>
                    <SelectItem value="Year 3">Year 3</SelectItem>
                    <SelectItem value="Beginner ESL">Beginner ESL</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="font-bold">Learner Focus</Label>
                <Input 
                  placeholder="e.g., Vowels, Sight words" 
                  value={form.learnerNeeds}
                  onChange={(e) => setForm({...form, learnerNeeds: e.target.value})}
                />
              </div>
              <Button 
                onClick={handleGenerate} 
                disabled={loading || !form.theme}
                className="w-full bg-primary hover:bg-primary/90 rounded-xl font-black h-12"
              >
                {loading ? <Loader2 className="animate-spin mr-2" /> : <Sparkles className="mr-2 h-5 w-5" />}
                Generate List
              </Button>
            </CardContent>
          </Card>
        </aside>

        <main className="md:col-span-2 space-y-6">
          {!results && !loading && (
            <div className="h-full flex flex-col items-center justify-center text-center p-12 bg-white/50 border-2 border-dashed border-muted rounded-3xl space-y-4">
              <div className="bg-primary/10 p-6 rounded-full">
                <Sparkles className="h-12 w-12 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-bold">Ready to generate</h3>
                <p className="text-muted-foreground">Fill in the parameters and click Generate to see the magic!</p>
              </div>
            </div>
          )}

          {loading && (
             <div className="space-y-4">
                {[1,2,3,4].map(i => (
                  <Card key={i} className="rounded-3xl border-2 border-muted animate-pulse">
                    <CardContent className="h-24" />
                  </Card>
                ))}
             </div>
          )}

          {results && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h3 className="text-2xl font-black text-accent">Generated Suggestions</h3>
              {results.map((word, idx) => (
                <Card key={idx} className="rounded-3xl border-2 hover:border-accent transition-all">
                  <CardContent className="p-6 flex justify-between items-center gap-6">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl font-black text-primary">{word.word.toUpperCase()}</span>
                      </div>
                      <p className="text-sm italic text-muted-foreground">"{word.definition}"</p>
                      <p className="text-xs font-medium text-foreground/80">{word.exampleSentence}</p>
                    </div>
                    <Button 
                      size="icon"
                      variant={addedIds.has(idx.toString()) ? "secondary" : "default"}
                      disabled={addedIds.has(idx.toString())}
                      onClick={() => handleAddWord(word, idx)}
                      className="rounded-full h-12 w-12 shrink-0 bg-accent hover:bg-accent/90"
                    >
                      {addedIds.has(idx.toString()) ? <Check className="h-6 w-6" /> : <Plus className="h-6 w-6" />}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}