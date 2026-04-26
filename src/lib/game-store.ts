
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
  limit
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
  { id: "1", word: "CAT", difficulty: "beginner", definition: "A small furry animal with whiskers.", exampleSentence: "The cat is sleeping on the mat.", theme: "Animals", imageUrl: "https://picsum.photos/seed/cat/600/400" },
  { id: "2", word: "APPLE", difficulty: "beginner", definition: "A round fruit with red or green skin.", exampleSentence: "I ate a crunchy red apple.", theme: "Food", imageUrl: "https://picsum.photos/seed/apple/600/400" },
  { id: "3", word: "PENCIL", difficulty: "intermediate", definition: "A tool used for writing or drawing.", exampleSentence: "Use your pencil to draw a circle.", theme: "School", imageUrl: "https://picsum.photos/seed/pencil/600/400" },
  { id: "4", word: "SPACE", difficulty: "intermediate", definition: "The area beyond the Earth's atmosphere.", exampleSentence: "Astronauts travel into space.", theme: "Science", imageUrl: "https://picsum.photos/seed/space/600/400" },
  { id: "5", word: "BOOK", difficulty: "beginner", definition: "A set of printed pages held together.", exampleSentence: "I love reading a story book before bed.", theme: "School", imageUrl: "https://picsum.photos/seed/book/600/400" },
  { id: "6", word: "FRIEND", difficulty: "intermediate", definition: "A person you know well and like.", exampleSentence: "She is my best friend at school.", theme: "General", imageUrl: "https://picsum.photos/seed/friend/600/400" },
  { id: "7", word: "ELEPHANT", difficulty: "advanced", definition: "A very large gray animal with a long trunk.", exampleSentence: "The elephant sprayed water with its trunk.", theme: "Animals", imageUrl: "https://picsum.photos/seed/elephant/600/400" },
  { id: "8", word: "MOUNTAIN", difficulty: "advanced", definition: "A very high hill often with snow on top.", exampleSentence: "We climbed to the top of the mountain.", theme: "Nature", imageUrl: "https://picsum.photos/seed/mountain/600/400" },
];

export function useGameStore() {
  const { user, loading: userLoading } = useUser();
  const db = useFirestore();

  // Words
  const wordsQuery = useMemo(() => (db ? collection(db, 'words') : null), [db]);
  const { data: firebaseWords, loading: wordsLoading } = useCollection<WordItem>(wordsQuery);

  // Overall Stats
  const statsRef = useMemo(() => (db && user?.uid ? doc(db, 'users', user.uid, 'stats', 'main') : null), [db, user?.uid]);
  const { data: firebaseStats, loading: statsLoading } = useDoc<UserStats>(statsRef);

  // Active Class
  const activeClassRef = useMemo(() => {
    if (!db || !firebaseStats?.activeClassId) return null;
    return doc(db, 'classrooms', firebaseStats.activeClassId);
  }, [db, firebaseStats?.activeClassId]);
  const { data: activeClass, loading: classLoading } = useDoc<Classroom>(activeClassRef);

  // Class Progress
  const classProgressRef = useMemo(() => {
    if (!db || !user?.uid || !firebaseStats?.activeClassId) return null;
    return doc(db, 'classrooms', firebaseStats.activeClassId, 'pupils', user.uid);
  }, [db, user?.uid, firebaseStats?.activeClassId]);
  const { data: classProgress } = useDoc<PupilProgress>(classProgressRef);

  const stats = useMemo((): UserStats => {
    return firebaseStats || { stars: 0, wordsMastered: 0, correctLetters: 0 };
  }, [firebaseStats]);

  const allWords = useMemo(() => {
    const custom = firebaseWords || [];
    return [...DEFAULT_WORDS, ...custom];
  }, [firebaseWords]);

  // If in a class, only use assigned words. Otherwise use all.
  const playableWords = useMemo(() => {
    if (!activeClass || !activeClass.assignedWordIds || activeClass.assignedWordIds.length === 0) {
      return allWords;
    }
    return allWords.filter(w => activeClass.assignedWordIds.includes(w.id));
  }, [allWords, activeClass]);

  const updateStats = useCallback((updates: Partial<UserStats>) => {
    if (!statsRef) return;
    
    setDoc(statsRef, updates, { merge: true })
      .catch(async () => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: statsRef.path,
          operation: 'update',
          requestResourceData: updates
        } satisfies SecurityRuleContext));
      });

    // Mirror progress to the classroom if active
    if (classProgressRef && (updates.stars || updates.wordsMastered)) {
      const classUpdates = {
        stars: updates.stars ? increment(typeof updates.stars === 'number' ? updates.stars : 1) : increment(0),
        wordsMastered: updates.wordsMastered ? increment(1) : increment(0),
        pupilName: user?.displayName || "Pupil"
      };
      
      setDoc(classProgressRef, classUpdates, { merge: true })
        .catch(async () => {
          errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: classProgressRef.path,
            operation: 'update',
            requestResourceData: classUpdates
          } satisfies SecurityRuleContext));
        });
    }
  }, [statsRef, classProgressRef, user?.displayName]);

  const addStars = useCallback((amount: number) => updateStats({ stars: increment(amount) }), [updateStats]);
  const addCorrectLetter = useCallback(() => updateStats({ correctLetters: increment(1) }), [updateStats]);
  const addWordMastered = useCallback(() => updateStats({ wordsMastered: increment(1) }), [updateStats]);

  const joinClass = useCallback(async (code: string) => {
    if (!db || !user?.uid || !statsRef) return false;
    
    const q = query(collection(db, 'classrooms'), where('code', '==', code.toUpperCase()), limit(1));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) return false;
    
    const classDoc = snapshot.docs[0];
    
    setDoc(statsRef, { activeClassId: classDoc.id }, { merge: true })
      .catch(async () => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: statsRef.path,
          operation: 'update',
          requestResourceData: { activeClassId: classDoc.id }
        } satisfies SecurityRuleContext));
      });
    
    // Create initial pupil record in the class
    const pRef = doc(db, 'classrooms', classDoc.id, 'pupils', user.uid);
    const pupilData = { pupilName: user.displayName, stars: 0, wordsMastered: 0 };
    
    setDoc(pRef, pupilData, { merge: true })
      .catch(async () => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: pRef.path,
          operation: 'write',
          requestResourceData: pupilData
        } satisfies SecurityRuleContext));
      });
    
    return true;
  }, [db, user, statsRef]);

  const leaveClass = useCallback(() => {
    if (!statsRef) return;
    setDoc(statsRef, { activeClassId: null }, { merge: true })
      .catch(async () => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: statsRef.path,
          operation: 'update',
          requestResourceData: { activeClassId: null }
        } satisfies SecurityRuleContext));
      });
  }, [statsRef]);

  const isLoaded = !userLoading && !wordsLoading && (!user || !statsLoading);

  return {
    stats,
    allWords,
    playableWords,
    activeClass,
    joinClass,
    leaveClass,
    addStars,
    addCorrectLetter,
    addWordMastered,
    isLoaded
  };
}
