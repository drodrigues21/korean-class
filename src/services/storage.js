import { ref, getDownloadURL } from "firebase/storage";
import { storage } from "./firebase";

const urlCache = new Map();

/**
 * Convert a Firebase Storage path like "cards/week01/hit.jpg"
 * into a usable download URL, with simple in-memory caching.
 */
export async function getImageUrl(imagePath) {
  if (!imagePath) return "";
  if (urlCache.has(imagePath)) return urlCache.get(imagePath);

  const url = await getDownloadURL(ref(storage, imagePath));
  urlCache.set(imagePath, url);
  return url;
}