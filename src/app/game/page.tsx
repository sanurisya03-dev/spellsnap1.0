"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect, useCallback, useMemo } from "react";
import { ArrowLeft, Star, RefreshCcw, Info, Loader2, Award, CheckCircle2, Cloud, Sparkles as SparklesIcon } from "lucide-react";
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

  useEffect(() => {
    if (!isLoaded || allWords.length === 0 || wordsToPlay.length > 0) return;
    
    let filtered = allWords;
    if (difficulty === "beginner") filtered = allWords.filter(w => w.word.length <= 4);
    else if (difficulty === "intermediate") filtered = allWords.filter(w => w.word.length >= 5 && w.word.length <= 7);
    else if (difficulty === "advanced") filtered = allWords.filter(w => w.word.length >= 8);

    if (filtered.length === 0 && allWords.length > 0) filtered = [allWords[0]];

    const shuffled = [...filtered].sort(() => Math.random() - 0.5).slice(0, 5);
    setWordsToPlay(shuffled);
    setCurrentWordIndex(0);
  }, [allWords, difficulty, isLoaded, wordsToPlay.length]);

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
        const lastFilled = prev.indexOf("");
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
        }, 800);
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

  if (!isLoaded || (wordsToPlay.length === 0 && gameState !== "finished")) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative flex flex-col p-6">
      <div className="bg-animate">
        <Cloud className="floating-element text-primary/20" size={100} style={{ top: '15%', left: '10%' }} />
        <Cloud className="floating-element text-primary/20" size={120} style={{ bottom: '20%', right: '15%' }} />
      </div>

      <header className="max-w-4xl w-full mx-auto flex justify-between items-center mb-8 z-10">
        <Button variant="ghost" onClick={() => router.push("/")} className="btn-bouncy bg-white/80 backdrop-blur-md px-6 shadow-sm border-2 border-white">
          <ArrowLeft className="h-5 w-5 mr-2" /> Exit
        </Button>
        <div className="flex-1 max-w-[300px] mx-8">
          <div className="flex justify-between text-[10px] font-black uppercase text-muted-foreground mb-2 tracking-widest">
            <span>Words</span>
            <span>{currentWordIndex + 1} / {wordsToPlay.length}</span>
          </div>
          <Progress value={((currentWordIndex + 1) / wordsToPlay.length) * 100} className="h-4 bg-white border-2 border-primary/20 rounded-full" />
        </div>
        <div className="bg-primary text-white font-black px-6 py-2 rounded-full shadow-lg border-2 border-white">
          {difficulty.toUpperCase()}
        </div>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center z-10">
        {gameState === "intro" && currentWord && (
          <div className="text-center space-y-10 animate-in fade-in zoom-in duration-500">
            <div className="bg-white p-12 rounded-[4rem] shadow-2xl border-8 border-primary/20 relative">
               <div className="absolute -top-10 -right-10 bg-yellow-400 p-4 rounded-full shadow-lg animate-bounce">
                 <Star className="h-8 w-8 text-white fill-white" />
               </div>
               <p className="text-6xl font-black text-primary tracking-tighter uppercase">{currentWord.word}</p>
            </div>
            <div className="space-y-6">
              <h2 className="text-4xl font-black text-foreground">Can you snap it?</h2>
              <Button onClick={handleStart} className="btn-bouncy px-16 py-10 text-3xl h-auto bg-primary text-white">
                Ready!
              </Button>
            </div>
          </div>
        )}

        {gameState === "playing" && currentWord && (
          <div className="w-full max-w-3xl space-y-12 text-center">
            <div className="bg-white/60 backdrop-blur-xl p-10 rounded-[3rem] border-4 border-white shadow-2xl space-y-8">
              <div className="flex items-center justify-center gap-4">
                <div className="bg-secondary/20 p-3 rounded-2xl">
                  <Info className="text-secondary h-6 w-6" />
                </div>
                <p className="text-xl font-bold italic text-muted-foreground">"{currentWord.definition}"</p>
              </div>

              <div className="flex flex-wrap justify-center gap-4">
                {userInput.map((char, i) => (
                  <div key={i} className={cn("scrabble-tile", char === "" && "empty", isWrong && "error")}>
                    {char}
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-primary/10 px-8 py-3 rounded-full text-primary font-black uppercase tracking-widest text-sm inline-block border-2 border-primary/10">
              Type the letters on your keyboard!
            </div>
          </div>
        )}

        {gameState === "success" && currentWord && (
          <div className="text-center space-y-8 animate-in duration-500">
            <div className="text-9xl animate-bounce">🌟</div>
            <div className="space-y-2">
              <h2 className="text-6xl font-black text-primary">FANTASTIC!</h2>
              <p className="text-2xl font-bold text-muted-foreground">You snapped <span className="text-secondary font-black underline">{currentWord.word}</span>!</p>
            </div>
            <Button onClick={nextWord} className="btn-bouncy px-16 py-8 text-2xl h-auto bg-secondary text-white">
              {currentWordIndex + 1 === wordsToPlay.length ? "Finish!" : "Next Word"}
            </Button>
          </div>
        )}

        {gameState === "finished" && (
          <div className="text-center space-y-10 animate-in fade-in duration-700">
             <div className="text-9xl">🏆</div>
             <div className="space-y-2">
                <h2 className="text-6xl font-black text-foreground">SPELLING MASTER!</h2>
                <p className="text-2xl font-bold text-muted-foreground">You finished the {difficulty} level!</p>
             </div>
             
             <div className="flex gap-6 justify-center w-full max-w-md mx-auto">
                <div className="bg-white p-8 rounded-[2.5rem] border-4 border-primary/20 shadow-xl flex-1">
                   <p className="text-xs font-black text-muted-foreground uppercase mb-2">Snaps</p>
                   <p className="text-5xl font-black text-primary">{wordsToPlay.length}</p>
                </div>
                <div className="bg-white p-8 rounded-[2.5rem] border-4 border-secondary/20 shadow-xl flex-1">
                   <p className="text-xs font-black text-muted-foreground uppercase mb-2">Stars</p>
                   <p className="text-5xl font-black text-secondary">{wordsToPlay.length}</p>
                </div>
             </div>

             <div className="flex flex-col gap-4 mt-8">
                <Button onClick={() => router.push("/")} className="btn-bouncy px-16 py-8 text-2xl h-auto bg-primary text-white">
                  Back to Lobby
                </Button>
                <Button variant="ghost" onClick={() => window.location.reload()} className="text-muted-foreground font-black flex items-center gap-2 justify-center">
                  <RefreshCcw className="h-5 w-5" /> Play Again
                </Button>
             </div>
          </div>
        )}
      </div>
    </div>
  );
}
