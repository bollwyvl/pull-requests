import {
  ILayoutRestorer,
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';
import { IThemeManager } from '@jupyterlab/apputils';
import { IRenderMimeRegistry } from '@jupyterlab/rendermime';

import '@jupyterlab/git/style/index.css';
import '@jupyterlab/git/style/variables.css';

const NAMESPACE = 'pullrequests';
const PLUGIN_ID = '@jupyterlab/pullrequests';

// appease monaco startup
(window as any)['vscode'] = {
  process: {
    sandboxed: true
  }
};

// JupyterLab plugin props
const pullRequestPlugin: JupyterFrontEndPlugin<void> = {
  id: PLUGIN_ID,
  requires: [ILayoutRestorer, IThemeManager, IRenderMimeRegistry],
  activate: activate,
  autoStart: true
};

// Master extension activate
async function activate(
  app: JupyterFrontEnd,
  restorer: ILayoutRestorer,
  themeManager: IThemeManager,
  renderMime: IRenderMimeRegistry
): Promise<void> {
  const { PullRequestPanel } = await import('./components/PullRequestPanel');

  const prPanel = new PullRequestPanel(app, themeManager, renderMime);
  restorer.add(prPanel, NAMESPACE);
  // rank chosen from similar open source extensions
  app.shell.add(prPanel, 'left', { rank: 200 });
}

export default pullRequestPlugin;
