"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect, useCallback, useMemo } from "react";
import { ArrowLeft, CheckCircle2, Star, RefreshCcw, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useGameStore, type WordItem, type Difficulty } from "@/lib/game-store";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

export default function GamePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const difficulty = (searchParams.get("difficulty") || "beginner") as Difficulty;
  const { allWords, addStars, addCorrectLetter, addWordMastered, isLoaded } = useGameStore();

  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [userInput, setUserInput] = useState<string[]>([]);
  const [gameState, setGameState] = useState<"intro" | "playing" | "success" | "finished">("intro");
  const [wordsToPlay, setWordsToPlay] = useState<WordItem[]>([]);
  const [isWrong, setIsWrong] = useState(false);

  // Initialize game session once per difficulty/load
  useEffect(() => {
    if (!isLoaded) return;
    
    let filtered = allWords;
    if (difficulty === "beginner") filtered = allWords.filter(w => w.word.length <= 4);
    else if (difficulty === "intermediate") filtered = allWords.filter(w => w.word.length >= 5 && w.word.length <= 7);
    else if (difficulty === "advanced") filtered = allWords.filter(w => w.word.length >= 8);

    if (filtered.length === 0 && allWords.length > 0) filtered = [allWords[0]];

    const shuffled = [...filtered].sort(() => Math.random() - 0.5).slice(0, 5);
    setWordsToPlay(shuffled);
    setCurrentWordIndex(0);
  }, [allWords, difficulty, isLoaded]);

  const currentWord = useMemo(() => wordsToPlay[currentWordIndex], [wordsToPlay, currentWordIndex]);

  const handleStart = () => {
    if (!currentWord) return;
    setUserInput(new Array(currentWord.word.length).fill(""));
    setGameState("playing");
  };

  const handleKeyPress = useCallback((e: KeyboardEvent) => {
    if (gameState !== "playing") return;

    const char = e.key.toUpperCase();
    if (/^[A-Z]$/.test(char)) {
      setUserInput(prev => {
        const nextEmpty = prev.indexOf("");
        if (nextEmpty !== -1) {
          const next = [...prev];
          next[nextEmpty] = char;
          return next;
        }
        return prev;
      });
    } else if (e.key === "Backspace") {
      setUserInput(prev => {
        const lastFilled = prev.lastIndexOf("");
        const indexToDelete = lastFilled === -1 ? prev.length - 1 : lastFilled - 1;
        if (indexToDelete >= 0) {
          const next = [...prev];
          next[indexToDelete] = "";
          return next;
        }
        return prev;
      });
    }
  }, [gameState]);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [handleKeyPress]);

  useEffect(() => {
    if (gameState === "playing" && currentWord && !userInput.includes("")) {
      const typed = userInput.join("");
      if (typed === currentWord.word.toUpperCase()) {
        setGameState("success");
        addStars(1);
        addWordMastered();
        addCorrectLetter();
      } else {
        setIsWrong(true);
        setTimeout(() => {
          setIsWrong(false);
          setUserInput(new Array(currentWord.word.length).fill(""));
        }, 1000);
      }
    }
  }, [userInput, currentWord, gameState, addStars, addWordMastered, addCorrectLetter]);

  const nextWord = () => {
    if (currentWordIndex + 1 < wordsToPlay.length) {
      const nextIdx = currentWordIndex + 1;
      setCurrentWordIndex(nextIdx);
      setUserInput(new Array(wordsToPlay[nextIdx].word.length).fill(""));
      setGameState("intro");
    } else {
      setGameState("finished");
    }
  };

  if (!isLoaded || wordsToPlay.length === 0) return null;

  return (
    <div className="min-h-screen bg-background flex flex-col p-6 max-w-4xl mx-auto">
      {/* HUD */}
      <div className="flex justify-between items-center mb-12">
        <Button variant="ghost" onClick={() => router.push("/")} className="gap-2 font-bold text-accent">
          <ArrowLeft className="h-5 w-5" /> Exit Game
        </Button>
        <div className="flex-1 max-w-[200px] mx-8">
          <div className="flex justify-between text-xs font-black uppercase text-muted-foreground mb-2">
            <span>Progress</span>
            <span>{currentWordIndex + 1} / {wordsToPlay.length}</span>
          </div>
          <Progress value={((currentWordIndex + 1) / wordsToPlay.length) * 100} className="h-3 bg-white border border-primary/20" />
        </div>
        <div className="bg-primary text-primary-foreground font-black px-4 py-2 rounded-full text-lg shadow-sm">
          Level: {difficulty.toUpperCase()}
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center space-y-12">
        {gameState === "intro" && currentWord && (
          <div className="text-center space-y-8 animate-in fade-in zoom-in duration-500">
            <div className="relative w-64 h-64 mx-auto bg-white rounded-3xl shadow-xl border-4 border-primary flex items-center justify-center p-4">
               <div className="text-9xl font-black text-primary/10 absolute inset-0 flex items-center justify-center select-none">
                  ?
               </div>
               <div className="relative z-10 text-center">
                  <span className="text-6xl mb-4 block">📦</span>
                  <p className="text-3xl font-black text-accent">{currentWord.word}</p>
               </div>
            </div>
            <div className="space-y-4">
              <h2 className="text-3xl font-black">Ready to snap it?</h2>
              <p className="text-muted-foreground max-w-sm mx-auto">Look at the word carefully. We will hide the letters in a second!</p>
              <Button onClick={handleStart} className="px-12 py-8 text-2xl font-black rounded-2xl bg-primary hover:bg-primary/90 shadow-lg">
                I'm Ready!
              </Button>
            </div>
          </div>
        )}

        {gameState === "playing" && currentWord && (
          <div className={cn("text-center space-y-12 w-full", isWrong && "animate-wiggle")}>
            <div className="bg-white p-8 rounded-3xl shadow-lg border-2 border-primary/20 max-w-2xl mx-auto">
              <div className="flex items-start gap-4 text-left mb-8">
                <div className="bg-accent/10 p-3 rounded-2xl">
                  <Info className="text-accent h-6 w-6" />
                </div>
                <div>
                  <h4 className="font-bold text-lg">Hint</h4>
                  <p className="text-muted-foreground italic">"{currentWord.definition}"</p>
                </div>
              </div>

              {/* Scrabble Tiles Grid */}
              <div className="flex flex-wrap justify-center gap-4">
                {userInput.map((char, i) => (
                  <div key={i} className={cn("scrabble-tile", char === "" && "empty", isWrong && "border-destructive text-destructive")}>
                    {char}
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-accent/5 p-6 rounded-2xl text-accent font-medium">
              Use your keyboard to type the missing letters!
            </div>
          </div>
        )}

        {gameState === "success" && currentWord && (
          <div className="text-center space-y-8 animate-in bounce-in duration-500">
            <div className="text-8xl animate-bounce-subtle">🌟</div>
            <div className="space-y-2">
              <h2 className="text-5xl font-black text-primary">Awesome!</h2>
              <p className="text-2xl font-bold">You spelled <span className="text-accent underline">{currentWord.word}</span> correctly!</p>
            </div>
            <div className="flex justify-center gap-4">
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-primary/20 flex items-center gap-2">
                <Star className="text-primary fill-primary" />
                <span className="text-2xl font-black">+1 Star</span>
              </div>
            </div>
            <Button onClick={nextWord} className="px-12 py-8 text-2xl font-black rounded-2xl bg-accent hover:bg-accent/90 shadow-lg mt-8">
              {currentWordIndex + 1 === wordsToPlay.length ? "Finish Session" : "Next Word"}
            </Button>
          </div>
        )}

        {gameState === "finished" && (
          <div className="text-center space-y-10 animate-in fade-in duration-700">
             <div className="text-9xl">🏆</div>
             <div className="space-y-4">
                <h2 className="text-5xl font-black">Great Job!</h2>
                <p className="text-2xl text-muted-foreground">You completed the {difficulty} session!</p>
             </div>
             
             <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto">
                <div className="bg-white p-6 rounded-3xl border-2 border-primary/20 shadow-sm">
                   <p className="text-xs font-bold text-muted-foreground uppercase">Words Spelled</p>
                   <p className="text-4xl font-black text-primary">{wordsToPlay.length}</p>
                </div>
                <div className="bg-white p-6 rounded-3xl border-2 border-accent/20 shadow-sm">
                   <p className="text-xs font-bold text-muted-foreground uppercase">Stars Earned</p>
                   <p className="text-4xl font-black text-accent">{wordsToPlay.length}</p>
                </div>
             </div>

             <div className="flex flex-col gap-4 mt-8">
                <Button onClick={() => router.push("/")} className="px-12 py-8 text-2xl font-black rounded-2xl bg-primary hover:bg-primary/90 shadow-lg">
                  Back to Lobby
                </Button>
                <Button variant="ghost" onClick={() => window.location.reload()} className="gap-2 text-muted-foreground hover:bg-muted">
                  <RefreshCcw className="h-5 w-5" /> Play Again
                </Button>
             </div>
          </div>
        )}
      </div>
    </div>
  );
}
