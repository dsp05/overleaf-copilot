import { render, Fragment } from 'preact';
import { useEffect, useState } from 'preact/hooks'
import 'purecss/build/pure-min.css';
import { LOCAL_STORAGE_KEY_OPTIONS, MODELS } from '../constants';
import { Options } from '../types';
import { getOptions } from '../utils/helper';
import { IconSelect } from './IconSelect';

const OptionsForm = () => {
  const [state, setState] = useState<Options>({});
  const [message, setMessage] = useState<string>();

  useEffect(() => {
    getOptions().then((options) => {
      onOptionsChange(options);
    });
  }, []);

  const onSubmit = async (e: Event) => {
    e.preventDefault();
    await chrome.storage.local.set({ [LOCAL_STORAGE_KEY_OPTIONS]: state });
    setMessage('Options saved')
  };

  const onAddAction = () => {
    const toolbarActions = state.toolbarActions ?? [];
    toolbarActions.push({ name: '', prompt: '', icon: '', onClick: 'show_editor' });
    onOptionsChange({ ...state, toolbarActions });
  };

  const onDeleteAction = (index: number) => {
    const toolbarActions = state.toolbarActions;
    if (!toolbarActions || index <= 0) return;
    toolbarActions.splice(index, 1);
    onOptionsChange({ ...state, toolbarActions });
  };

  const onClose = () => {
    window.close();
  }

  const onOptionsChange = (options: Options) => {
    setMessage('');
    setState(options);
  }

  const version = chrome.runtime.getManifest().version;

  return (
    <Fragment>
      <form class="pure-form pure-form-aligned" onSubmit={onSubmit}>
        <fieldset>
          <legend><h1>Options</h1></legend>
          <div class="pure-u-3-4">
            <p>
              For any issues or feature requests, visit:
              <a target="_blank" href="https://github.com/dsp05/overleaf-copilot/issues">https://github.com/dsp05/overleaf-copilot/issues</a>.
            </p>
          </div>
          <div class="pure-control-group">
            <label for="field-api-key">OpenAI API key</label>
            <input class="pure-input-1-4" type="password" id="field-api-key" placeholder="Enter your API key" value={state.apiKey}
              onChange={(e) => onOptionsChange({ ...state, apiKey: e.currentTarget.value })} />
          </div>
          <div class="pure-u-3-4">
            <p>
              To avoid quota limitations, please use your own API key. Your API key will be stored locally and will never be shared.
            </p>
            <p style="color: #8B0000">You need to use your own API key to customize the following options.</p>
          </div>
          <h2>Model</h2>
          <div class="pure-control-group">
            <label for="field-api-base-url">API base URL</label>
            <input class="pure-input-1-4" type="text" id="field-api-base-url" placeholder="https://api.openai.com/v1" value={state.apiBaseUrl}
              onChange={(e) => onOptionsChange({ ...state, apiBaseUrl: e.currentTarget.value })} />
            <span class="pure-form-message-inline pure-u-1-3">Change this setting only if you're using Azure OpenAI.</span>
          </div>
          <div class="pure-control-group">
            <label for="field-model">Model</label>
            <select style="padding-top: 0px; padding-bottom: 0px" id="field-model" class="pure-input-1-4"
              onChange={(e) => onOptionsChange({ ...state, model: e.currentTarget.value })}>
              {MODELS.map((model) => <option value={model} selected={model === state.model}>{model}</option>)}
            </select>
            <span class="pure-form-message-inline pure-u-1-3">Select the model you want to use.</span>
          </div>
          <h2>Suggestion</h2>
          <div class="pure-u-3-4">
            <p>This section customizes how suggestions work. Suggestions are triggered when you type a space at the end of a
              line or press Enter to start a new line. To accept a suggestion, press Tab to insert the entire text,
              or use Ctrl/Command + right arrow to insert it word by word.</p>
          </div>
          <div class="pure-control-group">
            <label for="field-suggestion-prompt-max-words">Prompt max words</label>
            <input class="pure-input-1-4" type="number" id="field-suggestion-prompt-max-words" placeholder="500" value={state.suggestionPromptMaxWords}
              onChange={(e) => onOptionsChange({ ...state, suggestionPromptMaxWords: parseInt(e.currentTarget.value) })} />
            <span class="pure-form-message-inline pure-u-1-3">Set the maximum word count for suggestions. Default is 500.</span>
          </div>
          <div class="pure-control-group">
            <label for="field-suggestion-max-output-token">Max output token</label>
            <input class="pure-input-1-4" type="number" id="field-suggestion-max-output-token" placeholder="100" value={state.suggestionMaxOutputToken}
              onChange={(e) => onOptionsChange({ ...state, suggestionMaxOutputToken: parseInt(e.currentTarget.value) })} />
            <span class="pure-form-message-inline pure-u-1-3">Set the maximum number of tokens generated per suggestion. Default is 100.</span>
          </div>
          <div class="pure-control-group">
            <label for="field-suggestion-prompt">Prompt</label>
            <textarea style="height: 9em" class="pure-input-1-4" id="field-suggestion-prompt" placeholder="Continue the academic paper in LaTeX below, making sure to maintain semantic continuity.&#10;&#10;### Beginning of the paper ###&#10;<input>&#10;### End of the paper ###" value={state.suggestionPrompt}
              onChange={(e) => onOptionsChange({ ...state, suggestionPrompt: e.currentTarget.value })} />
            <span class="pure-form-message-inline pure-u-1-3">The prompt used to continue writing content. It must include the placeholder "&lt;input&gt;",
              which will be replaced by the text before the cursor when generating content.</span>
          </div>
          <div class="pure-controls">
            <label for="field-suggestion-diabled" class="pure-checkbox">
              <input type="checkbox" id="field-suggestion-diabled" checked={state.suggestionDisabled}
                onChange={(e) => onOptionsChange({ ...state, suggestionDisabled: e.currentTarget.checked })} /> Disable
            </label>
            <span class="pure-form-message-inline pure-u-1-3">Disable the suggestion feature.</span>
          </div>

          <h2>Toolbar</h2>
          <div class="pure-u-3-4">
            <p>This section customizes how the toolbar works. You can add and customize multiple actions. It's triggered when you select a piece of text in the editor.</p>
          </div>
          {
            state.toolbarActions?.map((action, index) => (
              <Fragment>
                <div class="pure-control-group">
                  <label for={"field-action-name" + index}>#{index + 1} Action Name</label>
                  <input type="text" id={"field-action-name" + index} class="pure-input-1-4" placeholder="Rewrite" value={action.name}
                    onChange={(e) => {
                      const toolbarActions = state.toolbarActions;
                      if (!toolbarActions) return;
                      toolbarActions[index].name = e.currentTarget.value;
                      onOptionsChange({ ...state, toolbarActions });
                    }} />
                  {index > 0 && <button class="pure-button" style="margin-left: 5px" onClick={() => onDeleteAction(index)}>-</button>}
                </div>
                <div class="pure-control-group">
                  <label for={"field-action-icon" + index} style="line-height: 26px; vertical-align: top">Icon</label>
                  <div class="pure-input-1-4" style="display:inline-block">
                    <IconSelect selected={action.icon} onChange={(value) => {
                      const toolbarActions = state.toolbarActions;
                      if (!toolbarActions) return;
                      toolbarActions[index].icon = value;
                      onOptionsChange({ ...state, toolbarActions });
                    }} />
                  </div>
                  <span class="pure-form-message-inline pure-u-1-3">Choose an icon for this action in the toolbar.</span>
                </div>
                <div class="pure-control-group">
                  <label for={"field-on-click" + index}>On Click</label>
                  <select id={"field-on-click" + index} class="pure-input-1-4" style={{ padding: "0 5px" }} value={action.onClick ?? "show_editor"}
                    onChange={(e) => {
                      const toolbarActions = state.toolbarActions;
                      if (!toolbarActions) return;
                      toolbarActions[index].onClick = e.currentTarget.value as any;
                      onOptionsChange({ ...state, toolbarActions });
                    }} >
                    <option value="show_editor">Show editor</option>
                    <option value="replace">Replace</option>
                  </select>
                  <span class="pure-form-message-inline pure-u-1-3">Choose the action for clicking the icon: either show the editor or directly replace the content</span>
                </div>
                <div class="pure-control-group">
                  <label for={"field-suggestion-prompt" + index}>Prompt</label>
                  <textarea style="height: 9em" class="pure-input-1-4" id={"field-suggestion-prompt" + index} placeholder="Rewrite and improve the following content:&#10;<input>&#10;" value={action.prompt}
                    onChange={(e) => {
                      const toolbarActions = state.toolbarActions;
                      if (!toolbarActions) return;
                      toolbarActions[index].prompt = e.currentTarget.value;
                      onOptionsChange({ ...state, toolbarActions });
                    }} />
                  <span class="pure-form-message-inline pure-u-1-3">This prompt is used to generate content based on the selected text.
                    It must include the placeholder "&lt;input&gt;", which will be replaced by the selected text during content generation.</span>
                </div>
              </Fragment>))
          }
          <div class="pure-controls">
            <button class="pure-button" type="button" onClick={onAddAction}>+</button>
            <span class="pure-form-message-inline">Add a new custom action to the toolbar.</span>
          </div>
          <div class="pure-controls">
            <label for="field-search-disabled" class="pure-checkbox">
              <input type="checkbox" id="field-search-disabled" checked={state.toolbarSearchDisabled}
                onChange={(e) => onOptionsChange({ ...state, toolbarSearchDisabled: e.currentTarget.checked })} /> Disable Search
            </label>
            <span class="pure-form-message-inline pure-u-1-3">Hide the search icon from the toolbar.</span>
          </div>
          <div class="pure-controls">
            <label for="field-toolbar-disabled" class="pure-checkbox">
              <input type="checkbox" id="field-toolbar-disabled" checked={state.toolbarDisabled}
                onChange={(e) => onOptionsChange({ ...state, toolbarDisabled: e.currentTarget.checked })} /> Disable Toolbar
            </label>
            <span class="pure-form-message-inline pure-u-1-3">Disable the toolbar feature.</span>
          </div>
        </fieldset>

        <div class="pure-g">
          <div class="pure-u-1-2">
            <div class="pure-controls">
              <button type="submit" class="pure-button pure-button-primary">Save</button>
              <button class="pure-button" type="button" onClick={onClose} style="margin-left:10px">Close</button>
              {!!message &&
                <span class="pure-form-message-inline" style="margin-left: 10px">{message}</span>
              }
            </div>
          </div>
        </div>
      </form>
      <hr style="margin-top: 20px" />
      <p>Overleaf Copilot. Version: {version}</p>
    </Fragment>
  );
}

const App = () => {
  return (
    <div>
      <div class="pure-g">
        <div class="pure-u-1-4">
        </div>
        <div class="pure-u-1-2">
          <OptionsForm />
        </div>
      </div>
    </div>
  );
};

render(<App />, document.body);