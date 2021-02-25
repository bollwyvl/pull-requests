import { IThemeManager } from '@jupyterlab/apputils';
import * as d3 from 'd3-color';
import { isNull } from 'lodash';

import * as monaco from 'monaco-editor';

import * as React from 'react';
import ReactResizeDetector from 'react-resize-detector';
import {
  PullRequestCommentThreadModel,
  PullRequestFileModel,
  PullRequestPlainDiffCommentThreadModel
} from '../../models';

/**
 * Worker implementation for the Monaco editor
 * From https://github.com/jupyterlab/jupyterlab-monaco
 */

import * as monacoCSS from 'file-loader!../../../lib/JUPYTERLAB_FILE_LOADER_jupyterlab-pullrequests-css.worker.bundle.js';
import * as monacoEditor from 'file-loader!../../../lib/JUPYTERLAB_FILE_LOADER_jupyterlab-pullrequests-editor.worker.bundle.js';
import * as monacoHTML from 'file-loader!../../../lib/JUPYTERLAB_FILE_LOADER_jupyterlab-pullrequests-html.worker.bundle.js';
import * as monacoJSON from 'file-loader!../../../lib/JUPYTERLAB_FILE_LOADER_jupyterlab-pullrequests-json.worker.bundle.js';
import * as monacoTS from 'file-loader!../../../lib/JUPYTERLAB_FILE_LOADER_jupyterlab-pullrequests-ts.worker.bundle.js';

let URLS: { [key: string]: string } = {
  css: (monacoCSS as any).default,
  html: (monacoHTML as any).default,
  javascript: (monacoTS as any).default,
  json: (monacoJSON as any).default,
  typescript: (monacoTS as any).default
};

(self as any).MonacoEnvironment = {
  getWorkerUrl: function (moduleId: string, label: string): string {
    let url = URLS[label] || (monacoEditor as any).default;
    return url;
  }
};

export interface IPlainDiffComponentState {
  diffEditor: monaco.editor.IStandaloneDiffEditor | null;
  comments: PullRequestPlainDiffCommentThreadModel[];
  decorations: string[];
}

export interface IPlainDiffComponentProps {
  file: PullRequestFileModel;
  themeManager: IThemeManager;
}

export class PlainDiffComponent extends React.Component<
  IPlainDiffComponentProps,
  IPlainDiffComponentState
> {
  constructor(props: IPlainDiffComponentProps) {
    super(props);
    this.state = { diffEditor: null, comments: [], decorations: [] };
  }

  componentDidMount(): void {
    this.addMonacoEditor();
  }

  onResize = (): void => {
    if (this.state.diffEditor != null) {
      this.state.diffEditor.layout();
    }
  };

  render(): JSX.Element {
    return (
      <div style={{ height: '100%', width: '100%' }}>
        <div
          id={`monacocontainer-${this.props.file.id}`}
          style={{ height: '100%', width: '100%' }}
        />
        <ReactResizeDetector
          handleWidth={true}
          handleHeight={true}
          onResize={this.onResize}
        />
      </div>
    );
  }

  private getLanguage(ext: string): string {
    const langs = monaco.languages.getLanguages();
    for (let lang of langs) {
      if ((lang.extensions || []).indexOf(ext) !== -1) {
        if (lang.mimetypes != null && lang['mimetypes'].length > 0) {
          return lang['mimetypes'][0];
        } else {
          return lang['id'];
        }
      }
    }
    return 'text/plain';
  }

  private getVariableHex(varname: string): string {
    const color = d3.color(
      getComputedStyle(document.body).getPropertyValue(varname).trim()
    );
    return color != null ? color.formatHex() : '#616161';
  }

  private updateTheme() {
    const { theme } = this.props.themeManager;
    let isLight = theme == null ? true : this.props.themeManager.isLight(theme);
    monaco.editor.defineTheme('PlainDiffComponent', {
      base: isLight ? 'vs' : 'vs-dark',
      inherit: true,
      colors: {
        'editor.background': this.getVariableHex('--jp-layout-color1'),
        'editor.lineHighlightBorder': this.getVariableHex('--jp-layout-color1'),
        'editorLineNumber.foreground': this.getVariableHex(
          '--jp-ui-font-color2'
        ),
        'editorGutter.background': this.getVariableHex('--jp-layout-color1'),
        'diffEditor.insertedTextBackground': '#C9F3C24D', // #80
        'diffEditor.removedTextBackground': '#FF96964D'
      },
      rules: []
    });
  }

  private addMonacoEditor() {
    const options: monaco.editor.IDiffEditorConstructionOptions = {
      readOnly: true,
      selectionHighlight: false,
      scrollBeyondLastLine: false,
      renderLineHighlight: 'gutter',
      glyphMargin: false,
      renderFinalNewline: false
      // renderSideBySide: false
    };

    const language = this.getLanguage(this.props.file.extension);
    let baseModel = monaco.editor.createModel(
      this.props.file.basecontent,
      language
    );
    let headModel = monaco.editor.createModel(
      this.props.file.headcontent,
      language
    );
    this.updateTheme();
    monaco.editor.setTheme('PlainDiffComponent');

    const container = document.getElementById(
      `monacocontainer-${this.props.file.id}`
    );

    if (container != null) {
      let diffEditor = monaco.editor.createDiffEditor(container, options);
      diffEditor.setModel({
        original: baseModel,
        modified: headModel
      });

      this.props.themeManager.themeChanged.connect(() => this.updateTheme());
      this.setState({ diffEditor }, () => {
        this.initComments();
        this.handleMouseEvents();
      });
    }
  }

  private initComments() {
    let pdcomments: PullRequestPlainDiffCommentThreadModel[] = [];
    for (let thread of this.props.file.comments) {
      if (thread.comment == null) {
        continue;
      }
      const pdcomment = new PullRequestPlainDiffCommentThreadModel(
        new PullRequestCommentThreadModel(this.props.file, thread.comment),
        this
      );
      pdcomments.push(pdcomment);
    }
    this.setState({ comments: pdcomments });
  }

  private addComment(commentToAdd: PullRequestPlainDiffCommentThreadModel) {
    this.setState(prevState => ({
      comments: [...prevState.comments, commentToAdd]
    }));
  }

  removeComment(commentToRemove: PullRequestPlainDiffCommentThreadModel): void {
    this.setState(
      prevState => ({
        comments: [
          ...prevState.comments.filter(comment => comment !== commentToRemove)
        ]
      }),
      () => {
        commentToRemove.deleteComment();
      }
    );
  }

  private handleMouseEvents() {
    if (this.state.diffEditor == null) {
      return;
    }
    // Show add comment decoration on mouse move
    this.state.diffEditor.getModifiedEditor().onMouseMove(e => {
      if (!isNull(e.target['position'])) {
        this.updateCommentDecoration(e.target['position']['lineNumber']);
      } else if (this.state.decorations.length > 0 && e.target['type'] === 12) {
        this.removeCommentDecoration();
      }
    });
    // Remove add comment decoration if mouse leaves
    this.state.diffEditor.getModifiedEditor().onMouseLeave(e => {
      this.removeCommentDecoration();
    });
    this.state.diffEditor.getModifiedEditor().onMouseDown(e => {
      if (
        e.target.element != null &&
        e.target.element.classList.contains('jp-PullRequestCommentDecoration')
      ) {
        if (e.target.element.parentElement?.innerText == null) {
          return;
        }
        let lineNumber = parseInt(e.target.element.parentElement.innerText, 10);
        for (let comment of this.state.comments) {
          if (
            isNull(comment.thread.comment) &&
            comment.thread.lineNumber === lineNumber
          ) {
            return;
          }
        }
        this.addComment(
          new PullRequestPlainDiffCommentThreadModel(
            new PullRequestCommentThreadModel(this.props.file, lineNumber),
            this
          )
        );
      }
    });
  }

  private updateCommentDecoration(lineNumber: number) {
    if (this.state.diffEditor == null) {
      return;
    }
    let newDecorations = this.state.diffEditor
      .getModifiedEditor()
      .deltaDecorations(this.state.decorations, [
        {
          range: new monaco.Range(lineNumber, 1, lineNumber, 1),
          options: {
            isWholeLine: true,
            linesDecorationsClassName: 'jp-PullRequestCommentDecoration'
          }
        }
      ]);
    this.setState({ decorations: newDecorations });
  }

  private removeCommentDecoration() {
    if (this.state.diffEditor != null && this.state.decorations.length > 0) {
      let newDecorations = this.state.diffEditor
        .getModifiedEditor()
        .deltaDecorations(this.state.decorations, []);
      this.setState({ decorations: newDecorations });
    }
  }
}
