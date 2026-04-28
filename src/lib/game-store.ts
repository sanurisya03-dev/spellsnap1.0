"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { 
  collection, 
  doc, 
  setDoc, 
  addDoc, 
  deleteDoc, 
  serverTimestamp, 
  increment,
  query,
  where,
  getDocs,
  limit,
  onSnapshot
} from 'firebase/firestore';
import { useFirestore, useUser, useCollection, useDoc } from '@/firebase';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors';

export type Difficulty = "beginner" | "intermediate" | "advanced";

export interface WordItem {
  id: string;
  word: string;
  definition: string;
  exampleSentence: string;
  difficulty: Difficulty;
  imageUrl?: string;
  phonemes?: string;
  audioUrl?: string;
  theme?: string;
  userId?: string;
}

export interface UserStats {
  stars: number;
  wordsMastered: number;
  correctLetters: number;
}

const DEFAULT_WORDS: WordItem[] = [];

export function useGameStore() {
  const { user, loading: userLoading } = useUser();
  const db = useFirestore();

  const wordsQuery = useMemo(() => (db ? collection(db, 'words') : null), [db]);
  const { data: firebaseWords, loading: wordsLoading } = useCollection<WordItem>(wordsQuery);

  const statsRef = useMemo(() => (db && user?.uid ? doc(db, 'users', user.uid, 'stats', 'main') : null), [db, user?.uid]);
  const { data: firebaseStats, loading: statsLoading } = useDoc<UserStats>(statsRef);

  const stats = useMemo((): UserStats => {
    return firebaseStats || { stars: 0, wordsMastered: 0, correctLetters: 0 };
  }, [firebaseStats]);

  const allWords = useMemo(() => {
    return firebaseWords || DEFAULT_WORDS;
  }, [firebaseWords]);

  const updateStats = useCallback(async (updates: Partial<UserStats>) => {
    if (!statsRef || !db || !user?.uid) return;
    
    try {
      await setDoc(statsRef, updates, { merge: true });
    } catch (err: any) {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: statsRef.path,
        operation: 'update',
        requestResourceData: updates
      } satisfies SecurityRuleContext));
    }
  }, [statsRef, user, db]);

  const addStars = useCallback((amount: number) => updateStats({ stars: increment(amount) }), [updateStats]);
  const addCorrectLetter = useCallback(() => updateStats({ correctLetters: increment(1) }), [updateStats]);
  const addWordMastered = useCallback(() => updateStats({ wordsMastered: increment(1) }), [updateStats]);

  const addCustomWord = useCallback(async (wordData: Omit<WordItem, 'id' | 'userId'>) => {
    if (!db || !user?.uid) return;
    const wordRef = collection(db, 'words');
    const data = { ...wordData, userId: user.uid };
    await addDoc(wordRef, data);
  }, [db, user?.uid]);

  const deleteCustomWord = useCallback(async (wordId: string) => {
    if (!db) return;
    const wordRef = doc(db, 'words', wordId);
    await deleteDoc(wordRef);
  }, [db]);

  const isLoaded = !userLoading;

  return {
    stats,
    allWords,
    playableWords: allWords,
    addStars,
    addCorrectLetter,
    addWordMastered,
    addCustomWord,
    deleteCustomWord,
    isLoaded,
    loadingData: wordsLoading || statsLoading
  };
}
