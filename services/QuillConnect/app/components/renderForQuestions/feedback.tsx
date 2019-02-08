import React from 'react';
import ReactDOM from 'react-dom'
import _ from 'underscore';
const icon = 'https://assets.quill.org//images/icons/question_icon.svg';
const revise = 'https://assets.quill.org//images/icons/revise_orange_icon.svg';
const multiple = 'https://assets.quill.org//images/icons/multiple_choice_icon.svg';
const success = 'https://assets.quill.org//images/icons/check-mark.svg';
import getAnswerState from './answerState';
import { Response } from 'quill-marking-logic';
import { Feedback } from 'quill-component-library/dist/componentLibrary';

class FeedbackComponent extends React.Component<any, any> {
  constructor(props){
    super(props)
  }

  getFeedbackType(data?): string {
    if (data) {
      const latestAttempt = getLatestAttempt(data.question.attempts);
      if (latestAttempt) {
        if (data.override) {
          return "override"
        } else if (latestAttempt.response.feedback !== undefined) {
          const state = getAnswerState(latestAttempt);
          console.log("state: ", state, latestAttempt);
          return state ? 'correct-matched' : 'revise-matched'
        } else {
          return "revise-unmatched"
        }
      } else {
        if(!!data.question.instructions) {
          return "instructions"
        }
        else if(data.getQuestion && data.getQuestion().instructions!=="") {
          return "getQuestion-instructions"
        }
        else if (data.getQuestion && data.getQuestion().cues && data.getQuestion().cues.length > 0 && data.getQuestion().cues[0] !== "") {
          return "default-with-cues"
        } else {
          return "default"
        }
      }
    }
    return "default"
  }

  getFeedbackCopy(data): string {
    const latestAttempt = getLatestAttempt(data.question.attempts);
    let returnVal;
    switch (this.getFeedbackType(data)) {
      case "revise-unmatched":
        returnVal = (<p>{data.sentence}</p>);
        break;
      case "revise-matched":
      case "correct-matched":
        returnVal = data.renderFeedbackStatements(latestAttempt);
        break;
      case "override":
        returnVal = (<p>{data.sentence}</p>);
        break;
      case "instructions":
        returnVal = (<p>{data.question.instructions}</p>);
        break;
      case "getQuestion-instructions":
        returnVal = (<p>{data.getQuestion().instructions}</p>);
        break;
      case "default-with-cues":
        const cues = data.getQuestion().cues
        if (cues.length === 1) {
          returnVal = (<p>Combine the sentences into one sentence. Use the joining word.</p>)
        } else {
          returnVal = (<p>Combine the sentences into one sentence. Use one of the joining words.</p>)
        }
        break;
      case "default":
        returnVal = (<p>Combine the sentences into one sentence.</p>)
        break;
      default:
        returnVal = (<p>Combine the sentences into one sentence.</p>)
    }
    return returnVal
  }

  render() {
    const key:number = this.props && this.props.question ? this.props.question.attempts.length : 0;
    if (this.props.question) {
      return (
        <Feedback
          key={key}
          feedbackType={this.getFeedbackType(this.props)}
          feedback={this.getFeedbackCopy(this.props)}
        />
      )
    } else {
      return <span />
    }
  }
}

export default FeedbackComponent;

const getLatestAttempt = function (attempts: Array<any> = []): any {
  const lastIndex = attempts.length - 1;
  return attempts[lastIndex]
}
