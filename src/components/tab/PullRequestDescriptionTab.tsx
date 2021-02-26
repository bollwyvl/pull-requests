import { IThemeManager, Spinner } from '@jupyterlab/apputils';
import * as React from 'react';

import { RefObject } from 'react';
import { PullRequestModel } from '../../models';
import { launcherIcon } from '@jupyterlab/ui-components';
import { renderMarkdown, RenderedMarkdown } from '@jupyterlab/rendermime';

export interface IPullRequestDescriptionTabState {
  pr: PullRequestModel;
  isLoading: boolean;
  error: string | null;
}

export interface IPullRequestDescriptionTabProps {
  pr: PullRequestModel;
  themeManager: IThemeManager;
  markdown: RenderedMarkdown | null;
}

export class PullRequestDescriptionTab extends React.Component<
  IPullRequestDescriptionTabProps,
  IPullRequestDescriptionTabState
> {
  private spinnerContainer: RefObject<HTMLDivElement> = React.createRef<HTMLDivElement>();
  private prBody: RefObject<HTMLDivElement> = React.createRef<HTMLDivElement>();

  constructor(props: IPullRequestDescriptionTabProps) {
    super(props);
    this.state = { pr: props.pr, isLoading: true, error: null };
  }

  componentDidMount(): void {
    this.spinnerContainer.current?.appendChild(new Spinner().node);
    this.setState({ isLoading: false });
  }

  async componentDidUpdate(): Promise<void> {
    if (this.props.markdown != null && this.prBody.current != null) {
      const { markdown } = this.props;
      await renderMarkdown({
        host: this.prBody.current,
        source: this.props.pr.body,
        trusted: false,
        sanitizer: markdown.sanitizer,
        latexTypesetter: markdown.latexTypesetter,
        resolver: markdown.resolver,
        linkHandler: markdown.linkHandler,
        shouldTypeset: true
      });
    }
  }

  render(): JSX.Element {
    return (
      <div className="jp-PullRequestTab jp-RenderedHTMLCommon jp-RenderedMarkdown">
        {!this.state.isLoading ? (
          this.state.error == null && this.state.pr != null ? (
            <div className="jp-PullRequestDescriptionTab">
              <header>
                <h1>
                  <span>{this.state.pr.title}</span>
                </h1>
                <button
                  className="jp-Button-flat jp-mod-styled jp-mod-accept"
                  onClick={() => window.open(this.state.pr.link, '_blank')}
                >
                  <launcherIcon.react tag="span" elementSize="large" />
                  <label>View Details</label>
                </button>
              </header>
              <div ref={this.prBody}>{this.state.pr.body}</div>
            </div>
          ) : (
            <blockquote className="jp-PullRequestTabError">
              <span style={{ color: 'var(--jp-ui-font-color1)' }}>
                Error Loading File:
              </span>{' '}
              {this.state.error}
            </blockquote>
          )
        ) : (
          <div className="jp-PullRequestTabLoadingContainer">
            <div ref={this.spinnerContainer}></div>
          </div>
        )}
      </div>
    );
  }
}
