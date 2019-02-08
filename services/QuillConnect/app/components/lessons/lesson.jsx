import React from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router';
import _ from 'underscore';
import lessonActions from '../../actions/lessons';
import { Modal } from 'quill-component-library/dist/componentLibrary';
import C from '../../constants.js';
import EditLessonForm from './lessonForm.jsx';

String.prototype.toKebab = function () {
  return this.replace(/([A-Z])/g, char => `-${char.toLowerCase()}`);
};

const Lesson = React.createClass({

  questionsForLesson() {
    const { data, } = this.props.lessons,
      { lessonID, } = this.props.params;
    if (data[lessonID].questions) {
      return data[lessonID].questions.map((question) => {
        const questions = this.props[question.questionType].data;
        const qFromDB = Object.assign({}, questions[question.key]);
        qFromDB.questionType = question.questionType;
        qFromDB.key = question.key;
        return qFromDB;
      });
    }
  },

  renderQuestionsForLesson() {
    const questionsForLesson = this.questionsForLesson();
    if (questionsForLesson) {
      const listItems = questionsForLesson.map((question) => {
        const { questionType, title, prompt, key, } = question
        const displayName = (questionType === 'titleCards' ? title : prompt) || 'No question prompt';
        const questionTypeLink = questionType === 'fillInBlank' ? 'fill-in-the-blanks' : questionType.toKebab()
        return (<li key={question.key}><Link to={`/admin/${questionTypeLink || 'questions'}/${question.key}`}>{displayName.replace(/(<([^>]+)>)/ig, '').replace(/&nbsp;/ig, '')}</Link></li>);
      });
      return (
        <ul>{listItems}</ul>
      );
    }
    return (
      <ul>No questions</ul>
    );
  },

  deleteLesson() {
    const { lessonID, } = this.props.params;
    if (confirm('do you want to do this?')) {
      this.props.dispatch(lessonActions.deleteLesson(lessonID));
    }
  },

  cancelEditingLesson() {
    this.props.dispatch(lessonActions.cancelLessonEdit(this.props.params.lessonID));
  },

  saveLessonEdits(vals) {
    const { data, } = this.props.lessons,
      { lessonID, } = this.props.params;
    const qids = vals.questions ? vals.questions.map(q => q.key) : []
    this.props.dispatch(lessonActions.submitLessonEdit(lessonID, vals, qids));
  },

  editLesson() {
    const { lessonID, } = this.props.params;
    this.props.dispatch(lessonActions.startLessonEdit(lessonID));
    // // console.log("Edit button clicked");
  },

  renderEditLessonForm() {
    const { data, } = this.props.lessons,
      { lessonID, } = this.props.params;
    const lesson = (data[lessonID]);
    if (this.props.lessons.states[lessonID] === C.EDITING_LESSON) {
      return (
        <Modal close={this.cancelEditingLesson}>
          <EditLessonForm lesson={lesson} submit={this.saveLessonEdits} currentValues={lesson} />
        </Modal>
      );
    }
  },

  render() {
    const { data, } = this.props.lessons,
      { lessonID, } = this.props.params;
    if (data[lessonID]) {
      const numberOfQuestions = data[lessonID].questions ? data[lessonID].questions.length : 0;
      return (
        <div>
          <Link to={'admin/lessons'}>Return to All Lessons</Link>
          <br />
          {this.renderEditLessonForm()}
          <h4 className="title">{data[lessonID].name}</h4>

          <h6 className="subtitle">{data[lessonID].flag}</h6>
          <h6 className="subtitle">{numberOfQuestions} Questions</h6>
          <h6 className="subtitle"><Link to={`play/lesson/${lessonID}`}>{`quillconnect.firebaseapp.com/#/play/lesson/${lessonID}`}</Link></h6>
          <h6 className="subtitle"><Link to={`admin/lessons/${lessonID}/results`}>View Results</Link></h6>
          <p className="control">
            <button className="button is-info" onClick={this.editLesson}>Edit Lesson</button> <button className="button is-danger" onClick={this.deleteLesson}>Delete Lesson</button>
          </p>
          {this.renderQuestionsForLesson()}
        </div>
      );
    } else if (this.props.lessons.hasreceiveddata === false) {
      return (<p>Loading...</p>);
    }
    return (
      <p>404: No Concept Found</p>
    );
  },

});

function select(state) {
  return {
    lessons: state.lessons,
    questions: state.questions,
    routing: state.routing,
    sentenceFragments: state.sentenceFragments,
    fillInBlank: state.fillInBlank,
    titleCards: state.titleCards
  };
}

export default connect(select)(Lesson);
