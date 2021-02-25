import * as React from 'react';
import { caretUpIcon, caretDownIcon } from '@jupyterlab/ui-components';
import ReactResizeDetector from 'react-resize-detector';
import {
  IPullRequestCommentModel,
  PullRequestCommentThreadModel,
  PullRequestPlainDiffCommentThreadModel
} from '../../models';
import moment from 'moment';

import { BUTTON_CLASS } from '../../icons';
export interface IPullRequestCommentThreadState {
  isExpanded: boolean;
  isInput: boolean;
  inputText: string;
  thread: PullRequestCommentThreadModel;
}

export interface IPullRequestCommentThreadProps {
  thread: PullRequestCommentThreadModel;
  handleRemove: () => void;
  plainDiff?: PullRequestPlainDiffCommentThreadModel;
}

export class PullRequestCommentThread extends React.Component<
  IPullRequestCommentThreadProps,
  IPullRequestCommentThreadState
> {
  constructor(props: IPullRequestCommentThreadProps) {
    super(props);
    this.state = {
      isExpanded: true,
      isInput: this.props.thread.comment == null ? true : false,
      inputText: '',
      thread: this.props.thread
    };
  }

  componentDidUpdate(
    prevProps: IPullRequestCommentThreadProps,
    prevState: IPullRequestCommentThreadState
  ): void {
    // Don't update plain diff it its only a input text change
    if (this.state.inputText !== prevState.inputText) {
      return;
    }
  }

  handleInputChange = (event: React.FormEvent<HTMLTextAreaElement>): void => {
    this.setState({ inputText: (event.target as HTMLTextAreaElement).value });
  };

  onResize = (): void => {
    if (this.props.plainDiff != null) {
      for (let comment of this.props.plainDiff.plainDiff.state.comments) {
        comment.toggleUpdate();
      }
    }
  };

  async handleSubmit(): Promise<void> {
    let _thread = this.props.thread;
    let payload;
    if (this.state.thread.comment != null) {
      payload = _thread.getCommentReplyBody(this.state.inputText);
    } else {
      payload = _thread.getCommentNewBody(this.state.inputText);
    }
    await _thread.postComment(payload);
    this.setState({ thread: _thread, isInput: false });
    this.setState({ inputText: '' });
  }

  handleCancel(): void {
    // If no other comments, canceling should remove this thread
    if (this.state.thread.comment == null) {
      this.props.handleRemove(); // for component specific remove methods
    } else {
      this.setState({ isInput: false });
    }
  }

  getCommentItemDom(item: IPullRequestCommentModel): JSX.Element {
    return (
      <div className="jp-PullRequestCommentItem">
        <div className="jp-PullRequestCommentItemImg">
          <img src={item.userpic}></img>
        </div>
        <div className="jp-PullRequestCommentItemContent">
          <div className="jp-PullRequestCommentItemContentTitle">
            <label>{item.username}</label>
            <p>{moment(item.updatedAt).fromNow()}</p>
          </div>
          <p>{item.text}</p>
        </div>
      </div>
    );
  }

  render(): JSX.Element {
    return (
      <div className="jp-PullRequestComment">
        <div className="jp-PullRequestCommentHeader">
          {!this.state.isExpanded && this.state.thread.comment != null && (
            <p>
              {this.state.thread.comment.username}:{' '}
              {this.state.thread.comment.text}
            </p>
          )}
          <button
            {...BUTTON_CLASS}
            onClick={() =>
              this.setState({ isExpanded: !this.state.isExpanded })
            }
          >
            {this.state.isExpanded ? (
              <caretUpIcon.react tag="span" />
            ) : (
              <caretDownIcon.react tag="span" />
            )}
          </button>
        </div>
        {this.state.isExpanded && (
          <div>
            {this.state.thread.comment != null && (
              <div>
                {this.getCommentItemDom(this.state.thread.comment)}
                <div>
                  {this.state.thread.replies.map((reply, i) => (
                    <div key={i}>{this.getCommentItemDom(reply)}</div>
                  ))}
                </div>
              </div>
            )}
            <div className="jp-PullRequestInputContainer">
              {this.state.isInput ? (
                <div>
                  <textarea
                    className="jp-PullRequestInputForm jp-PullRequestInputFormTextArea"
                    placeholder="Leave a comment"
                    value={this.state.inputText}
                    onChange={this.handleInputChange}
                  />
                  <div className="jp-PullRequestInputButtonContainer">
                    <button
                      onClick={() => this.handleSubmit()}
                      disabled={this.state.inputText === ''}
                      className="jp-Button-flat jp-mod-styled jp-mod-accept"
                    >
                      Comment
                    </button>
                    <button
                      onClick={() => this.handleCancel()}
                      className="jp-Button-flat jp-mod-styled jp-mod-reject"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => this.setState({ isInput: true })}
                  className="jp-PullRequestInputForm jp-PullRequestInputFormButton"
                >
                  Reply...
                </button>
              )}
            </div>
          </div>
        )}
        <ReactResizeDetector handleHeight={true} onResize={this.onResize} />
      </div>
    );
  }
}
