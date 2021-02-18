import { IThemeManager } from '@jupyterlab/apputils';
import { Widget } from '@lumino/widgets';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { PullRequestFileModel, PullRequestModel } from '../../models';
import { PullRequestFileTab } from './PullRequestFileTab';
// import { PullRequestDescriptionTab } from './PullRequestDescriptionTab';
import { isUndefined } from 'lodash';
import { IRenderMimeRegistry } from '@jupyterlab/rendermime';

// Assumes valid json
// FIXME remove
export class PullRequestTabWidget extends Widget {
  private _file: PullRequestFileModel;
  private _pr: PullRequestModel;
  private _themeManager: IThemeManager;
  private _renderMime: IRenderMimeRegistry;

  constructor(
    model: PullRequestFileModel | PullRequestModel,
    themeManager: IThemeManager,
    renderMime: IRenderMimeRegistry
  ) {
    super();
    this.title.closable = true;
    this._themeManager = themeManager;
    this._renderMime = renderMime;
    if (model instanceof PullRequestFileModel) {
      this.id = model.id; // IDs in format 123456-README.md
      this.title.label = model.name;
      this._file = model;
      ReactDOM.render(
        <PullRequestFileTab
          file={this._file}
          themeManager={this._themeManager}
          renderMime={this._renderMime}
        />,
        this.node
      );
    }
  }

  onUpdateRequest(): void {
    ReactDOM.unmountComponentAtNode(this.node);
    if (!isUndefined(this._file)) {
      ReactDOM.render(
        <PullRequestFileTab
          file={this._file}
          themeManager={this._themeManager}
          renderMime={this._renderMime}
        />,
        this.node
      );
    } else if (!isUndefined(this._pr)) {
      // ReactDOM.render(<PullRequestDescriptionTab pr={this._pr}  />, this.node);
    }
  }
}
