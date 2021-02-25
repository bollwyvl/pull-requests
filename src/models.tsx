import { isUndefined, uniqueId } from 'lodash';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { PullRequestCommentThread } from './components/diff/PullRequestCommentThread';
import { PlainDiffComponent } from './components/diff/PlainDiffComponent';
import { doRequest } from './utils';

// -----------------------------------------------------------------------------
// Pull Request Model
// -----------------------------------------------------------------------------

// A class for the neccessary items in GitHub PR json response
// Extendable to other source control libraries (eg CodeCommit) in the future
export class PullRequestModel {
  constructor(
    id: string,
    title: string,
    body: string,
    link: string,
    internalId: string
  ) {
    this.id = id;
    this.title = title;
    this.body = body;
    this.link = link;
    this.internalId = internalId;
    this.isExpanded = false;
  }

  async getFiles(): Promise<void> {
    let jsonresults = await doRequest(
      'pullrequests/prs/files?id=' + this.id,
      'GET'
    );
    let results: PullRequestFileModel[] = [];
    for (let jsonresult of jsonresults) {
      results.push(
        new PullRequestFileModel(
          jsonresult['name'],
          jsonresult['status'],
          jsonresult['additions'],
          jsonresult['deletions'],
          this
        )
      );
    }
    this.files = results;
  }

  id: string;
  title: string;
  body: string;
  link: string;
  internalId: string;
  files: PullRequestFileModel[];
  isExpanded: boolean;
}

// -----------------------------------------------------------------------------
// File Model
// -----------------------------------------------------------------------------

export class PullRequestFileModel {
  constructor(
    name: string,
    status: string,
    additions: number,
    deletions: number,
    pr: PullRequestModel
  ) {
    this.name = name;
    this.status = status;
    this.additions = additions;
    this.deletions = deletions;
    this.pr = pr;
    this.id = this.pr.internalId + '-' + this.name;
    this.extension = this.getExtension(this.name);
  }

  async loadFile(): Promise<void> {
    let jsonresults = await doRequest(
      `pullrequests/files/content?id=${this.pr.id}&filename=${this.name}`,
      'GET'
    );
    this.commitId = jsonresults['commit_id'];
    this.basecontent = jsonresults['base_content'];
    this.headcontent = jsonresults['head_content'];
  }

  async loadComments(): Promise<void> {
    let jsonresults = await doRequest(
      `pullrequests/files/comments?id=${this.pr.id}&filename=${this.name}`,
      'GET'
    );
    let results: PullRequestCommentThreadModel[] = [];
    for (let jsonresult of jsonresults) {
      const item = new PullRequestCommentThreadModel(this, {
        id: jsonresult['id'],
        text: jsonresult['text'],
        updatedAt: jsonresult['updated_at'],
        lineNumber: jsonresult['line_number'],
        username: jsonresult['user_name'],
        userpic: jsonresult['user_pic']
      });
      if (!isUndefined(jsonresult['in_reply_to_id'])) {
        for (let result of results) {
          if (result.id === jsonresult['in_reply_to_id']) {
            if (item.comment != null) {
              result.replies.push(item.comment);
            }
          }
        }
      } else {
        results.push(item);
      }
    }
    this.comments = results;
  }

  private getExtension(filename: string): string {
    return `.${
      filename.substring(filename.lastIndexOf('.') + 1, filename.length) ||
      filename
    }`;
  }

  id: string;
  name: string;
  status: string;
  additions: number;
  deletions: number;
  commitId: string;
  extension: string;
  basecontent: string;
  headcontent: string;
  pr: PullRequestModel;
  comments: PullRequestCommentThreadModel[];
}

// -----------------------------------------------------------------------------
// Comment Model
// -----------------------------------------------------------------------------

export interface IPullRequestCommentModel {
  id: number;
  lineNumber: number;
  text: string;
  updatedAt: string;
  username: string;
  userpic?: string;
}

export class PullRequestCommentThreadModel {
  // .id, this.props.data.pr.id, this.props.data.name
  constructor(
    file: PullRequestFileModel,
    given: number | IPullRequestCommentModel
  ) {
    this.file = file;
    this.replies = [];
    this.commitId = file.commitId;
    this.id = uniqueId(file.id + '-');
    if (typeof given === 'number') {
      this.lineNumber = given;
      this.comment = null;
    } else {
      this.lineNumber = given.lineNumber;
      this.comment = given;
    }
  }

  getCommentReplyBody(text: string): Record<string, unknown> {
    const request = {
      text: text,
      in_reply_to: this.comment?.id
    };
    return request;
  }

  getCommentNewBody(text: string): Record<string, unknown> {
    const request = {
      text: text,
      filename: this.file.name,
      position: this.lineNumber,
      commit_id: this.commitId
    };
    return request;
  }

  async postComment(body: Record<string, unknown>): Promise<void> {
    let jsonresult = await doRequest(
      `pullrequests/files/comments?id=${this.file.pr.id}&filename=${this.file.name}`,
      'POST',
      body
    );
    const item = new PullRequestCommentThreadModel(this.file, {
      id: jsonresult['id'],
      text: jsonresult['text'],
      updatedAt: jsonresult['updated_at'],
      lineNumber: jsonresult['line_number'],
      username: jsonresult['user_name'],
      userpic: jsonresult['user_pic']
    });
    const { comment } = item;
    if (comment == null) {
      this.comment = comment;
    } else {
      this.replies.push(comment);
    }
  }

  id: string;
  file: PullRequestFileModel;
  commitId: string;
  lineNumber: number;
  comment: IPullRequestCommentModel | null;
  replies: IPullRequestCommentModel[];
}

// A Monaco plain diff specific implementation of comments
export class PullRequestPlainDiffCommentThreadModel {
  /**
   * @remarks
   * Uses trick from https://github.com/microsoft/monaco-editor/issues/373 (used for Monaco error overlays)
   * 1) Insert a view zone to reserve a vertical gap in the text
   * 2) Inserts an overlay widget that is kept position-wise in sync with the view zone
   */

  constructor(
    thread: PullRequestCommentThreadModel,
    plainDiff: PlainDiffComponent
  ) {
    this.thread = thread;
    this.plainDiff = plainDiff;
    this.viewZoneId = null;
    this.domNode = null;
    this.initComment();
  }

  initComment(): void {
    let overlayDom = document.createElement('div');
    overlayDom.style.width = '100%';
    overlayDom.style.visibility = 'visible';

    let overlayWidget = {
      getId: () => 'overlay.zone.widget.' + this.thread.id,
      getDomNode: () => overlayDom,
      getPosition: (): any => null
    };
    this.plainDiff.state.diffEditor
      .getModifiedEditor()
      .addOverlayWidget(overlayWidget);

    ReactDOM.render(
      <PullRequestCommentThread
        thread={this.thread}
        handleRemove={() => this.plainDiff.removeComment(this)}
        plainDiff={this}
      />,
      overlayDom,
      () => {
        this.domNode = overlayDom;
        setTimeout(() => this.addToEditor(), 0);
      }
    );
  }

  toggleUpdate(): void {
    this.removeFromEditor();
    this.addToEditor();
  }

  deleteComment(): void {
    this.removeFromEditor();
    this.domNode?.remove();
  }

  private addToEditor(): void {
    let zoneNode = document.createElement('div');
    zoneNode.id = this.thread.id;
    let marginZoneNode = document.createElement('div');

    this.plainDiff.state.diffEditor
      .getModifiedEditor()
      .changeViewZones(changeAccessor => {
        this.viewZoneId = changeAccessor.addZone({
          afterLineNumber: this.thread.lineNumber,
          heightInPx: this.domNode?.clientHeight || 0,
          domNode: zoneNode,
          marginDomNode: marginZoneNode,
          onDomNodeTop: top => {
            if (this.domNode != null) {
              this.domNode.style.top = `${top}px`;
              this.domNode.style.visibility = 'visible';
            }
          }
        });
      });
  }

  removeFromEditor(): void {
    const tempViewZoneId = this.viewZoneId;
    this.plainDiff.state.diffEditor
      .getModifiedEditor()
      .changeViewZones(function (changeAccessor) {
        if (tempViewZoneId != null) {
          changeAccessor.removeZone(tempViewZoneId);
        }
      });
    this.viewZoneId = null;
  }

  viewZoneId: string | null;
  domNode: HTMLElement | null;
  plainDiff: PlainDiffComponent;
  thread: PullRequestCommentThreadModel;
}
