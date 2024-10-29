import { Fragment, render } from "preact";
import { useEffect, useMemo, useRef, useState } from "preact/hooks";
import 'purecss/build/pure-min.css';
import "./styles/FindSimilarPage.css";
import { FindSimilarData, FindSimilarItem, FindSimilarMetadata } from "./FindSimilarItem";
import { fetchMetadata, search } from "../utils/search";
import { getQueryParams } from "../utils/helper";

const FindSimilarPage = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<FindSimilarData[]>([]);
  const [metadata, setMetadata] = useState<FindSimilarMetadata[]>([]);
  const [selection, setSelection] = useState('');
  const [page, setPage] = useState(0);
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setLoading(false);
    setMetadata([]);
    setData([]);

    if (!selection) {
      return;
    }

    setLoading(true);
    search(selection, page).then((dataResponse) => {
      const ids = dataResponse.map((d) => d.id);
      fetchMetadata(ids).then((metadataResponse) => {
        setData(dataResponse);
        setMetadata(metadataResponse);
        setLoading(false);
      });
    });
  }, [page, selection]);

  useEffect(() => {
    if (!loading)
      ref?.current?.focus();
  }, [loading]);

  useEffect(() => {
    const params = getQueryParams();
    setSelection(params.get('selection') ?? '');
    setPage(parseInt(params.get('page') ?? '0'));
  }, []);

  const onPrev = (e: Event) => {
    e.preventDefault();
    setPage(page - 1);
  }

  const onNext = (e: Event) => {
    e.preventDefault();
    setPage(page + 1);
  }

  const onInput = useMemo(() => debounce((e: Event) => {
    const input = e.target as HTMLInputElement;
    setSelection(input.value);
    setPage(0);
  }), []);

  return (
    <div>
      <h1>Find Similar Content on arXiv</h1>
      <input ref={ref} type="text" id="search" placeholder="Search in arXiv..." value={selection} onInput={onInput} disabled={loading} />
      <div id="search-result-container">
        {
          loading ?
            <div style="margin-top: 20px; text-align: center">
              <div class="loading" />
            </div> :
            <Fragment>
              <div>
                {data.map((d, i) => <FindSimilarItem metadata={metadata[i]} data={d} />)}
              </div>
              {data.length > 0 && <div style="margin-top: 20px; text-align: center; font-size: 16px">
                <a href="#" onClick={onPrev} className={page <= 0 ? "disabled" : ""}>Prev</a>
                <span style="padding: 0 20px; color: gray">{page + 1}</span>
                <a href="#" onClick={onNext}>Next</a>
              </div>}
            </Fragment>
        }
      </div>
    </div>
  );
}

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

const App = () => {
  return (
    <FindSimilarPage />
  );
};

render(<App />, document.body);