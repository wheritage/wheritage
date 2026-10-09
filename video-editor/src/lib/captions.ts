import type { Caption } from "@remotion/captions";

export type CaptionPage = { startMs: number; endMs: number; words: Caption[] };

/**
 * Group words into short pages: at most `perPage` words, and a new page after
 * sentence punctuation or a pause, so a page never straddles two thoughts.
 */
export const paginate = (words: Caption[], perPage: number, pauseMs = 550): CaptionPage[] => {
  const pages: CaptionPage[] = [];
  let cur: Caption[] = [];
  const flush = () => {
    if (!cur.length) return;
    pages.push({ startMs: cur[0].startMs, endMs: cur[cur.length - 1].endMs, words: cur });
    cur = [];
  };
  words.forEach((w, i) => {
    const prev = words[i - 1];
    if (cur.length && (cur.length >= perPage || (prev && w.startMs - prev.endMs > pauseMs))) flush();
    cur.push(w);
    if (/[.!?…,;:]$/.test(w.text.trim())) flush();
  });
  flush();
  return pages;
};

export const normalizeWord = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9']+/g, "");
