"use strict";

import Parser from "rss-parser";

const SEARCH_URL = "https://embedding.azurewebsites.net/query";
const QUERY_PREFIX = "Represent this sentence for searching relevant passages: ";
const ARXIV_QUERY_URL = "https://export.arxiv.org/api/query";
const PAGE_SIZE = 10;

export async function search(query: string, page: number) {
  const content = await (await fetch(SEARCH_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      text: QUERY_PREFIX + query,
      limit: PAGE_SIZE,
      offset: PAGE_SIZE * page
    })
  })).json() as { payload: { id: string, text: string }, score: number }[];

  const data = new Map<string, { id: string, data: { text: string, score: number }[] }>();
  const ids: string[] = [];
  for (const c of content) {
    if (!c.payload.id || !c.payload.text) continue;
    if (data.has(c.payload.id)) data.get(c.payload.id)!.data.push({ text: c.payload.text, score: c.score });
    else {
      data.set(c.payload.id, { id: c.payload.id, data: [{ text: c.payload.text, score: c.score }] });
      ids.push(c.payload.id);
    }
  }

  return ids.map(id => data.get(id)!);
}

export async function fetchMetadata(ids: string[]) {
  const response = await (await fetch(ARXIV_QUERY_URL + `?id_list=${ids.join(",")}&max_results=${ids.length}`,
    { method: 'GET' })).text();
  const parser = new Parser({
    customFields: {
      item: [
        "id", "title", "pubDate",
        ["author", "authors", { keepArray: true }],
      ]
    }
  });

  const xml = await parser.parseString(response);
  const metadata: { link: string, title: string, published: string, authors: string[] }[] = [];
  for (const entry of xml.items) {
    metadata.push({
      link: entry["id"] ?? "",
      title: entry["title"] ?? "",
      published: (entry["pubDate"] ?? "").split("T")[0],
      authors: (entry["authors"] as { name: string }[]).map(e => e.name)
    })
  }

  return metadata;
}