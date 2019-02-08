import React, {Component} from 'react'
import { connect } from 'react-redux';
import _ from 'lodash';
import {
  saveEditionScriptItem,
  deleteScriptItem
} from '../../../actions/classroomLesson'
import { getEditionQuestions } from '../../../actions/customize'

import * as IntF from '../interfaces';
import * as CLIntF from '../../../interfaces/classroomLessons';
import * as CustomizeIntF from '../../../interfaces/customize';

import EditScriptItem from './editScriptItem';

class showScriptItem extends Component<any, any> {
  constructor(props){
    super(props);
    this.save = this.save.bind(this)
    this.saveAlert = this.saveAlert.bind(this)
    this.delete = this.delete.bind(this)

    this.props.dispatch(getEditionQuestions(this.props.params.editionID))
  }

  classroomLesson(): IntF.ClassroomLesson {
    return this.props.classroomLessons.data[this.props.params.classroomLessonID]
  }

  edition(): CustomizeIntF.EditionMetadata {
    return this.props.customize.editions[this.props.params.editionID]
  }

  editionQuestions(): CustomizeIntF.EditionQuestions {
    return this.props.customize.editionQuestions ? this.props.customize.editionQuestions.questions : null
  }

  currentSlide(): IntF.Question {
    return this.editionQuestions()[this.props.params.slideID]
  }

  getCurrentScriptItem(): CLIntF.ScriptItem {
    const {editionID, slideID, scriptItemID} = this.props.params;
    return this.currentSlide().data.teach.script[scriptItemID]
  }

  save(scriptItem: CLIntF.ScriptItem) {
    const {editionID, slideID, scriptItemID} = this.props.params;
    saveEditionScriptItem(editionID, slideID, scriptItemID, scriptItem, this.saveAlert)
  }

  saveAlert() {
    alert('Saved!')
  }

  delete() {
    const {classroomLessonID, editionID, slideID, scriptItemID} = this.props.params;
    const script = this.currentSlide().data.teach.script;
    deleteScriptItem(editionID, slideID, scriptItemID, script)
    window.location.href = `${window.location.origin}/#/admin/classroom-lessons/${classroomLessonID}/editions/${editionID}/slide/${slideID}`
  }

  render() {
    if (this.props.classroomLessons.hasreceiveddata && this.editionQuestions()) {
      const {editionID, classroomLessonID, slideID, scriptItemID} = this.props.params;
      const editionLink = `${window.location.origin}/#/admin/classroom-lessons/${classroomLessonID}/editions/${editionID}`
      const slideLink = `${window.location.origin}/#/admin/classroom-lessons/${classroomLessonID}/editions/${editionID}/slide/${slideID}`
      return (
        <div className="admin-classroom-lessons-container">
          <h4 className="title is-4">Edition: <a href={editionLink}>{this.edition().name}</a></h4>
          <h5 className="title is-5">Slide: <a href={slideLink}>{this.currentSlide().data.teach.title}</a></h5>
          <h5 className="title is-5">Script Item #{Number(scriptItemID) + 1}</h5>
          <EditScriptItem scriptItem={this.getCurrentScriptItem()} save={this.save} delete={this.delete}/>
        </div>
      )
    } else {
      return (
        <p>Loading...</p>
      )
    }

  }

}

function select(props) {
  return {
    classroomLessons: props.classroomLessons,
    customize: props.customize
  };
}

function mergeProps(stateProps: Object, dispatchProps: Object, ownProps: Object) {
  return {...ownProps, ...stateProps, ...dispatchProps}
}

export default connect(select, dispatch => ({dispatch}), mergeProps)(showScriptItem);
