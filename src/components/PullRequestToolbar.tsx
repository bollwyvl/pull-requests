import { Toolbar, ToolbarButton } from '@jupyterlab/apputils';
import { Widget } from '@lumino/widgets';
import { PullRequestPanel } from './PullRequestPanel';

import { refreshIcon } from '@jupyterlab/ui-components';

export class PullRequestToolbar extends Toolbar {
  private _openRefreshButton: ToolbarButton;

  constructor(panel: PullRequestPanel) {
    super();
    this.addClass('jp-PullRequestToolbar');

    // Add toolbar header
    let widget: Widget = new Widget();
    let title = document.createElement('label');
    title.innerText = 'Pull Requests';
    widget.addClass('jp-PullRequestToolbarHeader');
    widget.node.appendChild(title);
    this.addItem('Widget', widget);

    // Add toolbar refresh button
    this._openRefreshButton = new ToolbarButton({
      onClick: () => {
        panel.update();
      },
      icon: refreshIcon,
      tooltip: 'Refresh'
    });
    this._openRefreshButton.addClass('jp-PullRequestToolbarItem');
    this.addItem('Refresh', this._openRefreshButton);
  }
}
