'use strict';

import './search.css';
import { fetchMetadata, search } from './utils/search';

(() => {
  function debounce<T extends (e: Event) => void>(func: T): (e: Event) => void {
    let timeout: NodeJS.Timeout | null;

    return function (e: Event) {
      if (timeout) clearTimeout(timeout);

      timeout = setTimeout(() => {
        func(e);
        timeout = null;
      }, 500);
    };
  }

  function getQueryParams() {
    const queryString = window.location.search.substring(1); // Remove the leading '?'
    const params: Map<string, string> = new Map();

    queryString.split('&').forEach((param) => {
      const [key, value] = param.split('=');
      params.set(decodeURIComponent(key), decodeURIComponent(value || ''));
    });

    return params;
  }

  async function onInput(e: Event) {
    const input = e.target as HTMLInputElement;
    if (!input.value) return;
    await load(input.value, 0);
  }

  async function load(query: string, page: number) {
    const container = document.getElementById(
      'search-result-container'
    ) as HTMLElement;
    container.replaceChildren();

    const loadingTemplate = document.getElementById(
      'loading'
    ) as HTMLTemplateElement;
    const loadingClone = document.importNode(loadingTemplate.content, true);
    container.appendChild(loadingClone);

    const data = await search(query, page);
    const ids = data.map((d) => d.id);
    const metadata = await fetchMetadata(ids);
    if (ids.length == metadata.length) {
      container.replaceChildren();
      const template = document.getElementById(
        'search-result'
      ) as HTMLTemplateElement;
      for (let i = 0; i < ids.length; i++) {
        const clone = document.importNode(template.content, true);
        const m = metadata[i];
        const link = clone.querySelector('a')!;
        link.href = m.link;
        link.textContent = m.title;

        const sub = clone.querySelector('span') as HTMLElement;
        sub.textContent = m.authors.join(', ') + '. ' + m.published;

        const text = clone.querySelector('.text') as HTMLElement;
        for (const d of data[i].data) {
          const node = document.createElement('p');
          node.textContent = d.text;
          const sim = document.createElement('span');
          sim.setAttribute('class', 'sim');
          sim.textContent = `Similarity: ${(d.score * 100).toFixed(1)} %`;
          node.appendChild(sim);
          text.appendChild(node);
        }

        container.appendChild(clone);
      }
    }

    const paginationTemplate = document.getElementById(
      'pagination'
    ) as HTMLTemplateElement;
    const paginationClone = document.importNode(
      paginationTemplate.content,
      true
    );
    paginationClone.querySelector('span')!.textContent = `${page + 1}`;
    const links = paginationClone.querySelectorAll('a');
    links[1].onclick = async () => await load(query, page + 1);
    if (page > 0) {
      links[0].onclick = async () => await load(query, page - 1);
    } else {
      links[0].setAttribute('class', 'disabled');
    }

    container.appendChild(paginationClone);
  }

  document.addEventListener('DOMContentLoaded', async () => {
    const inputElem = document.getElementById('selection') as HTMLInputElement;
    inputElem.oninput = debounce(onInput);

    const params = getQueryParams();
    if (params.has('selection')) {
      const query = params.get('selection') ?? '';
      inputElem.value = query;
      if (!!query) await load(query, 0);
    }
  });
})();
