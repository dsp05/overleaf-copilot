import { useRef, useState } from "preact/hooks";
import { Icon, icons } from "./Icon";
import "./styles/IconSelect.css";
import { useClickOutside } from "./hooks";

interface IconSelectProps {
  selected: string;
  onChange: (value: string) => void;
}

export const IconSelect = ({ selected, onChange }: IconSelectProps) => {
  const [showList, setShowList] = useState(false);

  const ref = useRef<HTMLDivElement>(null);
  useClickOutside(ref, () => { setShowList(false); });

  return <div className="icon-select" ref={ref}>
    <div className="icon">
      <Icon name={selected} size={16} />
    </div>
    <a href="#" onClick={(e) => { e.preventDefault(); setShowList(true); }}>Change</a>
    {showList && <div className="icon-list">
      {icons.map(icon => (
        <div className="icon" onClick={() => { onChange(icon); setShowList(false); }}>
          <Icon name={icon} size={16} />
        </div>
      ))}
    </div>}
  </div>
}
