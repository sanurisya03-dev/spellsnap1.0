
"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { 
  collection, 
  doc, 
  setDoc, 
  addDoc, 
  deleteDoc, 
  serverTimestamp, 
  increment 
} from 'firebase/firestore';
import { useFirestore, useUser, useCollection, useDoc } from '@/firebase';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

export type Difficulty = "beginner" | "intermediate" | "advanced";

export interface WordItem {
  id: string;
  word: string;
  definition: string;
  exampleSentence: string;
  imageUrl?: string;
  theme?: string;
  userId?: string;
}

export interface UserStats {
  stars: number;
  wordsMastered: number;
  correctLetters: number;
}

const DEFAULT_WORDS: WordItem[] = [
  { id: "1", word: "CAT", definition: "A small furry animal with whiskers.", exampleSentence: "The cat is sleeping on the mat.", theme: "Animals", imageUrl: "https://picsum.photos/seed/cat/600/400" },
  { id: "2", word: "APPLE", definition: "A round fruit with red or green skin.", exampleSentence: "I ate a crunchy red apple.", theme: "Food", imageUrl: "https://picsum.photos/seed/apple/600/400" },
  { id: "3", word: "PENCIL", definition: "A tool used for writing or drawing.", exampleSentence: "Use your pencil to draw a circle.", theme: "School", imageUrl: "https://picsum.photos/seed/pencil/600/400" },
  { id: "4", word: "SPACE", definition: "The area beyond the Earth's atmosphere.", exampleSentence: "Astronauts travel into space.", theme: "Science", imageUrl: "https://picsum.photos/seed/space/600/400" },
  { id: "5", word: "BOOK", definition: "A set of printed pages held together.", exampleSentence: "I love reading a story book before bed.", theme: "School", imageUrl: "https://picsum.photos/seed/book/600/400" },
  { id: "6", word: "FRIEND", definition: "A person you know well and like.", exampleSentence: "She is my best friend at school.", theme: "General", imageUrl: "https://picsum.photos/seed/friend/600/400" },
];

export function useGameStore() {
  const { user, loading: userLoading } = useUser();
  const db = useFirestore();

  const wordsQuery = useMemo(() => {
    if (!db) return null;
    return collection(db, 'words');
  }, [db]);

  const { data: firebaseWords, loading: wordsLoading } = useCollection<WordItem>(wordsQuery);
  
  const statsRef = useMemo(() => {
    if (!db || !user?.uid) return null;
    return doc(db, 'users', user.uid, 'stats', 'main');
  }, [db, user?.uid]);

  const { data: firebaseStats, loading: statsLoading } = useDoc<UserStats>(statsRef);

  const stats = useMemo((): UserStats => {
    return firebaseStats || {
      stars: 0,
      wordsMastered: 0,
      correctLetters: 0,
    };
  }, [firebaseStats]);

  const allWords = useMemo(() => {
    const custom = firebaseWords || [];
    // Memoize to avoid unnecessary re-renders in effects
    return [...DEFAULT_WORDS, ...custom];
  }, [firebaseWords]);

  const addStars = useCallback((amount: number) => {
    if (!db || !user?.uid || !statsRef) return;
    setDoc(statsRef, { stars: increment(amount) }, { merge: true })
      .catch(async () => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: statsRef.path,
          operation: 'update',
          requestResourceData: { stars: amount }
        }));
      });
  }, [db, user?.uid, statsRef]);

  const addCorrectLetter = useCallback(() => {
    if (!db || !user?.uid || !statsRef) return;
    setDoc(statsRef, { correctLetters: increment(1) }, { merge: true })
      .catch(async () => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: statsRef.path,
          operation: 'update',
          requestResourceData: { correctLetters: 1 }
        }));
      });
  }, [db, user?.uid, statsRef]);

  const addWordMastered = useCallback(() => {
    if (!db || !user?.uid || !statsRef) return;
    setDoc(statsRef, { wordsMastered: increment(1) }, { merge: true })
      .catch(async () => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: statsRef.path,
          operation: 'update',
          requestResourceData: { wordsMastered: 1 }
        }));
      });
  }, [db, user?.uid, statsRef]);

  const addCustomWord = useCallback((word: Omit<WordItem, 'id'>) => {
    if (!db || !user?.uid) return;
    const colRef = collection(db, 'words');
    const wordData = { ...word, userId: user.uid, createdAt: serverTimestamp() };
    addDoc(colRef, wordData)
      .catch(async () => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: colRef.path,
          operation: 'create',
          requestResourceData: wordData
        }));
      });
  }, [db, user?.uid]);

  const deleteCustomWord = useCallback((id: string) => {
    if (!db) return;
    const docRef = doc(db, 'words', id);
    deleteDoc(docRef)
      .catch(async () => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: docRef.path,
          operation: 'delete'
        }));
      });
  }, [db]);

  const isLoaded = !userLoading && !wordsLoading && (!user || !statsLoading);

  return {
    stats,
    allWords,
    customWords: firebaseWords || [],
    addStars,
    addCorrectLetter,
    addWordMastered,
    addCustomWord,
    deleteCustomWord,
    isLoaded
  };
}
