"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect, useCallback, useMemo } from "react";
import { ArrowLeft, Star, RefreshCcw, Info, Loader2, Award, Cloud, Sparkles as SparklesIcon } from "lucide-react";
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
    <div className="min-h-screen bg-background relative flex flex-col p-8">
      <div className="bg-animate">
        <Cloud className="floating-element text-accent/20" size={150} style={{ top: '15%', left: '10%' }} />
        <Cloud className="floating-element text-accent/20" size={120} style={{ bottom: '20%', right: '15%' }} />
      </div>

      <header className="max-w-5xl w-full mx-auto flex justify-between items-center mb-12 z-10">
        <Button variant="ghost" onClick={() => router.push("/")} className="btn-bouncy bg-white/90 backdrop-blur-xl px-8 h-14 shadow-xl border-4 border-white text-lg">
          <ArrowLeft className="h-6 w-6 mr-3" /> Stop
        </Button>
        <div className="flex-1 max-w-[400px] mx-12">
          <div className="flex justify-between text-xs font-black uppercase text-muted-foreground mb-3 tracking-widest">
            <span>Progress</span>
            <span>{currentWordIndex + 1} of {wordsToPlay.length}</span>
          </div>
          <Progress value={((currentWordIndex + 1) / wordsToPlay.length) * 100} className="h-6 bg-white border-4 border-primary/20 rounded-full" />
        </div>
        <div className="bg-primary text-white font-black px-8 py-3 rounded-full shadow-xl border-4 border-white text-lg">
          {difficulty.toUpperCase()}
        </div>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center z-10">
        {gameState === "intro" && currentWord && (
          <div className="text-center space-y-12 animate-in fade-in zoom-in duration-500">
            <div className="bg-white p-20 rounded-[5rem] shadow-3xl border-12 border-primary/20 relative">
               <div className="absolute -top-12 -right-12 bg-yellow-400 p-6 rounded-full shadow-2xl animate-bounce">
                 <Star className="h-12 w-12 text-white fill-white" />
               </div>
               <p className="text-8xl font-black text-primary tracking-tighter uppercase sparkle-text">{currentWord.word}</p>
            </div>
            <div className="space-y-8">
              <h2 className="text-5xl font-black text-foreground">Ready to snap it?</h2>
              <Button onClick={handleStart} className="btn-bouncy px-20 py-12 text-4xl h-auto bg-primary text-white">
                YES!
              </Button>
            </div>
          </div>
        )}

        {gameState === "playing" && currentWord && (
          <div className="w-full max-w-4xl space-y-16 text-center">
            <div className="bg-white/70 backdrop-blur-2xl p-16 rounded-[4rem] border-8 border-white shadow-3xl space-y-12">
              <div className="flex items-center justify-center gap-6">
                <div className="bg-accent/20 p-4 rounded-3xl">
                  <Info className="text-accent h-8 w-8" />
                </div>
                <p className="text-3xl font-bold italic text-muted-foreground">"{currentWord.definition}"</p>
              </div>

              <div className="flex flex-wrap justify-center gap-6">
                {userInput.map((char, i) => (
                  <div key={i} className={cn("scrabble-tile", char === "" && "empty", isWrong && "error")}>
                    {char}
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-primary/20 px-12 py-4 rounded-full text-primary font-black uppercase tracking-widest text-lg inline-block border-4 border-primary/20 animate-pulse">
              Type the letters now!
            </div>
          </div>
        )}

        {gameState === "success" && currentWord && (
          <div className="text-center space-y-10 animate-in duration-500">
            <div className="text-[12rem] animate-bounce">🌟</div>
            <div className="space-y-4">
              <h2 className="text-8xl font-black text-primary drop-shadow-lg">WOW!</h2>
              <p className="text-3xl font-bold text-muted-foreground">You snapped <span className="text-secondary font-black underline decoration-primary">{currentWord.word}</span> correctly!</p>
            </div>
            <Button onClick={nextWord} className="btn-bouncy px-20 py-10 text-3xl h-auto bg-secondary text-white">
              {currentWordIndex + 1 === wordsToPlay.length ? "I'm Done!" : "Next Word"}
            </Button>
          </div>
        )}

        {gameState === "finished" && (
          <div className="text-center space-y-12 animate-in fade-in duration-700">
             <div className="text-[12rem]">🏆</div>
             <div className="space-y-4">
                <h2 className="text-7xl font-black text-foreground">SPELLING CHAMP!</h2>
                <p className="text-3xl font-bold text-muted-foreground">You mastered the {difficulty} level!</p>
             </div>
             
             <div className="flex gap-8 justify-center w-full max-w-2xl mx-auto">
                <div className="bg-white p-12 rounded-[3.5rem] border-8 border-primary/20 shadow-2xl flex-1">
                   <p className="text-sm font-black text-muted-foreground uppercase mb-3">Words</p>
                   <p className="text-7xl font-black text-primary">{wordsToPlay.length}</p>
                </div>
                <div className="bg-white p-12 rounded-[3.5rem] border-8 border-secondary/20 shadow-2xl flex-1">
                   <p className="text-sm font-black text-muted-foreground uppercase mb-3">Stars</p>
                   <p className="text-7xl font-black text-secondary">{wordsToPlay.length}</p>
                </div>
             </div>

             <div className="flex flex-col gap-6 mt-12 items-center">
                <Button onClick={() => router.push("/")} className="btn-bouncy px-24 py-10 text-3xl h-auto bg-primary text-white w-fit">
                  Back to Lobby
                </Button>
                <Button variant="ghost" onClick={() => window.location.reload()} className="text-muted-foreground font-black flex items-center gap-3 text-xl hover:text-primary transition-colors">
                  <RefreshCcw className="h-6 w-6" /> Play Again
                </Button>
             </div>
          </div>
        )}
      </div>
    </div>
  );
}
