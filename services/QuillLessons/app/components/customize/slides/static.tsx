import React, {Component} from 'react'
import * as CLIntF from '../../../interfaces/classroomLessons';
import _ from 'lodash'
import PromptField from './slideComponents/promptField'
import StudentStatic from '../../classroomLessons/play/static'
import TitleField from './slideComponents/titleField'

interface CustomizeStaticProps {
  question: CLIntF.QuestionData,
  updateQuestion: Function,
  clearSlide: Function,
  resetSlide: Function,
  questionIndex: Number,
  incompletePrompt: Boolean
}

class CustomizeStatic extends Component<CustomizeStaticProps, {}>{
  constructor(props){
    super(props);

    this.handleTitleChange = this.handleTitleChange.bind(this)
    this.updateQuestion = this.updateQuestion.bind(this)
    this.handleHTMLChange = this.handleHTMLChange.bind(this)
  }

  updateQuestion(newVals, questionIndex) {
    this.props.updateQuestion(newVals, questionIndex)
  }

  handleTitleChange(e) {
    const newVals = _.merge({}, this.props.question)
    _.set(newVals, 'teach.title', e.target.value)
    this.updateQuestion(newVals, this.props.questionIndex)
  }

  handleHTMLChange(e) {
    const newVals = _.merge({}, this.props.question)
    _.set(newVals, 'play.html', e)
    this.updateQuestion(newVals, this.props.questionIndex)
  }

  render() {
    return (
      <div className="slide">
        <div className="form">
          <TitleField
            clearSlide={this.props.clearSlide}
            questionIndex={this.props.questionIndex}
            resetSlide={this.props.resetSlide}
            title={this.props.question.teach.title}
            handleTitleChange={this.handleTitleChange}
          />
          <PromptField
            incompletePrompt={this.props.incompletePrompt}
            text={this.props.question.play.html}
            reset={this.props.question.reset}
            handleTextChange={(e) => this.handleHTMLChange(e)}
            showBlockquote={true}
          />
        </div>
        <div className="slide-preview-container">
          <p className="slide-title">{this.props.question.teach.title}</p>
          <div className="preview">
            <div className="scaler">
              <StudentStatic data={this.props.question} />
            </div>
          </div>
        </div>
      </div>
    )
  }

}

export default CustomizeStatic
