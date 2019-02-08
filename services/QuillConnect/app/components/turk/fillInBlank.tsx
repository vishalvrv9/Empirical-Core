declare function require(name:string);
import * as React from 'react';
import { connect } from 'react-redux';
import * as  _ from 'underscore';
const qml = require('quill-marking-logic')
const checkFillInTheBlankQuestion = qml.checkFillInTheBlankQuestion
import { getGradedResponsesWithCallback } from '../../actions/responses.js';
import {
  hashToCollection,
  WarningDialogue,
  Prompt,
  Instructions,
  Feedback
 } from 'quill-component-library/dist/componentLibrary';
import Cues from '../renderForQuestions/cues.jsx';
import { stringNormalize } from 'quill-string-normalizer'

const styles = {
  container: {
    marginTop: 35,
    marginBottom: 18,
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap',
    fontSize: 24,
  },
  input: {
    color: '#3D3D3D',
    fontSize: 24,
    marginRight: 10,
    width: 75,
    textAlign: 'center',
    boxShadow: '0 2px 2px 0 rgba(0, 0, 0, 0.24), 0 0 2px 0 rgba(0, 0, 0, 0.12)',
    borderStyle: 'solid',
    borderWidth: 1,
    borderImageSource: 'linear-gradient(to bottom, rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0.1) 5%, rgba(255, 255, 255, 0) 20%, rgba(255, 255, 255, 0))',
    borderImageSlice: 1,
  },
  text: {
    marginRight: 10,
  },
};

export class PlayFillInTheBlankQuestion extends React.Component<any, any> {
  constructor(props) {
    super(props);

    this.checkAnswer = this.checkAnswer.bind(this);
    this.getQuestion = this.getQuestion.bind(this)
    this.getGradedResponsesWithCallback = this.getGradedResponsesWithCallback.bind(this)
    this.setQuestionValues = this.setQuestionValues.bind(this)

    this.state = {}
  }

  componentWillMount() {
    this.setQuestionValues(this.props.question)
  }

  setQuestionValues(question) {
    const q = question;
    const splitPrompt = q.prompt.replace(/<p>/g, '').replace(/<\/p>/g, '').split('___');
    const numberOfInputVals = q.prompt.match(/___/g).length
    this.setState({
      splitPrompt,
      inputVals: this.generateInputs(numberOfInputVals),
      inputErrors: new Set(),
      cues: q.cues,
      blankAllowed: q.blankAllowed,
    }, () => this.getGradedResponsesWithCallback(question));
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.question.prompt !== this.props.question.prompt) {
      this.setQuestionValues(nextProps.question)
    }
  }

  getGradedResponsesWithCallback(question) {
    getGradedResponsesWithCallback(
      question.key,
      (data) => {
        this.setState({ responses: data, });
      }
    );
  }

  getQuestion() {
    return this.props.question
  }

  getInstructionText() {
    const q = this.getQuestion()
    let text = q.instructions
    return (<p dangerouslySetInnerHTML={{ __html: text, }} />);
  }

  generateInputs(numberOfInputVals: number) {
    const inputs:Array<string> = [];
    for (let i = 0; i < numberOfInputVals; i++) {
      inputs.push('');
    }
    return inputs;
  }

  handleChange(i, e) {
    const existing = [...this.state.inputVals];
    existing[i] = e.target.value;
    this.setState({
      inputVals: existing,
    });
  }

  getChangeHandler(index) {
    return (e) => {
      this.handleChange(index, e);
    };
  }

  renderText(text, i) {
    let style = {};
    if (text.length > 0) {
      style = styles.text;
    }
    return <span key={i} style={style}>{text}</span>;
  }

  validateInput(i) {
    const newErrors = new Set(this.state.inputErrors);
    const inputVal = this.state.inputVals[i] || '';
    const inputSufficient = this.state.blankAllowed ? true : inputVal;
    const cueMatch = (inputVal && this.state.cues.some(c => stringNormalize(c).toLowerCase() === stringNormalize(inputVal).toLowerCase())) || inputVal === ''
    if (inputSufficient && cueMatch) {
      newErrors.delete(i);
    } else {
      newErrors.add(i);
    }
    // following condition will return false if no new errors
    if (newErrors.size) {
      const newInputVals = this.state.inputVals
      this.setState({ inputErrors: newErrors, inputVals: newInputVals })
    } else {
      this.setState({ inputErrors: newErrors });
    }
  }

  renderWarning(i) {
    const warningStyle:any = {
      border: '1px #ff3730 solid',
      color: '#ff3730',
      fontSize: '14px',
      top: '-34px',
      position: 'absolute',
      textAlign: 'center',
      backgroundColor: 'white',
      borderRadius: '3px',
      height: '26px',
      zIndex: '100',
      padding: '2px 7px',
    };
    const body:ClientRect|null = document.getElementsByTagName('body')[0].getBoundingClientRect();
    const inputFromDom:HTMLElement|null = document.getElementById(`input${i}`)
    const rectangle:ClientRect|null =  inputFromDom ? inputFromDom.getBoundingClientRect() : null;
    let chevyStyle:any = this.chevyStyleLeft();
    if (rectangle && body && rectangle.left > (body.width / 2)) {
      warningStyle.right = '-73px';
      chevyStyle = this.chevyStyleRight();
    }
    return (
      <WarningDialogue
        key={`warning${i}`}
        style={warningStyle}
        chevyStyle={chevyStyle}
        text={this.warningText()}
      />
    );
  }

  warningText() {
    const text = 'Use one of the options below';
    return `${text}${this.state.blankAllowed ? ' or leave blank.' : '.'}`;
  }

  chevyStyleRight() {
    return {
      float: 'right',
      marginRight: '20px',
      position: 'relative',
      top: '-3px',
    };
  }

  chevyStyleLeft():object {
    return {
      float: 'left',
      marginLeft: '20px',
      position: 'relative',
      top: '-3px',
    };
  }

  renderInput(i) {
    let styling:any = styles.input;
    let warning;
    if (this.state.inputErrors.has(i)) {
      warning = this.renderWarning(i);
      styling = Object.assign({}, styling);
      styling.borderColor = '#ff7370';
      styling.borderWidth = '2px';
      delete styling.borderImageSource;
    }
    const longestCue = this.state.cues && this.state.cues.length ? this.state.cues.sort((a, b) => b.length - a.length)[0] : null
    const width = longestCue ? (longestCue.length * 15) + 10 : 50
    styling.width = `${width}px`
    return (
      <span key={`span${i}`}>
        <div style={{ position: 'relative', height: 0, width: 0, }}>
          {warning}
        </div>
        <input
          id={`input${i}`}
          key={i + 100}
          style={styling}
          type="text"
          onChange={this.getChangeHandler(i)}
          value={this.state.inputVals[i]}
          onBlur={() => this.validateInput(i)}
        />
      </span>
    );
  }

  getPromptElements() {
    if (this.state.splitPrompt) {
      const { splitPrompt, } = this.state;
      const l = splitPrompt.length;
      const splitPromptWithInput:Array<JSX.Element> = [];
      splitPrompt.forEach((section, i) => {
        if (i !== l - 1) {
          splitPromptWithInput.push(this.renderText(section, i));
          splitPromptWithInput.push(this.renderInput(i));
        } else {
          splitPromptWithInput.push(this.renderText(section, i));
        }
      });
      return splitPromptWithInput;
    }
  }

  zipInputsAndText() {
    const zipped = _.zip(this.state.splitPrompt, this.state.inputVals);
    return _.flatten(zipped).join('').trim();
  }

  checkAnswer() {
    if (!this.state.inputErrors.size) {
      if (!this.state.blankAllowed) {
        if (this.state.inputVals.filter(Boolean).length !== this.state.inputVals.length) {
          this.state.inputVals.forEach((val, i) => this.validateInput(i))
          return
        }
      }
      const zippedAnswer = this.zipInputsAndText();
      const questionUID = this.props.question.key
      const responses = hashToCollection(this.state.responses)
      const response = {response: checkFillInTheBlankQuestion(questionUID, zippedAnswer, responses)}
      this.setResponse(response);
      this.props.submitResponse(response);
      this.setState({
        response: '',
      });
      this.props.nextQuestion();
    }
  }

  setResponse(response) {
    if (this.props.setResponse) {
      this.props.setResponse(response)
    }
  }

  renderMedia() {
    if (this.props.question.mediaURL) {
      return (
        <div className='ell-illustration' style={{ marginTop: 15, minWidth: 200 }}>
          <img src={this.props.question.mediaURL} />
        </div>
      );
    }
  }

  customText() {
    const cuesLabel = this.getQuestion().cuesLabel
    if (cuesLabel) {
      return cuesLabel
    }
  }

  getSubmitButtonText() {
    return 'Submit';
  }

  render() {
    let fullPageInstructions
    if (this.props.language === 'arabic' && !(this.props.question.mediaURL)) {
      fullPageInstructions = { maxWidth: 800, width: '100%' }
    } else {
      fullPageInstructions = { display: 'block' }
    }
    const button = this.state.responses ? <button className="button student-submit" onClick={this.checkAnswer}>{this.getSubmitButtonText()}</button> : <button className="button student-submit is-disabled" onClick={() => {}}>Submit</button>;
    return (
      <div className="student-container-inner-diagnostic">
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <div style={fullPageInstructions}>
            <div>
              <Prompt style={styles.container} elements={this.getPromptElements()} />
              <Cues
                getQuestion={this.getQuestion}
                customText={this.customText()}
                displayArrowAndText={true}
              />
              <Feedback feedbackType="instructions" feedback={this.getInstructionText()} />
            </div>
          </div>
          {this.renderMedia()}
        </div>
        <div style={{marginTop: 20}} className="question-button-group button-group">
          {button}
        </div>
      </div>
    );
  }

}

function select(props) {
  return {
  };
}

export default connect(select)(PlayFillInTheBlankQuestion);
