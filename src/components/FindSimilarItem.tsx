export interface FindSimilarData {
  id: string;
  data: { text: string; score: number }[];
}

export interface FindSimilarMetadata {
  link: string;
  title: string;
  published: string;
  authors: string[];
}

export const FindSimilarItem = ({ metadata, data }: { metadata: FindSimilarMetadata, data: FindSimilarData }) => {
  return <div>
    <a target="_blank" href={metadata.link}>{metadata.title}</a>
    <div style="font-style: italic; color: #006621">
      {
        metadata.authors.length == 1
          ? metadata.authors[0]
          : metadata.authors[0] + ' et al. ' + metadata.published
      }
    </div>
    <div style="white-space: break-spaces">
      {data.data.map((d) => <p>{d.text} <i style="color: gray">{`Similarity ${(d.score * 100).toFixed(1)} %`}</i></p>)}
    </div>
  </div>
}
