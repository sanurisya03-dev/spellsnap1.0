
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
  activeClassId?: string;
}

export interface Classroom {
  id: string;
  name: string;
  code: string;
  teacherId: string;
  assignedWordIds: string[];
}

export interface PupilProgress {
  id: string;
  stars: number;
  wordsMastered: number;
  pupilName: string;
}

const DEFAULT_WORDS: WordItem[] = [
  { id: "1", word: "CAT", difficulty: "beginner", definition: "A small furry animal with whiskers.", exampleSentence: "The cat is sleeping on the mat.", theme: "Animals", imageUrl: "https://picsum.photos/seed/cat/600/400", phonemes: "/kæt/" },
  { id: "2", word: "APPLE", difficulty: "beginner", definition: "A round fruit with red or green skin.", exampleSentence: "I ate a crunchy red apple.", theme: "Food", imageUrl: "https://picsum.photos/seed/apple/600/400", phonemes: "/ˈæpəl/" },
  { id: "3", word: "PENCIL", difficulty: "intermediate", definition: "A tool used for writing or drawing.", exampleSentence: "Use your pencil to draw a circle.", theme: "School", imageUrl: "https://picsum.photos/seed/pencil/600/400", phonemes: "/ˈpensəl/" },
  { id: "4", word: "SPACE", difficulty: "intermediate", definition: "The area beyond the Earth's atmosphere.", exampleSentence: "Astronauts travel into space.", theme: "Science", imageUrl: "https://picsum.photos/seed/space/600/400", phonemes: "/speɪs/" },
  { id: "5", word: "BOOK", difficulty: "beginner", definition: "A set of printed pages held together.", exampleSentence: "I love reading a story book before bed.", theme: "School", imageUrl: "https://picsum.photos/seed/book/600/400", phonemes: "/bʊk/" },
  { id: "6", word: "FRIEND", difficulty: "intermediate", definition: "A person you know well and like.", exampleSentence: "She is my best friend at school.", theme: "General", imageUrl: "https://picsum.photos/seed/friend/600/400", phonemes: "/frend/" },
  { id: "7", word: "ELEPHANT", difficulty: "advanced", definition: "A very large gray animal with a long trunk.", exampleSentence: "The elephant sprayed water with its trunk.", theme: "Animals", imageUrl: "https://picsum.photos/seed/elephant/600/400", phonemes: "/ˈelɪfənt/" },
  { id: "8", word: "MOUNTAIN", difficulty: "advanced", definition: "A very high hill often with snow on top.", exampleSentence: "We climbed to the top of the mountain.", theme: "Nature", imageUrl: "https://picsum.photos/seed/mountain/600/400", phonemes: "/ˈmaʊntɪn/" },
];

export function useGameStore() {
  const { user, loading: userLoading } = useUser();
  const db = useFirestore();

  const wordsQuery = useMemo(() => (db ? collection(db, 'words') : null), [db]);
  const { data: firebaseWords, loading: wordsLoading } = useCollection<WordItem>(wordsQuery);

  const statsRef = useMemo(() => (db && user?.uid ? doc(db, 'users', user.uid, 'stats', 'main') : null), [db, user?.uid]);
  const { data: firebaseStats, loading: statsLoading } = useDoc<UserStats>(statsRef);

  const activeClassRef = useMemo(() => {
    if (!db || !firebaseStats?.activeClassId) return null;
    return doc(db, 'classrooms', firebaseStats.activeClassId);
  }, [db, firebaseStats?.activeClassId]);
  const { data: activeClass, loading: classLoading } = useDoc<Classroom>(activeClassRef);

  const stats = useMemo((): UserStats => {
    return firebaseStats || { stars: 0, wordsMastered: 0, correctLetters: 0 };
  }, [firebaseStats]);

  const allWords = useMemo(() => {
    const custom = firebaseWords || [];
    return [...DEFAULT_WORDS, ...custom];
  }, [firebaseWords]);

  const playableWords = useMemo(() => {
    if (activeClass && activeClass.assignedWordIds && activeClass.assignedWordIds.length > 0) {
      const assigned = allWords.filter(w => activeClass.assignedWordIds.includes(w.id));
      return assigned.length > 0 ? assigned : allWords;
    }
    return allWords;
  }, [allWords, activeClass]);

  const updateStats = useCallback(async (updates: Partial<UserStats>) => {
    if (!statsRef || !db || !user?.uid) return;
    
    try {
      await setDoc(statsRef, updates, { merge: true });

      if (firebaseStats?.activeClassId) {
        const classProgressRef = doc(db, 'classrooms', firebaseStats.activeClassId, 'pupils', user.uid);
        const classUpdates = {
          stars: updates.stars ? increment(1) : increment(0),
          wordsMastered: updates.wordsMastered ? increment(1) : increment(0),
          pupilName: user?.displayName || "Pupil"
        };
        await setDoc(classProgressRef, classUpdates, { merge: true });
      }
    } catch (err: any) {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: statsRef.path,
        operation: 'update',
        requestResourceData: updates
      } satisfies SecurityRuleContext));
    }
  }, [statsRef, user, firebaseStats?.activeClassId, db]);

  const toggleWordAssignment = useCallback(async (wordId: string) => {
    if (!db || !activeClass) return;
    const current = activeClass.assignedWordIds || [];
    const next = current.includes(wordId) 
      ? current.filter(id => id !== wordId)
      : [...current, wordId];
    
    const docRef = doc(db, 'classrooms', activeClass.id);
    try {
      await setDoc(docRef, { assignedWordIds: next }, { merge: true });
    } catch (err: any) {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: docRef.path,
        operation: 'update',
        requestResourceData: { assignedWordIds: next }
      } satisfies SecurityRuleContext));
    }
  }, [db, activeClass]);

  const addStars = useCallback((amount: number) => updateStats({ stars: increment(amount) }), [updateStats]);
  const addCorrectLetter = useCallback(() => updateStats({ correctLetters: increment(1) }), [updateStats]);
  const addWordMastered = useCallback(() => updateStats({ wordsMastered: increment(1) }), [updateStats]);

  const joinClass = useCallback(async (code: string) => {
    if (!db || !user?.uid) {
       console.error("Database or User not ready for joining class");
       return false;
    }
    
    const cleanCode = code.trim().toUpperCase();
    console.log("Searching for class with code:", cleanCode);
    
    try {
      const q = query(collection(db, 'classrooms'), where('code', '==', cleanCode), limit(1));
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        console.warn("No classroom found for code:", cleanCode);
        return false;
      }
      
      const classDoc = snapshot.docs[0];
      const classId = classDoc.id;
      console.log("Found classroom:", classId);
      
      // Update the student's active class in their main stats
      const userStatsRef = doc(db, 'users', user.uid, 'stats', 'main');
      await setDoc(userStatsRef, { activeClassId: classId }, { merge: true });
      
      // Add or Update student profile in the specific classroom's pupils collection
      const pupilRef = doc(db, 'classrooms', classId, 'pupils', user.uid);
      await setDoc(pupilRef, {
        pupilName: user.displayName || "Little Explorer",
        stars: 0,
        wordsMastered: 0
      }, { merge: true });

      return true;
    } catch (error) {
      console.error("Error during joinClass process:", error);
      return false;
    }
  }, [db, user]);

  const leaveClass = useCallback(async () => {
    if (!statsRef) return;
    await setDoc(statsRef, { activeClassId: null }, { merge: true });
  }, [statsRef]);

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
    customWords: firebaseWords || [],
    playableWords,
    activeClass,
    joinClass,
    leaveClass,
    toggleWordAssignment,
    addStars,
    addCorrectLetter,
    addWordMastered,
    addCustomWord,
    deleteCustomWord,
    isLoaded,
    loadingData: wordsLoading || statsLoading || classLoading
  };
}
