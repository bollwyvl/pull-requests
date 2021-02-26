import * as React from 'react';
import { BeatLoader } from 'react-spinners';
import { PullRequestFileModel, PullRequestModel } from '../../models';
import { doRequest } from '../../utils';
import { PullRequestBrowserFileItem } from './PullRequestBrowserFileItem';
import {
  launcherIcon,
  caretDownIcon,
  caretRightIcon
} from '@jupyterlab/ui-components';
import { DANGER_BUTTON, MINIMAL_BUTTON } from '../../icons';

export interface IPullRequestBrowserItemState {
  data: PullRequestModel[];
  isLoading: boolean;
  error: string | null;
}

export interface IPullRequestBrowserItemProps {
  header: string;
  filter: string;
  showTab: (data: PullRequestFileModel | PullRequestModel) => Promise<void>;
}

export class PullRequestBrowserItem extends React.Component<
  IPullRequestBrowserItemProps,
  IPullRequestBrowserItemState
> {
  constructor(props: IPullRequestBrowserItemProps) {
    super(props);
    this.state = { data: [], isLoading: true, error: null };
  }

  async componentDidMount(): Promise<void> {
    await this.fetchPRs();
  }

  private async fetchPRs() {
    try {
      let jsonresults = await doRequest(
        'pullrequests/prs/user?filter=' + this.props.filter,
        'GET'
      );
      let results: PullRequestModel[] = [];
      for (let jsonresult of jsonresults) {
        results.push(
          new PullRequestModel(
            jsonresult['id'],
            jsonresult['title'],
            jsonresult['body'],
            jsonresult['url'],
            jsonresult['internal_id']
          )
        );
      }
      // render PRs while files load
      this.setState({ data: results, isLoading: true, error: null }, () => {
        void this.fetchFiles(results);
      });
    } catch (err) {
      let msg = 'Unknown Error';
      if (
        err.response != null &&
        err.response.status != null &&
        err.message != null
      ) {
        msg = `${err.response.status} (${err.message})`;
      }
      this.setState({ data: [], isLoading: false, error: msg });
    }
  }

  private async fetchFiles(items: PullRequestModel[]) {
    Promise.all(
      items.map(async item => {
        await item.getFiles();
      })
    )
      .then(() => {
        this.setState({ data: items, isLoading: false, error: null });
      })
      .catch(e => {
        const msg = `Get Files Error (${e})`;
        this.setState({ data: [], isLoading: false, error: msg });
      });
  }

  // This makes a shallow copy of data[i], the data[i].files are not copied
  // If files need to be mutated, will need to restructure props / deep copy
  private toggleFilesExpanded(
    e: React.MouseEvent<HTMLSpanElement, MouseEvent>,
    i: number
  ) {
    e.stopPropagation();
    let data = [...this.state.data];
    let item = Object.assign({}, data[i]);
    item.isExpanded = !item.isExpanded;
    data[i] = item;
    this.setState({ data });
  }

  private openLink(
    e: React.MouseEvent<HTMLSpanElement, MouseEvent>,
    link: string
  ) {
    e.stopPropagation();
    window.open(link, '_blank');
  }

  private showFileTab(
    e: React.MouseEvent<HTMLSpanElement, MouseEvent>,
    file: PullRequestFileModel
  ) {
    e.stopPropagation();
    void this.props.showTab(file);
  }

  render(): JSX.Element {
    return (
      <li className="jp-PullRequestBrowserItem">
        <header>
          <label>{this.props.header}</label>
          <BeatLoader
            size={5}
            color={'var(--jp-ui-font-color1)'}
            loading={this.state.isLoading}
          />
        </header>
        {this.state.error != null ? (
          <blockquote className="jp-PullRequestBrowserItemError">
            <span style={{ color: 'var(--jp-ui-font-color1)' }}>
              Error Listing Pull Requests:
            </span>{' '}
            {this.state.error}
          </blockquote>
        ) : (
          <ul className="jp-PullRequestBrowserItemList">
            {this.state.data.map((result, i) => (
              <li
                className={`jp-PullRequestBrowserItemListItem${
                  result.isExpanded ? ' jp-mod-expanded' : ''
                }`}
                key={result.internalId}
              >
                <button
                  tabIndex={0}
                  {...MINIMAL_BUTTON}
                  onClick={e => this.toggleFilesExpanded(e, i)}
                >
                  {result.isExpanded ? (
                    <caretDownIcon.react tag="span" />
                  ) : (
                    <caretRightIcon.react tag="span" />
                  )}
                </button>
                <a tabIndex={0} onClick={() => this.props.showTab(result)}>
                  {result.title}
                </a>
                <button
                  tabIndex={0}
                  onClick={e => this.openLink(e, result.link)}
                  {...DANGER_BUTTON}
                >
                  <launcherIcon.react elementSize="small" tag="span" />
                </button>
                {result.isExpanded && (
                  <ul className="jp-PullRequestBrowserItemFileList">
                    {result.files != null &&
                      result.files.map((file, k) => (
                        <PullRequestBrowserFileItem
                          file={file}
                          key={k}
                          onClick={e => this.showFileTab(e, file)}
                        />
                      ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        )}
      </li>
    );
  }
}
