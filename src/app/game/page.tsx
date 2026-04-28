
"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { ArrowLeft, Star, RefreshCcw, Info, Loader2, Cloud, Clock, Volume2, Keyboard, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useGameStore, type WordItem, type Difficulty } from "@/lib/game-store";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import Image from "next/image";
import confetti from "canvas-confetti";
import { useUser } from "@/firebase";

type GameState = "intro" | "memorizing" | "playing" | "success" | "finished" | "empty";

export default function GamePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const difficulty = (searchParams.get("difficulty") || "beginner") as Difficulty;
  const { playableWords, addStars, addCorrectLetter, addWordMastered, isLoaded } = useGameStore();
  const { user } = useUser();

  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [userInput, setUserInput] = useState<string[]>([]);
  const [gameState, setGameState] = useState<GameState>("intro");
  const [wordsToPlay, setWordsToPlay] = useState<WordItem[]>([]);
  const [isWrong, setIsWrong] = useState(false);
  const [timer, setTimer] = useState(10);
  const [hiddenIndices, setHiddenIndices] = useState<number[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const hiddenInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isLoaded || wordsToPlay.length > 0) return;
    
    if (playableWords.length === 0) {
      setGameState("empty");
      return;
    }

    let filtered = playableWords.filter(w => w.difficulty === difficulty);
    if (filtered.length === 0) filtered = playableWords;

    const shuffled = [...filtered].sort(() => 0.5 - Math.random()).slice(0, 5);
    setWordsToPlay(shuffled);
  }, [playableWords, difficulty, isLoaded, wordsToPlay.length]);

  const currentWord = useMemo(() => wordsToPlay[currentWordIndex], [wordsToPlay, currentWordIndex]);

  const playSfx = (type: 'success' | 'fail') => {
    const urls = {
      success: "https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3",
      fail: "https://assets.mixkit.co/active_storage/sfx/212/212-preview.mp3"
    };
    const audio = new Audio(urls[type]);
    audio.play().catch(() => {});
  };

  const triggerConfetti = () => {
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#F7A71C', '#335', '#195', '#B85122']
    });
  };

  const speakText = useCallback((text: string) => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text.toLowerCase());
      utterance.rate = 0.8;
      window.speechSynthesis.speak(utterance);
    }
  }, []);

  const playAudio = useCallback(() => {
    if (!currentWord) return;
    if (currentWord.audioUrl) {
      const audio = new Audio(currentWord.audioUrl);
      audio.play().catch(() => speakText(currentWord.word));
    } else {
      speakText(currentWord.word);
    }
  }, [currentWord, speakText]);

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

  const focusInput = () => {
    if (hiddenInputRef.current) {
      hiddenInputRef.current.focus();
    }
  };

  const startSpellingChallenge = () => {
    if (!currentWord) return;
    const indices = Array.from({ length: currentWord.word.length }, (_, i) => i);
    let toHide: number[] = [];
    if (difficulty === "advanced") toHide = indices;
    else if (difficulty === "intermediate") toHide = [...indices].sort(() => 0.5 - Math.random()).slice(0, Math.ceil(currentWord.word.length / 2));
    else toHide = [...indices].sort(() => 0.5 - Math.random()).slice(0, Math.min(currentWord.word.length - 1, 2));
    
    setHiddenIndices(toHide);
    setUserInput(currentWord.word.split('').map((char, i) => toHide.includes(i) ? "" : char.toUpperCase()));
    setGameState("playing");
    setTimeout(focusInput, 100);
  };

  const handleCharInput = useCallback((char: string) => {
    if (gameState !== "playing") return;
    const upperChar = char.toUpperCase();
    if (/^[A-Z]$/.test(upperChar)) {
      setUserInput(prev => {
        const nextEmptyHidden = prev.findIndex((c, i) => c === "" && hiddenIndices.includes(i));
        if (nextEmptyHidden !== -1) {
          const next = [...prev];
          next[nextEmptyHidden] = upperChar;
          return next;
        }
        return prev;
      });
    }
  }, [gameState, hiddenIndices]);

  const handleBackspace = useCallback(() => {
    if (gameState !== "playing") return;
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
  }, [gameState, hiddenIndices]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Backspace") handleBackspace();
      else handleCharInput(e.key);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleCharInput, handleBackspace]);

  useEffect(() => {
    if (gameState === "playing" && currentWord && !userInput.includes("")) {
      if (userInput.join("") === currentWord.word.toUpperCase()) {
        setGameState("success");
        playSfx('success');
        triggerConfetti();
        if (user) {
          addStars(1);
          addWordMastered();
          addCorrectLetter();
        }
      } else {
        setIsWrong(true);
        playSfx('fail');
        setTimeout(() => {
          setIsWrong(false);
          setUserInput(prev => prev.map((char, i) => hiddenIndices.includes(i) ? "" : char));
        }, 800);
      }
    }
  }, [userInput, currentWord, gameState, addStars, addWordMastered, addCorrectLetter, hiddenIndices, user]);

  if (!isLoaded) return <div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;

  if (gameState === "empty") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-8 text-center space-y-6">
        <BookOpen className="h-24 w-24 text-primary opacity-20" />
        <h2 className="text-4xl font-black">No words found!</h2>
        <p className="text-xl font-bold text-muted-foreground">Ask a teacher to add some words to the Explorer bank.</p>
        <Button onClick={() => router.push("/")} className="btn-bouncy bg-primary text-white h-16 px-12 text-xl">Go Home</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative flex flex-col p-4 md:p-8" onClick={focusInput}>
      <div className="bg-animate" />
      <input ref={hiddenInputRef} type="text" className="absolute opacity-0 pointer-events-none" value="" onChange={(e) => handleCharInput(e.target.value.slice(-1))} />

      <header className="max-w-5xl w-full mx-auto flex justify-between items-center mb-6 z-20 gap-4">
        <Button variant="ghost" onClick={() => router.push("/")} className="btn-bouncy bg-white/90 px-4 h-10 shadow-xl border-4 border-white text-xs md:text-lg">
          <ArrowLeft className="mr-2" /> Stop
        </Button>
        <div className="flex-1 max-w-[400px]">
          <Progress value={((currentWordIndex + 1) / wordsToPlay.length) * 100} className="h-3 md:h-6 bg-white border-2 border-primary/20 rounded-full" />
        </div>
        <div className="bg-primary text-white font-black px-4 py-1.5 rounded-full shadow-xl border-2 border-white text-[10px] md:text-lg">
          {difficulty.toUpperCase()}
        </div>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center z-10 w-full max-w-6xl mx-auto">
        {gameState === "intro" && currentWord && (
          <div className="w-full max-w-4xl text-center space-y-6 animate-in zoom-in">
            <div className="bg-white/80 p-6 md:p-10 rounded-[2rem] shadow-3xl border-4 border-white flex flex-col md:flex-row items-center gap-6">
              <div className="w-48 h-48 md:w-80 md:h-80 relative rounded-[2rem] overflow-hidden border-4 border-primary/10">
                <Image src={currentWord.imageUrl || `https://picsum.photos/seed/${currentWord.word}/600/600`} alt={currentWord.word} fill className="object-cover" />
              </div>
              <div className="flex-1 space-y-4 text-center md:text-left">
                <h2 className="text-6xl md:text-8xl font-black text-primary uppercase sparkle-text">{currentWord.word}</h2>
                <p className="text-lg md:text-2xl font-bold italic text-muted-foreground">"{currentWord.definition}"</p>
                <Button size="lg" onClick={playAudio} className="rounded-full bg-accent text-white h-14 w-14 shadow-lg"><Volume2 className="h-8 w-8" /></Button>
              </div>
            </div>
            <Button onClick={handleStartMemorizing} className="btn-bouncy px-12 py-6 text-2xl h-auto bg-primary text-white shadow-2xl">I'M READY!</Button>
          </div>
        )}

        {gameState === "memorizing" && currentWord && (
          <div className="text-center space-y-12 animate-in zoom-in">
            <div className="relative">
              <div className="bg-white p-10 md:p-20 rounded-[4rem] shadow-3xl border-8 border-primary/10">
                <p className="text-7xl md:text-[10rem] font-black text-primary uppercase tracking-tighter sparkle-text">{currentWord.word}</p>
              </div>
              <div className="absolute -top-6 -right-6 bg-accent h-20 w-20 rounded-full border-4 border-white flex items-center justify-center text-white text-3xl font-black">{timer}</div>
            </div>
          </div>
        )}

        {gameState === "playing" && currentWord && (
          <div className="w-full max-w-4xl space-y-12 text-center">
            <div className="bg-white/70 p-6 md:p-16 rounded-[3rem] border-8 border-white shadow-3xl space-y-12">
               <div className="flex justify-center gap-4">
                 <div className="h-20 w-20 relative rounded-2xl overflow-hidden border-4 border-white shadow-xl">
                   <img src={currentWord.imageUrl || `https://picsum.photos/seed/${currentWord.word}/200/200`} alt="hint" className="object-cover" />
                 </div>
                 <Button onClick={playAudio} className="h-20 w-20 rounded-full bg-accent text-white"><Volume2 className="h-10 w-10" /></Button>
               </div>
               <div className="flex flex-wrap justify-center gap-3">
                {userInput.map((char, i) => (
                  <div key={i} className={cn("scrabble-tile text-2xl md:text-5xl w-12 h-12 md:w-20 md:h-20", char === "" && "empty", isWrong && hiddenIndices.includes(i) && "error", !hiddenIndices.includes(i) && "opacity-50")}>{char}</div>
                ))}
              </div>
            </div>
          </div>
        )}

        {gameState === "success" && (
          <div className="text-center space-y-8 animate-in duration-500">
            <div className="text-[10rem] animate-bounce">🌟</div>
            <h2 className="text-5xl md:text-8xl font-black text-primary">AWESOME!</h2>
            <Button onClick={() => currentWordIndex + 1 < wordsToPlay.length ? (setCurrentWordIndex(i => i + 1), setGameState("intro")) : setGameState("finished")} className="btn-bouncy px-12 py-6 text-2xl h-auto bg-secondary text-white shadow-2xl">CONTINUE</Button>
          </div>
        )}

        {gameState === "finished" && (
          <div className="text-center space-y-10">
            <div className="text-[10rem]">🏆</div>
            <h2 className="text-6xl font-black">CHAMPION!</h2>
            <Button onClick={() => router.push("/")} className="btn-bouncy px-12 py-8 text-3xl bg-primary text-white">Back to Lobby</Button>
          </div>
        )}
      </div>
    </div>
  );
}
