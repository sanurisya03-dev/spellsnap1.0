"use client";

import { useEffect, useState, useMemo, useCallback } from "react";

export type Difficulty = "beginner" | "intermediate" | "advanced";

export interface WordItem {
  id: string;
  word: string;
  definition: string;
  exampleSentence: string;
  imageHint?: string;
  theme?: string;
}

export interface UserStats {
  stars: number;
  wordsMastered: number;
  completedLevels: number;
  correctLetters: number;
}

const DEFAULT_WORDS: WordItem[] = [
  { id: "1", word: "CAT", definition: "A small furry animal with whiskers.", exampleSentence: "The cat is sleeping on the mat.", theme: "Animals" },
  { id: "2", word: "APPLE", definition: "A round fruit with red or green skin.", exampleSentence: "I ate a crunchy red apple.", theme: "Food" },
  { id: "3", word: "PENCIL", definition: "A tool used for writing or drawing.", exampleSentence: "Use your pencil to draw a circle.", theme: "School" },
  { id: "4", word: "SPACE", definition: "The area beyond the Earth's atmosphere.", exampleSentence: "Astronauts travel into space.", theme: "Science" },
  { id: "5", word: "BOOK", definition: "A set of printed pages held together.", exampleSentence: "I love reading a story book before bed.", theme: "School" },
  { id: "6", word: "FRIEND", definition: "A person you know well and like.", exampleSentence: "She is my best friend at school.", theme: "General" },
];

export function useGameStore() {
  const [stats, setStats] = useState<UserStats>({
    stars: 0,
    wordsMastered: 0,
    completedLevels: 0,
    correctLetters: 0,
  });

  const [customWords, setCustomWords] = useState<WordItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const savedStats = localStorage.getItem("spellsnap_stats");
    const savedWords = localStorage.getItem("spellsnap_words");

    if (savedStats) setStats(JSON.parse(savedStats));
    if (savedWords) setCustomWords(JSON.parse(savedWords));
    setIsLoaded(true);
  }, []);

  const allWords = useMemo(() => [...DEFAULT_WORDS, ...customWords], [customWords]);

  const addStars = useCallback((amount: number) => {
    setStats(prev => {
      const next = { ...prev, stars: prev.stars + amount };
      localStorage.setItem("spellsnap_stats", JSON.stringify(next));
      return next;
    });
  }, []);

  const addCorrectLetter = useCallback(() => {
    setStats(prev => {
      const next = { ...prev, correctLetters: prev.correctLetters + 1 };
      localStorage.setItem("spellsnap_stats", JSON.stringify(next));
      return next;
    });
  }, []);

  const addWordMastered = useCallback(() => {
    setStats(prev => {
      const next = { ...prev, wordsMastered: prev.wordsMastered + 1 };
      localStorage.setItem("spellsnap_stats", JSON.stringify(next));
      return next;
    });
  }, []);

  const addCustomWord = useCallback((word: WordItem) => {
    setCustomWords(prev => {
      const updated = [...prev, word];
      localStorage.setItem("spellsnap_words", JSON.stringify(updated));
      return updated;
    });
  }, []);

  const deleteCustomWord = useCallback((id: string) => {
    setCustomWords(prev => {
      const updated = prev.filter(w => w.id !== id);
      localStorage.setItem("spellsnap_words", JSON.stringify(updated));
      return updated;
    });
  }, []);

  return {
    stats,
    allWords,
    customWords,
    addStars,
    addCorrectLetter,
    addWordMastered,
    addCustomWord,
    deleteCustomWord,
    isLoaded
  };
}
