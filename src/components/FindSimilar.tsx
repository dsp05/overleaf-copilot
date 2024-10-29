import { useEffect, useState } from "preact/hooks";
import { Fragment } from "preact/jsx-runtime"
import { fetchMetadata, search } from "../utils/search";
import { FindSimilarData, FindSimilarItem, FindSimilarMetadata } from "./FindSimilarItem";

export interface FindSimilarProps {
  selection: string;
  onClose: () => void;
  onLoadMore: () => void;
}

export const FindSimilar = ({ selection, onClose, onLoadMore }: FindSimilarProps) => {

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<FindSimilarData[]>([]);
  const [metadata, setMetadata] = useState<FindSimilarMetadata[]>([]);

  const run = async () => {
    const dataResponse = await search(selection, 0);
    const ids = dataResponse.map((d) => d.id);
    const metadataResponse = await fetchMetadata(ids);
    setData(dataResponse);
    setMetadata(metadataResponse);
    setLoading(false);
  };

  useEffect(() => {
    run();
  }, []);

  return <Fragment>
    <button id="btn-copilot-close" class="btn" onClick={onClose}>Close</button>
    <h5>Similar content on arXiv</h5>
    {loading ? <div id="copilot-similar-content-loading-spinner" style="margin-top: 50px;">
      <div class="loading" />
    </div> :
      <div id="copilot-similar-content-container">
        <div id="copilot-similar-content">
          {data.map((d, i) => <FindSimilarItem metadata={metadata[i]} data={d} />)}
        </div>
        <div style="text-align: center; margin-bottom: 10px">
          <button id="btn-copilot-load-more" class="btn" onClick={onLoadMore}>Load more</button>
        </div>
      </div>}
  </Fragment>
}
