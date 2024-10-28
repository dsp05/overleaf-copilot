import { Fragment } from "preact/jsx-runtime";
import { Icon } from "./Icon";

export interface ToolbarProps {
  actions: { name: string, prompt: string, icon: string }[];
  searchDisabled: boolean;
  onClickAction: (action: { name: string, prompt: string, icon: string }) => void;
  onClickSearch: () => void;
}

export const Toolbar = ({ actions, searchDisabled, onClickAction, onClickSearch }: ToolbarProps) => {
  return <Fragment>
    {actions.map(action => {
      return <div className="button" title={action.name ?? "Rewrite"} onClick={() => onClickAction(action)}>
        <Icon name={action.icon} size={16} />
      </div>
    })}
    {!searchDisabled && <div className="button search" title="Search" onClick={onClickSearch}>
      <Icon name="search" size={16} />
    </div>}
  </Fragment>
}