import {
    doc,
    getDoc,
    serverTimestamp,
    writeBatch,
    increment,
  } from "firebase/firestore";
  import { db } from "./firebase";
  
  // Format: YYYY-MM-DD (local)
  function todayKey() {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }
  
  function yesterdayKey() {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }
  
  /**
   * Save a quiz summary:
   * - updates user streak + xp
   * - updates per-card correct/wrong totals
   *
   * answers: Array<{ cardId: string, correct: boolean }>
   */
  export async function saveQuizProgress({ uid, deckId, mode, answers }) {
    if (!uid) throw new Error("Missing uid");
    if (!deckId) throw new Error("Missing deckId");
  
    const batch = writeBatch(db);
  
    const userRef = doc(db, "users", uid);
    const userSnap = await getDoc(userRef);
  
    const today = todayKey();
    const yesterday = yesterdayKey();
  
    // Calculate score
    const correctCount = answers.filter((a) => a.correct).length;
  
    // Create/Update user doc + streak
    let newStreak = 1;
    let lastActiveDate = null;
  
    if (userSnap.exists()) {
      const data = userSnap.data();
      lastActiveDate = data.lastActiveDate || null;
      const currentStreak = data.streak || 0;
  
      if (lastActiveDate === today) {
        // already active today → keep streak as-is
        newStreak = currentStreak || 1;
      } else if (lastActiveDate === yesterday) {
        newStreak = (currentStreak || 0) + 1;
      } else {
        newStreak = 1;
      }
    }
  
    batch.set(
      userRef,
      {
        lastActiveDate: today,
        streak: newStreak,
        xpTotal: increment(correctCount), // simple XP = correct answers
        lastDeckId: deckId,
        lastMode: mode,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  
    // Per-card progress docs
    for (const a of answers) {
      const progressRef = doc(db, "users", uid, "progress", `${deckId}_${a.cardId}`);
  
      batch.set(
        progressRef,
        {
          deckId,
          cardId: a.cardId,
          correct: increment(a.correct ? 1 : 0),
          wrong: increment(a.correct ? 0 : 1),
          lastSeenAt: serverTimestamp(),
          lastMode: mode,
        },
        { merge: true }
      );
    }
  
    await batch.commit();
  
    return { correctCount, total: answers.length, streak: newStreak };
  }