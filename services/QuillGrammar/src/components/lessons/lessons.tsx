import * as React from 'react';
import { connect } from 'react-redux';
import * as actions from '../../actions/grammarActivities';
import _ from 'underscore';
import {
  Modal,
  FlagDropdown
} from 'quill-component-library/dist/componentLibrary';
import LinkListItem from '../shared/linkListItem'
import EditLessonForm from './lessonForm';
import { GrammarActivityState } from '../../reducers/grammarActivitiesReducer'
import { GrammarActivity } from '../../interfaces/grammarActivities'

interface LessonsProps {
  dispatch: Function;
  lessons: GrammarActivityState;
}

interface LessonsState {
  lessonFlags: string;
}

class Lessons extends React.Component<LessonsProps, LessonsState> {
  constructor(props: LessonsProps) {
    super(props)

    this.state = {
      lessonFlags: 'All Flags'
    }

    this.createNew = this.createNew.bind(this)
    this.submitNewLesson = this.submitNewLesson.bind(this)
    this.renderLessons = this.renderLessons.bind(this)
    this.renderModal = this.renderModal.bind(this)
    this.handleSelect = this.handleSelect.bind(this)
  }

  createNew() {
    this.props.dispatch(actions.toggleNewLessonModal());
  }

  submitNewLesson(data: GrammarActivity) {
    this.props.dispatch(actions.submitNewLesson(data));
    // this.props.dispatch(actions.toggleNewLessonModal())
  }

  renderLessons() {
    const { data, } = this.props.lessons;
    let keys = _.keys(data);
    if (this.state.lessonFlags !== 'All Flags') {
      keys = keys.filter((key: string) => data[key].flag === this.state.lessonFlags)
    }
    return keys.sort((a, b) => {
      const aTitle = data[a].title
      const bTitle = data[b].title
      if (aTitle && bTitle) {
        return aTitle.localeCompare(bTitle)
      } else {
        return a
      }
    }).map((key: string) => (
      <LinkListItem
        key={key}
        itemKey={key}
        basePath='lessons'
        activeClassName='is-active'
        text={data[key].title || 'No name'}
      />
    ));
  }

  renderModal() {
    const stateSpecificClass = this.props.lessons.submittingnew ? 'is-loading' : '';
    if (this.props.lessons.newLessonModalOpen) {
      return (
        <Modal close={this.createNew}>
          <EditLessonForm submit={this.submitNewLesson} stateSpecificClass={stateSpecificClass} />
        </Modal>
      );
    }
  }

  handleSelect(e) {
    this.setState({ lessonFlags: e.target.value, });
  }

  render() {
    return (
      <section className="section">
        <div className="container">
          <h1 className="title"><button className="button is-primary" onClick={this.createNew}>Create New Activity</button></h1>
          { this.renderModal() }
          <div style={{display: 'inline-block'}}>
            <FlagDropdown flag={this.state.lessonFlags} handleFlagChange={this.handleSelect} isLessons={true}/>
          </div>
          <div className="columns">
            <div className="column">
              <aside className="menu">
                <p className="menu-label">
                  Activities
                </p>
                <ul className="menu-list">
                  {this.renderLessons()}
                </ul>
              </aside>
            </div>
          </div>
        </div>
      </section>

    );
  }
}

function select(state) {
  return {
    lessons: state.grammarActivities,
    routing: state.routing,
    questions: state.questions,
  };
}

export default connect(select)(Lessons);
