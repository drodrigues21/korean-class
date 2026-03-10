import {
	collection,
	deleteDoc,
	doc,
	getDocs,
	writeBatch,
} from "firebase/firestore";
import { db } from "./firebase";

/**
 * Deletes users/{uid} and all users/{uid}/progress/* docs.
 * Intended for admin testing only.
 */
export async function resetMyProgress(uid) {
	if (!uid) throw new Error("Missing uid");

	const batch = writeBatch(db);

	// Delete all progress docs
	const progressRef = collection(db, "users", uid, "progress");
	const progressSnap = await getDocs(progressRef);

	progressSnap.forEach((d) => {
		batch.delete(d.ref);
	});

	// Delete user doc
	const userRef = doc(db, "users", uid);
	batch.delete(userRef);

	await batch.commit();
}
