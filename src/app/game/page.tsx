
"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { ArrowLeft, Star, RefreshCcw, Info, Loader2, Cloud, Zap, Clock, Volume2 } from "lucide-react";
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
  const { playableWords, addStars, addCorrectLetter, addWordMastered, isLoaded, activeClass } = useGameStore();

  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [userInput, setUserInput] = useState<string[]>([]);
  const [gameState, setGameState] = useState<GameState>("intro");
  const [wordsToPlay, setWordsToPlay] = useState<WordItem[]>([]);
  const [isWrong, setIsWrong] = useState(false);
  const [timer, setTimer] = useState(10);
  const [hiddenIndices, setHiddenIndices] = useState<number[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!isLoaded || playableWords.length === 0 || wordsToPlay.length > 0) return;
    
    let filtered = playableWords.filter(w => w.difficulty === difficulty);
    if (filtered.length === 0) filtered = playableWords;

    const shuffled = [...filtered].sort(() => 0.5 - Math.random()).slice(0, 5);
    setWordsToPlay(shuffled);
  }, [playableWords, difficulty, isLoaded, wordsToPlay.length]);

  const currentWord = useMemo(() => wordsToPlay[currentWordIndex], [wordsToPlay, currentWordIndex]);

  const playAudio = useCallback(() => {
    if (!currentWord) return;

    // 1. Try playing AI Generated Audio if it exists
    if (currentWord.audioUrl) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      const audio = new Audio(currentWord.audioUrl);
      audioRef.current = audio;
      audio.play().catch(err => {
        console.warn("AI Audio failed, falling back to browser TTS", err);
        speakWithBrowser(currentWord.word);
      });
    } else {
      // 2. Fallback to Browser Text-to-Speech
      speakWithBrowser(currentWord.word);
    }
  }, [currentWord]);

  const speakWithBrowser = (text: string) => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      // Cancel any ongoing speech
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text.toLowerCase());
      utterance.rate = 0.8; // Slightly slower for clarity
      utterance.pitch = 1.1; // Friendly pitch
      window.speechSynthesis.speak(utterance);
    }
  };

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
    playAudio();
  };

  const startSpellingChallenge = () => {
    if (!currentWord) return;
    
    const indices = Array.from({ length: currentWord.word.length }, (_, i) => i);
    let toHide: number[] = [];
    
    if (difficulty === "advanced") {
      toHide = indices;
    } else if (difficulty === "intermediate") {
      const count = Math.ceil(currentWord.word.length / 2);
      toHide = [...indices].sort(() => 0.5 - Math.random()).slice(0, count);
    } else {
      const count = Math.min(currentWord.word.length - 1, currentWord.word.length > 4 ? 2 : 1);
      toHide = [...indices].sort(() => 0.5 - Math.random()).slice(0, count);
    }
    
    setHiddenIndices(toHide);
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
        const lastFilledHiddenIdx = [...prev].reduce((acc, char, idx) => {
          if (char !== "" && hiddenIndices.includes(idx)) return idx;
          return acc;
        }, -1);

        if (lastFilledHiddenIdx !== -1) {
          const next = [...prev];
          next[lastFilledHiddenIdx] = "";
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
          setUserInput(prev => prev.map((char, i) => hiddenIndices.includes(i) ? "" : char));
        }, 800);
      }
    }
  }, [userInput, currentWord, gameState, addStars, addWordMastered, addCorrectLetter, hiddenIndices]);

  const nextWord = () => {
    if (currentWordIndex + 1 < wordsToPlay.length) {
      setCurrentWordIndex(prev => prev + 1);
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
    <div className="min-h-screen bg-background relative flex flex-col p-4 md:p-8 overflow-x-hidden">
      <div className="bg-animate">
        <Cloud className="floating-element text-accent/20" size={150} style={{ top: '15%', left: '10%' }} />
        <Cloud className="floating-element text-accent/20" size={120} style={{ bottom: '20%', right: '15%' }} />
      </div>

      <header className="max-w-5xl w-full mx-auto flex flex-wrap justify-between items-center mb-6 md:mb-12 z-20 gap-4">
        <Button variant="ghost" onClick={() => router.push("/")} className="btn-bouncy bg-white/90 backdrop-blur-xl px-4 md:px-8 h-10 md:h-14 shadow-xl border-2 md:border-4 border-white text-xs md:text-lg">
          <ArrowLeft className="h-4 w-4 md:h-6 md:w-6 mr-1.5 md:mr-3" /> Stop
        </Button>
        <div className="flex-1 min-w-[150px] md:max-w-[400px]">
          <div className="flex justify-between text-[8px] md:text-xs font-black uppercase text-muted-foreground mb-1.5 md:mb-3 tracking-widest">
            <span className="truncate max-w-[100px] md:max-w-none">{activeClass ? `Class: ${activeClass.name}` : "Practice"}</span>
            <span>{currentWordIndex + 1} / {wordsToPlay.length}</span>
          </div>
          <Progress value={((currentWordIndex + 1) / (wordsToPlay.length || 1)) * 100} className="h-3 md:h-6 bg-white border-2 md:border-4 border-primary/20 rounded-full" />
        </div>
        <div className="bg-primary text-white font-black px-4 md:px-8 py-1.5 md:py-3 rounded-full shadow-xl border-2 md:border-4 border-white text-[10px] md:text-lg">
          {difficulty.toUpperCase()}
        </div>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center z-10 w-full max-w-6xl mx-auto overflow-hidden px-2">
        {gameState === "intro" && currentWord && (
          <div className="w-full max-w-4xl text-center space-y-4 md:space-y-10 animate-in fade-in zoom-in duration-500">
            <div className="bg-white/80 backdrop-blur-xl p-4 md:p-10 rounded-[2rem] md:rounded-[4rem] shadow-3xl border-2 md:border-8 border-white flex flex-col md:flex-row items-center gap-4 md:gap-10">
              <div className="w-full sm:w-1/2 md:w-1/2 aspect-square relative rounded-[1.5rem] md:rounded-[3rem] overflow-hidden shadow-2xl border-2 md:border-4 border-primary/10 bg-muted shrink-0">
                <Image 
                  src={currentWord.imageUrl || `https://picsum.photos/seed/${currentWord.word.toLowerCase()}/600/600`} 
                  alt={currentWord.word}
                  fill
                  className="object-cover"
                  unoptimized={currentWord.imageUrl?.startsWith('data:')}
                />
              </div>
              <div className="w-full md:w-1/2 space-y-3 md:space-y-6 text-center md:text-left min-w-0 px-2">
                <div className="flex items-center gap-2 justify-center md:justify-start">
                  <div className="bg-primary/10 inline-block px-3 md:px-6 py-1 md:py-2 rounded-full text-primary font-black uppercase tracking-widest text-[10px] md:text-sm">
                    Ready to Learn?
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={playAudio} 
                    className="rounded-full bg-accent h-10 w-10 md:h-14 md:w-14 text-white hover:bg-accent/90 shadow-lg animate-bounce-subtle"
                  >
                    <Volume2 className="h-5 w-5 md:h-8 md:w-8" />
                  </Button>
                </div>
                <button 
                  onClick={playAudio}
                  className="group relative text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-black text-primary uppercase sparkle-text leading-tight break-all transition-transform active:scale-95 text-left"
                >
                  {currentWord.word}
                </button>
                {currentWord.phonemes && (
                   <p className="text-xl md:text-3xl font-black text-accent/80 tracking-widest -mt-2 md:-mt-4">
                     {currentWord.phonemes}
                   </p>
                )}
                <div className="space-y-2 md:space-y-4">
                  <div className="flex items-start gap-2 md:gap-3 justify-center md:justify-start">
                    <Info className="text-accent shrink-0 h-4 w-4 md:h-6 md:w-6 mt-1" />
                    <p className="text-sm md:text-xl font-bold text-muted-foreground italic line-clamp-3">"{currentWord.definition}"</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="space-y-3">
               <h3 className="text-lg md:text-3xl font-black text-foreground">Look carefully! Ready to memorize?</h3>
               <Button onClick={handleStartMemorizing} className="btn-bouncy px-8 md:px-20 py-4 md:py-10 text-xl md:text-4xl h-auto bg-primary text-white shadow-2xl">
                 START!
               </Button>
            </div>
          </div>
        )}

        {gameState === "memorizing" && currentWord && (
          <div className="text-center space-y-6 md:space-y-12 animate-in fade-in zoom-in duration-500 w-full">
            <div className="relative inline-block max-w-full">
              <button 
                onClick={playAudio}
                className="group relative bg-white p-6 md:p-20 rounded-[2rem] md:rounded-[5rem] shadow-3xl border-4 md:border-12 border-primary/20 overflow-hidden flex flex-col items-center justify-center min-h-[150px] md:min-h-[400px] transition-all active:scale-95"
              >
                 <p className="text-[min(15vw,8rem)] font-black text-primary tracking-tighter uppercase sparkle-text break-all leading-none">
                   {currentWord.word}
                 </p>
                 {currentWord.phonemes && (
                    <p className="text-2xl md:text-5xl font-black text-accent/60 tracking-widest mt-4">
                      {currentWord.phonemes}
                    </p>
                 )}
                 <div className="absolute top-4 right-4 md:top-10 md:right-10 opacity-40 group-hover:opacity-100 transition-opacity">
                   <Volume2 className="h-6 w-6 md:h-12 md:w-12 text-accent" />
                 </div>
              </button>
              <div className="absolute -top-4 -right-4 md:-top-12 md:-right-12 bg-accent h-12 w-12 md:h-32 md:w-32 rounded-full shadow-2xl border-2 md:border-8 border-white flex flex-col items-center justify-center animate-bounce-subtle">
                  <Clock className="h-3 w-3 md:h-8 md:w-8 text-white mb-0.5 md:mb-1" />
                  <span className="text-lg md:text-5xl font-black text-white">{timer}</span>
              </div>
            </div>
            <div className="bg-white/50 backdrop-blur-md px-4 md:px-12 py-2 md:py-6 rounded-full border-2 md:border-4 border-white shadow-xl inline-block">
               <h2 className="text-lg md:text-4xl font-black text-foreground uppercase">Memorize Now!</h2>
               <p className="text-xs md:text-xl font-bold text-muted-foreground mt-0.5">Click the word to hear it again!</p>
            </div>
          </div>
        )}

        {gameState === "playing" && currentWord && (
          <div className="w-full max-w-4xl space-y-6 md:space-y-12 text-center">
            <div className="bg-white/70 backdrop-blur-2xl p-4 md:p-16 rounded-[2rem] md:rounded-[4rem] border-2 md:border-8 border-white shadow-3xl space-y-4 md:space-y-12 relative overflow-hidden">
              <div className="flex flex-col items-center gap-3 md:gap-6">
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 md:h-32 md:w-32 relative rounded-xl md:rounded-3xl overflow-hidden border-2 md:border-4 border-white shadow-xl bg-muted">
                    <img src={currentWord.imageUrl || `https://picsum.photos/seed/${currentWord.word.toLowerCase()}/200/200`} alt="hint" className="object-cover h-full w-full" />
                  </div>
                  <Button 
                    size="lg" 
                    variant="secondary" 
                    onClick={playAudio} 
                    className="rounded-full h-12 w-12 md:h-20 md:w-20 bg-accent text-white shadow-lg border-2 md:border-4 border-white hover:bg-accent/90 animate-pulse"
                  >
                    <Volume2 className="h-6 w-6 md:h-10 md:w-10" />
                  </Button>
                </div>
                <p className="text-sm md:text-3xl font-bold italic text-muted-foreground break-words max-w-md">"{currentWord.definition}"</p>
                {currentWord.phonemes && <p className="text-lg md:text-2xl font-black text-accent/60">{currentWord.phonemes}</p>}
              </div>

              <div className="flex flex-wrap justify-center gap-1.5 md:gap-4 overflow-y-auto max-h-[35vh] p-1">
                {userInput.map((char, i) => (
                  <div key={i} className={cn(
                    "scrabble-tile text-lg sm:text-2xl md:text-4xl w-8 h-8 sm:w-14 sm:h-14 md:w-20 md:h-20", 
                    char === "" && "empty", 
                    isWrong && hiddenIndices.includes(i) && "error",
                    !hiddenIndices.includes(i) && "bg-muted/10 text-muted-foreground border-muted/30 shadow-none opacity-60"
                  )}>
                    {char}
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-primary/20 px-6 md:px-12 py-2 md:py-4 rounded-full text-primary font-black uppercase tracking-widest text-[10px] md:text-lg inline-block border-2 md:border-4 border-primary/20 animate-pulse">
              Snap the missing letters!
            </div>
          </div>
        )}

        {gameState === "success" && currentWord && (
          <div className="text-center space-y-6 md:space-y-10 animate-in duration-500">
            <div className="text-6xl md:text-[12rem] animate-bounce">🌟</div>
            <div className="space-y-2 md:space-y-4">
              <h2 className="text-3xl md:text-8xl font-black text-primary drop-shadow-lg">AWESOME!</h2>
              <p className="text-sm md:text-3xl font-bold text-muted-foreground">You snapped <span className="text-secondary font-black underline decoration-primary uppercase break-all">{currentWord.word}</span> perfectly!</p>
            </div>
            <Button onClick={nextWord} className="btn-bouncy px-8 md:px-20 py-4 md:py-10 text-base md:text-3xl h-auto bg-secondary text-white shadow-2xl">
              {currentWordIndex + 1 === wordsToPlay.length ? "Finish Session!" : "Next Challenge"}
            </Button>
          </div>
        )}

        {gameState === "finished" && (
          <div className="text-center space-y-6 md:space-y-12 animate-in fade-in duration-700 w-full max-w-2xl mx-auto">
             <div className="text-6xl md:text-[10rem]">🏆</div>
             <div className="space-y-2 md:space-y-4">
                <h2 className="text-2xl md:text-7xl font-black text-foreground">SPELLING CHAMP!</h2>
                <p className="text-sm md:text-3xl font-bold text-muted-foreground">You finished the {difficulty} level!</p>
             </div>
             
             <div className="flex flex-col sm:flex-row gap-4 md:gap-8 justify-center">
                <div className="bg-white p-4 md:p-12 rounded-[1.5rem] md:rounded-[3.5rem] border-2 md:border-8 border-primary/20 shadow-2xl flex-1">
                   <p className="text-[10px] md:text-sm font-black text-muted-foreground uppercase mb-1">Words</p>
                   <p className="text-2xl md:text-7xl font-black text-primary">{wordsToPlay.length}</p>
                </div>
                <div className="bg-white p-4 md:p-12 rounded-[1.5rem] md:rounded-[3.5rem] border-2 md:border-8 border-secondary/20 shadow-2xl flex-1">
                   <p className="text-[10px] md:text-sm font-black text-muted-foreground uppercase mb-1">Stars</p>
                   <p className="text-2xl md:text-7xl font-black text-secondary">{wordsToPlay.length}</p>
                </div>
             </div>

             <div className="flex flex-col gap-3 mt-4 items-center">
                <Button onClick={() => router.push("/")} className="btn-bouncy px-10 md:px-24 py-4 md:py-10 text-base md:text-3xl h-auto bg-primary text-white w-fit shadow-2xl">
                  Go to Lobby
                </Button>
                <Button variant="ghost" onClick={() => window.location.reload()} className="text-muted-foreground font-black flex items-center gap-2 text-sm md:text-xl hover:text-primary">
                  <RefreshCcw className="h-4 w-4 md:h-6 md:w-6" /> Play Again
                </Button>
             </div>
          </div>
        )}
      </div>
    </div>
  );
}
