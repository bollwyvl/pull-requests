import { JupyterFrontEnd } from '@jupyterlab/application';
import { IThemeManager, Toolbar } from '@jupyterlab/apputils';
import { IRenderMimeRegistry } from '@jupyterlab/rendermime';
import { PanelLayout, Widget } from '@lumino/widgets';
import { PullRequestFileModel, PullRequestModel } from '../models';
import { PullRequestBrowserWidget } from './browser/PullRequestBrowserWidget';
import { PullRequestToolbar } from './PullRequestToolbar';
import { PullRequestTabWidget } from './tab/PullRequestTabWidget';
import { prIcon } from '../icons';

export class PullRequestPanel extends Widget {
  private _app: JupyterFrontEnd;
  private _themeManager: IThemeManager;
  private _renderMime: IRenderMimeRegistry;
  private _toolbar: Toolbar;
  private _browser: PullRequestBrowserWidget;
  private _tabs: PullRequestTabWidget[];

  constructor(
    app: JupyterFrontEnd,
    themeManager: IThemeManager,
    renderMime: IRenderMimeRegistry
  ) {
    super();
    this.addClass('jp-PullRequestPanel');
    this.layout = new PanelLayout();

    this.title.icon = prIcon;
    this.title.caption = 'Pull Requests';
    this.id = 'pullrequests';

    this._app = app;
    this._themeManager = themeManager;
    this._renderMime = renderMime;
    this._tabs = [];
    this._browser = new PullRequestBrowserWidget(this.showTab);
    this._toolbar = new PullRequestToolbar(this);

    (this.layout as PanelLayout).addWidget(this._toolbar);
    this._toolbar.activate();
    (this.layout as PanelLayout).addWidget(this._browser);
  }

  // Show tab window for specific PR
  showTab = async (
    data: PullRequestFileModel | PullRequestModel
  ): Promise<void> => {
    let tab = this.getTab(data.id);
    if (tab == null) {
      tab = new PullRequestTabWidget(
        data,
        this._themeManager,
        this._renderMime
      );
      tab.update();
      this._tabs.push(tab);
    }
    if (!tab.isAttached) {
      this._app.shell.add(tab, 'main');
    } else {
      tab.update();
    }
    this._app.shell.activateById(tab.id);
  };

  private getTab(id: string) {
    for (let tab of this._tabs) {
      if (tab.id.toString() === id.toString()) {
        return tab;
      }
    }
    return null;
  }

  getApp(): JupyterFrontEnd {
    return this._app;
  }

  onUpdateRequest(): void {
    this._browser.update();
    for (let tab of this._tabs) {
      tab.update();
    }
  }
}
