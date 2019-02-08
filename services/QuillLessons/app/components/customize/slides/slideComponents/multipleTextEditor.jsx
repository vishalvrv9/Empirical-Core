import React, {Component} from 'react'
import { EditorState, ContentState, convertToRaw } from 'draft-js';
import Editor from 'draft-js-plugins-editor';
import DraftPasteProcessor from 'draft-js/lib/DraftPasteProcessor';
import createRichButtonsPlugin from 'draft-js-richbuttons-plugin';
const {convertFromHTML, convertToHTML} = require('draft-convert')

class MultipleTextEditor extends React.Component {
  constructor(props) {
    super(props);

    const richButtonsPlugin = createRichButtonsPlugin();
    const {
      // inline buttons
      ItalicButton, BoldButton, UnderlineButton, BlockquoteButton
    } = richButtonsPlugin;

    const InlineButton = ({className, toggleInlineStyle, isActive, label, inlineStyle, onMouseDown, title}) =>
      <a onClick={toggleInlineStyle} onMouseDown={onMouseDown}>
        <span
          className={`${className}`}
          title={title ? title : label}
          style={{ color: isActive ? '#000' : '#777' }}>{title}
        </span>
      </a>;

      const BlockButton = ({className, toggleBlockType, isActive, label, blockType, title}) =>
        <a onClick={toggleBlockType}>
          <span
            className={`${className}`}
            title={title ? title : label}
            style={{ color: isActive ? '#000' : '#777' }}>{title}
          </span>
        </a>;

    this.state = {
      text: EditorState.createWithContent(convertFromHTML(this.props.text || '')),
      components: { ItalicButton, BoldButton, UnderlineButton, BlockquoteButton, InlineButton, BlockButton },
      plugins: [richButtonsPlugin],
      hasFocus: false
    };
    this.handleTextChange = this.handleTextChange.bind(this);
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.text !== this.props.text) {
      if (nextProps.text === '' || this.props.text === '' || nextProps.reset) {
        if (nextProps.text !== convertToHTML(this.state.text.getCurrentContent())) {
          this.setState({
            text: EditorState.createWithContent(convertFromHTML(nextProps.text || '')),
          });
        }
      }
    }
  }

  handleTextChange(e) {
    this.setState({ text: e, }, () => {
      this.props.handleTextChange(convertToHTML(this.state.text.getCurrentContent()).replace(/<p><\/p>/g, '<br/>').replace(/&nbsp;/g, '<br/>'));
    });
  }

  render() {
    const { ItalicButton, BoldButton, UnderlineButton, BlockquoteButton, InlineButton, BlockButton} = this.state.components;
    const textBoxClass = this.state.hasFocus ? 'card-content hasFocus' : 'card-content';
    const errorClass = this.props.incompletePrompt ? 'incomplete-prompt' : ''
    const editorFocusClass = this.state.hasFocus ? 'editor-focused' : ''
    const blockquote = this.props.showBlockquote ? <BlockquoteButton><BlockButton className="quote" title="Quote" /></BlockquoteButton> : null
    return (
      <div className={`customize-lessons-editor card is-fullwidth ${errorClass} ${editorFocusClass}`}>
        <div className="buttons-toolbar">
          <div className="buttons-wrapper">
            <BoldButton><InlineButton className="bold" title="B" /></BoldButton>
            <ItalicButton><InlineButton className="italic" title="I" /></ItalicButton>
            <UnderlineButton><InlineButton className="underline" title="U" /></UnderlineButton>
            {blockquote}
          </div>
        </div>
        <div className={textBoxClass}>
          <div className="content">
            <Editor
              editorState={this.state.text}
              onChange={this.handleTextChange}
              plugins={this.state.plugins}
              onFocus={() => this.setState({ hasFocus: true, })}
              onBlur={() => this.setState({ hasFocus: false, })}
            />
          </div>
        </div>
      </div>
    );
  }

}

export default MultipleTextEditor;
