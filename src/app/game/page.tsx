
"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect, useCallback, useMemo } from "react";
import { ArrowLeft, Star, RefreshCcw, Info, Loader2, Award, Cloud, Sparkles as SparklesIcon, Timer, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useGameStore, type WordItem, type Difficulty } from "@/lib/game-store";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import Image from "next/image";

type GameState = "intro" | "memorizing" | "playing" | "success" | "finished";

export default function GamePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const difficulty = (searchParams.get("difficulty") || "beginner") as Difficulty;
  const { allWords, addStars, addCorrectLetter, addWordMastered, isLoaded } = useGameStore();

  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [userInput, setUserInput] = useState<string[]>([]);
  const [gameState, setGameState] = useState<GameState>("intro");
  const [wordsToPlay, setWordsToPlay] = useState<WordItem[]>([]);
  const [isWrong, setIsWrong] = useState(false);
  const [timer, setTimer] = useState(10);
  const [hiddenIndices, setHiddenIndices] = useState<number[]>([]);

  // Initialize words to play
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

  // Memorization Timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (gameState === "memorizing" && timer > 0) {
      interval = setInterval(() => setTimer(prev => prev - 1), 1000);
    } else if (gameState === "memorizing" && timer === 0) {
      startSpellingChallenge();
    }
    return () => clearInterval(interval);
  }, [gameState, timer]);

  const handleStartMemorizing = () => {
    setTimer(10);
    setGameState("memorizing");
  };

  const startSpellingChallenge = () => {
    if (!currentWord) return;
    
    // Determine which letters to hide based on difficulty
    const indices = Array.from({ length: currentWord.word.length }, (_, i) => i);
    let toHide: number[] = [];
    
    if (difficulty === "advanced") {
      toHide = indices; // All letters
    } else if (difficulty === "intermediate") {
      const count = Math.ceil(currentWord.word.length / 2);
      toHide = indices.sort(() => Math.random() - 0.5).slice(0, count);
    } else {
      // Beginner: 1-2 random letters
      const count = currentWord.word.length > 4 ? 2 : 1;
      toHide = indices.sort(() => Math.random() - 0.5).slice(0, count);
    }
    
    setHiddenIndices(toHide);
    
    // Set initial user input: pre-filled with visible letters
    const initialInput = currentWord.word.split('').map((char, i) => 
      toHide.includes(i) ? "" : char.toUpperCase()
    );
    
    setUserInput(initialInput);
    setGameState("playing");
  };

  const handleKeyPress = useCallback((e: KeyboardEvent) => {
    if (gameState !== "playing") return;

    const char = e.key.toUpperCase();
    if (/^[A-Z]$/.test(char)) {
      setUserInput(prev => {
        // Find the first empty slot that is a hidden index
        const nextEmptyHidden = prev.findIndex((c, i) => c === "" && hiddenIndices.includes(i));
        if (nextEmptyHidden !== -1) {
          const next = [...prev];
          next[nextEmptyHidden] = char;
          return next;
        }
        return prev;
      });
    } else if (e.key === "Backspace") {
      setUserInput(prev => {
        // Find the last filled hidden slot to delete
        const lastFilledHidden = [...prev].reverse().findIndex((c, i) => 
          c !== "" && hiddenIndices.includes(prev.length - 1 - i)
        );
        if (lastFilledHidden !== -1) {
          const realIndex = prev.length - 1 - lastFilledHidden;
          const next = [...prev];
          next[realIndex] = "";
          return next;
        }
        return prev;
      });
    }
  }, [gameState, hiddenIndices]);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [handleKeyPress]);

  // Check result
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
          // Only clear the hidden indices
          setUserInput(prev => prev.map((char, i) => hiddenIndices.includes(i) ? "" : char));
        }, 800);
      }
    }
  }, [userInput, currentWord, gameState, addStars, addWordMastered, addCorrectLetter, hiddenIndices]);

  const nextWord = () => {
    if (currentWordIndex + 1 < wordsToPlay.length) {
      const nextIdx = currentWordIndex + 1;
      setCurrentWordIndex(nextIdx);
      setTimer(10);
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
          <div className="w-full max-w-4xl text-center space-y-10 animate-in fade-in zoom-in duration-500">
            <div className="bg-white/80 backdrop-blur-xl p-10 rounded-[4rem] shadow-3xl border-8 border-white flex flex-col md:flex-row items-center gap-10">
              <div className="w-full md:w-1/2 aspect-video relative rounded-[3rem] overflow-hidden shadow-2xl border-4 border-primary/10">
                <Image 
                  src={currentWord.imageUrl || "https://picsum.photos/seed/learn/600/400"} 
                  alt={currentWord.word}
                  fill
                  className="object-cover"
                  data-ai-hint="educational word"
                />
              </div>
              <div className="w-full md:w-1/2 space-y-6 text-left">
                <div className="bg-primary/10 inline-block px-6 py-2 rounded-full text-primary font-black uppercase tracking-widest">
                  Target Word
                </div>
                <h2 className="text-8xl font-black text-primary uppercase sparkle-text leading-tight">{currentWord.word}</h2>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Info className="text-accent shrink-0 h-6 w-6 mt-1" />
                    <p className="text-xl font-bold text-muted-foreground italic">"{currentWord.definition}"</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <Zap className="text-secondary shrink-0 h-6 w-6 mt-1" />
                    <p className="text-xl font-medium text-foreground">{currentWord.exampleSentence}</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
               <h3 className="text-3xl font-black text-foreground">Look carefully! Are you ready?</h3>
               <Button onClick={handleStartMemorizing} className="btn-bouncy px-20 py-10 text-4xl h-auto bg-primary text-white shadow-2xl">
                 GO!
               </Button>
            </div>
          </div>
        )}

        {gameState === "memorizing" && currentWord && (
          <div className="text-center space-y-12 animate-in fade-in zoom-in duration-500">
            <div className="relative">
              <div className="bg-white p-20 rounded-[5rem] shadow-3xl border-12 border-primary/20">
                 <p className="text-[12rem] font-black text-primary tracking-tighter uppercase sparkle-text">{currentWord.word}</p>
              </div>
              <div className="absolute -top-12 -right-12 bg-accent p-8 rounded-full shadow-2xl border-8 border-white animate-bounce-subtle">
                <div className="flex flex-col items-center">
                  <Timer className="h-10 w-10 text-white mb-1" />
                  <span className="text-4xl font-black text-white">{timer}</span>
                </div>
              </div>
            </div>
            <div className="bg-white/50 backdrop-blur-md px-12 py-6 rounded-full border-4 border-white shadow-xl">
               <h2 className="text-4xl font-black text-foreground">MEMORIZE IT NOW!</h2>
               <p className="text-xl font-bold text-muted-foreground mt-2">I will hide some letters in {timer} seconds...</p>
            </div>
          </div>
        )}

        {gameState === "playing" && currentWord && (
          <div className="w-full max-w-4xl space-y-12 text-center">
            <div className="bg-white/70 backdrop-blur-2xl p-16 rounded-[4rem] border-8 border-white shadow-3xl space-y-12 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8">
                 <div className="bg-primary/20 p-4 rounded-3xl">
                    <SparklesIcon className="text-primary h-10 w-10" />
                 </div>
              </div>
              
              <div className="flex items-center justify-center gap-6">
                <p className="text-3xl font-bold italic text-muted-foreground">"{currentWord.definition}"</p>
              </div>

              <div className="flex flex-wrap justify-center gap-6">
                {userInput.map((char, i) => (
                  <div key={i} className={cn(
                    "scrabble-tile", 
                    char === "" && "empty", 
                    isWrong && hiddenIndices.includes(i) && "error",
                    !hiddenIndices.includes(i) && "bg-muted/10 text-muted-foreground border-muted/30 shadow-none"
                  )}>
                    {char}
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-primary/20 px-12 py-4 rounded-full text-primary font-black uppercase tracking-widest text-lg inline-block border-4 border-primary/20 animate-pulse">
              Guess the missing letters!
            </div>
          </div>
        )}

        {gameState === "success" && currentWord && (
          <div className="text-center space-y-10 animate-in duration-500">
            <div className="text-[12rem] animate-bounce">🌟</div>
            <div className="space-y-4">
              <h2 className="text-8xl font-black text-primary drop-shadow-lg">AWESOME!</h2>
              <p className="text-3xl font-bold text-muted-foreground">You snapped <span className="text-secondary font-black underline decoration-primary">{currentWord.word}</span> perfectly!</p>
            </div>
            <Button onClick={nextWord} className="btn-bouncy px-20 py-10 text-3xl h-auto bg-secondary text-white shadow-2xl">
              {currentWordIndex + 1 === wordsToPlay.length ? "Finish Game!" : "Next Word"}
            </Button>
          </div>
        )}

        {gameState === "finished" && (
          <div className="text-center space-y-12 animate-in fade-in duration-700">
             <div className="text-[12rem]">🏆</div>
             <div className="space-y-4">
                <h2 className="text-7xl font-black text-foreground">SPELLING CHAMP!</h2>
                <p className="text-3xl font-bold text-muted-foreground">You finished the {difficulty} level!</p>
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
                <Button onClick={() => router.push("/")} className="btn-bouncy px-24 py-10 text-3xl h-auto bg-primary text-white w-fit shadow-2xl">
                  Lobby
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
