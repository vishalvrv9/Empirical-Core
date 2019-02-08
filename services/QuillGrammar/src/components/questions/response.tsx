import * as React from 'react';
import * as _ from 'underscore';
import * as questionActions from '../../actions/questions';
import {
  Modal,
  hashToCollection
} from 'quill-component-library/dist/componentLibrary';
import TextEditor from '../shared/textEditor'
import { EditorState, ContentState } from 'draft-js'
import ResponseList from './responseList';
import ConceptResults from './conceptResults'
import getBoilerplateFeedback from './boilerplateFeedback';
import * as massEdit from '../../actions/massEdit';
import {
  deleteResponse,
  submitResponseEdit,
  getGradedResponsesWithCallback,
} from '../../actions/responses';

import * as jsDiff from 'diff'
import { ActionTypes } from '../../actions/actionTypes';


export default class Response extends React.Component<any, any> {
  constructor(props: any) {
    super(props)

    this.state = this.initialState()

    this.initialState = this.initialState.bind(this)
    this.deleteResponse = this.deleteResponse.bind(this)
    this.editResponse = this.editResponse.bind(this)
    this.cancelResponseEdit = this.cancelResponseEdit.bind(this)
    this.viewChildResponses = this.viewChildResponses.bind(this)
    this.cancelChildResponseView = this.cancelChildResponseView.bind(this)
    this.viewFromResponses = this.viewFromResponses.bind(this)
    this.cancelFromResponseView = this.cancelFromResponseView.bind(this)
    this.viewToResponses = this.viewToResponses.bind(this)
    this.cancelToResponseView = this.cancelToResponseView.bind(this)
    this.updateResponse = this.updateResponse.bind(this)
    this.getErrorsForAttempt = this.getErrorsForAttempt.bind(this)
    this.markAsWeak = this.markAsWeak.bind(this)
    this.unmarkAsWeak = this.unmarkAsWeak.bind(this)
    this.rematchResponse = this.rematchResponse.bind(this)
    this.incrementResponse = this.incrementResponse.bind(this)
    this.removeLinkToParentID = this.removeLinkToParentID.bind(this)
    this.applyDiff = this.applyDiff.bind(this)
    this.handleFeedbackChange = this.handleFeedbackChange.bind(this)
    this.deleteConceptResult = this.deleteConceptResult.bind(this)
    this.chooseBoilerplateCategory = this.chooseBoilerplateCategory.bind(this)
    this.chooseSpecificBoilerplateFeedback = this.chooseSpecificBoilerplateFeedback.bind(this)
    this.boilerplateCategoriesToOptions = this.boilerplateCategoriesToOptions.bind(this)
    this.boilerplateSpecificFeedbackToOptions = this.boilerplateSpecificFeedbackToOptions.bind(this)
    this.addResponseToMassEditArray = this.addResponseToMassEditArray.bind(this)
    this.removeResponseFromMassEditArray = this.removeResponseFromMassEditArray.bind(this)
    this.clearResponsesFromMassEditArray = this.clearResponsesFromMassEditArray.bind(this)
    this.onMassSelectCheckboxToggle = this.onMassSelectCheckboxToggle.bind(this)
    this.toggleCheckboxCorrect = this.toggleCheckboxCorrect.bind(this)
    this.handleConceptChange = this.handleConceptChange.bind(this)
    this.getParentResponse = this.getParentResponse.bind(this)
    this.renderBoilerplateCategoryDropdown = this.renderBoilerplateCategoryDropdown.bind(this)
    this.renderBoilerplateCategoryOptionsDropdown = this.renderBoilerplateCategoryOptionsDropdown.bind(this)
    this.renderConceptResults = this.renderConceptResults.bind(this)
    this.renderResponseContent = this.renderResponseContent.bind(this)
    this.renderResponseFooter = this.renderResponseFooter.bind(this)
    this.renderResponseHeader = this.renderResponseHeader.bind(this)
    this.cardClasses = this.cardClasses.bind(this)
    this.headerClasses = this.headerClasses.bind(this)
    this.renderChildResponses = this.renderChildResponses.bind(this)
    this.printResponsePathways = this.printResponsePathways.bind(this)
    this.toResponsePathways = this.toResponsePathways.bind(this)
    this.renderToResponsePathways = this.renderToResponsePathways.bind(this)
    this.renderFromResponsePathways = this.renderFromResponsePathways.bind(this)

  }

  initialState() {
    const response = this.props.response
    const actions = questionActions
    let conceptResults = {}
    if (response.concept_results) {
      if (typeof response.concept_results === 'string') {
        conceptResults = JSON.parse(response.concept_results)
      } else {
        conceptResults = response.concept_results
      }
    }
    return {
      feedback: response.feedback || '',
      selectedBoilerplate: '',
      selectedBoilerplateCategory: response.selectedBoilerplateCategory || '',
      selectedConcept: response.concept || '',
      actions,
      parent: null,
      newConceptResult: {
        conceptUID: '',
        correct: true,
      },
      conceptResults,
    };
  }

  deleteResponse(rid: string) {
    if (window.confirm('Are you sure?')) {
      this.props.dispatch(deleteResponse(this.props.questionID, rid));
      this.props.dispatch(massEdit.removeResponseFromMassEditArray(rid));
    }
  }

  editResponse(rid: string) {
    this.props.dispatch(this.state.actions.startResponseEdit(this.props.questionID, rid));
  }

  cancelResponseEdit(rid: string) {
    this.setState(this.initialState())
    this.props.dispatch(this.state.actions.cancelResponseEdit(this.props.questionID, rid));
  }

  viewChildResponses(rid: string) {
    this.props.dispatch(this.state.actions.startChildResponseView(this.props.questionID, rid));
  }

  cancelChildResponseView(rid: string) {
    this.props.dispatch(this.state.actions.cancelChildResponseView(this.props.questionID, rid));
  }

  viewFromResponses(rid: string) {
    this.props.dispatch(this.state.actions.startFromResponseView(this.props.questionID, rid));
  }

  cancelFromResponseView(rid: string) {
    this.props.dispatch(this.state.actions.cancelFromResponseView(this.props.questionID, rid));
  }

  viewToResponses(rid: string) {
    this.props.dispatch(this.state.actions.startToResponseView(this.props.questionID, rid));
  }

  cancelToResponseView(rid: string) {
    this.props.dispatch(this.state.actions.cancelToResponseView(this.props.questionID, rid));
  }

  updateResponse(rid: string) {
    const newResp = {
      weak: false,
      feedback: this.state.feedback !== '<br/>' ? this.state.feedback : '',
      optimal: this.refs.newResponseOptimal.checked,
      author: null,
      parent_id: null,
      concept_results: Object.keys(this.state.conceptResults) && Object.keys(this.state.conceptResults).length ? this.state.conceptResults : null
    };
    this.props.dispatch(submitResponseEdit(rid, newResp, this.props.questionID));
  }

  getErrorsForAttempt(attempt) {
    return _.pick(attempt, ...ActionTypes.ERROR_TYPES);
  }

  markAsWeak(rid: string) {
    const vals = { weak: true, };
    this.props.dispatch(
      submitResponseEdit(rid, vals, this.props.questionID)
    );
  }

  unmarkAsWeak(rid: string) {
    const vals = { weak: false, };
    this.props.dispatch(
      submitResponseEdit(rid, vals, this.props.questionID)
    );
  }

  rematchResponse(rid: string) {
    this.props.getMatchingResponse(rid);
  }

  incrementResponse(rid: string) {
    const qid = this.props.questionID;
    this.props.dispatch(incrementResponseCount(qid, rid));
  }

  removeLinkToParentID(rid: string) {
    this.props.dispatch(submitResponseEdit(rid, { optimal: false, author: null, parent_id: null }, this.props.questionID));
  }

  applyDiff(answer = '', response = '') {
    const diff = jsDiff.diffWords(response, answer);
    const spans = diff.map((part) => {
      const fontWeight = part.added ? 'bold' : 'normal';
      const fontStyle = part.removed ? 'oblique' : 'normal';
      const divStyle = {
        fontWeight,
        fontStyle,
      };
      return <span style={divStyle}>{part.value}</span>;
    });
    return spans;
  }

  handleFeedbackChange(e) {
    if (e === 'Select specific boilerplate feedback') {
      this.setState({ feedback: '', });
    } else {
      this.setState({ feedback: e, });
    }
  }

  deleteConceptResult(crid) {
    if (confirm('Are you sure?')) {
      const conceptResults = Object.assign({}, this.state.conceptResults || {});
      delete conceptResults[crid];
      this.setState({conceptResults})
    }
  }

  chooseBoilerplateCategory(e) {
    this.setState({ selectedBoilerplateCategory: e.target.value, });
  }

  chooseSpecificBoilerplateFeedback(e) {
    this.setState({ selectedBoilerplate: e.target.value, });
  }

  boilerplateCategoriesToOptions() {
    return getBoilerplateFeedback().map(category => (
      <option className="boilerplate-feedback-dropdown-option">{category.description}</option>
      ));
  }

  boilerplateSpecificFeedbackToOptions(selectedCategory) {
    return selectedCategory.children.map(childFeedback => (
      <option className="boilerplate-feedback-dropdown-option">{childFeedback.description}</option>
      ));
  }

  addResponseToMassEditArray(responseKey) {
    this.props.dispatch(massEdit.addResponseToMassEditArray(responseKey));
  }

  removeResponseFromMassEditArray(responseKey) {
    this.props.dispatch(massEdit.removeResponseFromMassEditArray(responseKey));
  }

  clearResponsesFromMassEditArray() {
    this.props.dispatch(massEdit.clearResponsesFromMassEditArray());
  }

  onMassSelectCheckboxToggle(responseKey) {
    if (this.props.massEdit.selectedResponses.includes(responseKey)) {
      this.removeResponseFromMassEditArray(responseKey);
    } else {
      this.addResponseToMassEditArray(responseKey);
    }
  }

  toggleCheckboxCorrect(key) {
    const data = this.state;
    data.conceptResults[key] = !data.conceptResults[key]
    this.setState(data);
  }

  handleConceptChange(e) {
    const concepts = this.state.conceptResults;
    if (Object.keys(concepts).length === 0 || !concepts.hasOwnProperty(e.value)) {
      concepts[e.value] = this.props.response.optimal;
      this.setState({conceptResults: concepts});
    }
  }

  getParentResponse(parentId) {
    const callback = (responses) => {
      this.setState({
        parent: _.filter(responses, (resp) => resp.id === parentId)[0]
      })
    }
    return getGradedResponsesWithCallback(this.props.questionID, callback);
  }

  renderBoilerplateCategoryDropdown() {
    const style = { marginRight: '20px', };
    return (
      <span className="select" style={style}>
        <select className="boilerplate-feedback-dropdown" onChange={this.chooseBoilerplateCategory} ref="boilerplate">
          <option className="boilerplate-feedback-dropdown-option">Select boilerplate feedback category</option>
          {this.boilerplateCategoriesToOptions()}
        </select>
      </span>
    );
  }

  renderBoilerplateCategoryOptionsDropdown() {
    const selectedCategory = _.find(getBoilerplateFeedback(), { description: this.state.selectedBoilerplateCategory, });
    if (selectedCategory) {
      return (
        <span className="select">
          <select className="boilerplate-feedback-dropdown" onChange={this.chooseSpecificBoilerplateFeedback} ref="boilerplate">
            <option className="boilerplate-feedback-dropdown-option">Select specific boilerplate feedback</option>
            {this.boilerplateSpecificFeedbackToOptions(selectedCategory)}
          </select>
        </span>
      );
    }
    return (<span />);
  }

  renderConceptResults(mode) {
    return <ConceptResults
      key={Object.keys(this.state.conceptResults).length}
      conceptResults={this.state.conceptResults}
      concepts={this.props.concepts}
      mode={mode}
      handleConceptChange={this.handleConceptChange}
      toggleCheckboxCorrect={this.toggleCheckboxCorrect}
      deleteConceptResult={this.deleteConceptResult}
      response={this.props.response}
    />
  }

  renderResponseContent(isEditing, response) {
    let content;
    let parentDetails;
    let childDetails;
    let pathwayDetails;
    if (!this.props.expanded) {
      return;
    }
    if (!response.parentID && !response.parent_id) {
      childDetails = (
        <a className="button is-outlined has-top-margin" onClick={this.viewChildResponses.bind(null, response.key)} key="view" >View Children</a>
      );
    }
    if (response.parentID || response.parent_id) {
      const parent = this.state.parent;
      if (!parent) {
        this.getParentResponse(response.parentID || response.parent_id)
        parentDetails = [
          (<p>Loading...</p>),
          (<br />)
        ]
      } else {
        const diffText = this.applyDiff(parent.text, response.text);
        parentDetails = [
          (<span><strong>Parent Text:</strong> {parent.text}</span>),
          (<br />),
          (<span><strong>Parent Feedback:</strong> {parent.feedback}</span>),
          (<br />),
          (<button className="button is-danger" onClick={this.removeLinkToParentID.bind(null, response.key)}>Remove Link to Parent </button>),
          (<br />),
          (<span><strong>Differences:</strong> {diffText}</span>),
          (<br />),
          (<br />)
          ];
      }
    }

    if (this.props.showPathways) {
      pathwayDetails = (<span> <a
        className="button is-outlined has-top-margin"
        onClick={this.printResponsePathways.bind(null, this.props.key)}
        key="from"
      >
                         From Pathways
                       </a> <a
                         className="button is-outlined has-top-margin"
                         onClick={this.toResponsePathways}
                         key="to"
                       >
                            To Pathways
                          </a></span>);
    }

    if (isEditing) {
      content =
        (<div className="content">
          {parentDetails}
          <label className="label">Feedback</label>
          <TextEditor
            text={this.state.feedback || ''}
            handleTextChange={this.handleFeedbackChange}
            boilerplate={this.state.selectedBoilerplate}
            EditorState={EditorState}
            ContentState={ContentState}
          />

          <br />
          <label className="label">Boilerplate feedback</label>
          <div className="boilerplate-feedback-dropdown-container">
            {this.renderBoilerplateCategoryDropdown()}
            {this.renderBoilerplateCategoryOptionsDropdown()}
          </div>

          <div className="box">
            <label className="label">Concept Results</label>
            {this.renderConceptResults('Editing')}
          </div>

          <p className="control">
            <label className="checkbox">
              <input ref="newResponseOptimal" defaultChecked={response.optimal} type="checkbox" />
              Optimal?
            </label>
          </p>
        </div>);
    } else {
      content =
        (<div className="content">
          {parentDetails}
          <strong>Feedback:</strong> <br />
          <div dangerouslySetInnerHTML={{ __html: response.feedback, }} />
          <br />
          <label className="label">Concept Results</label>
          <ul>
            {this.renderConceptResults('Viewing')}
          </ul>
          {childDetails}
          {pathwayDetails}
        </div>);
    }

    return (
      <div className="card-content">
        {content}
      </div>
    );
  }

  renderResponseFooter(isEditing, response) {
    if (!this.props.readOnly || !this.props.expanded) {
      return;
    }
    let buttons;

    if (isEditing) {
      buttons = [
        (<a className="card-footer-item" onClick={this.cancelResponseEdit.bind(null, response.key)} key="cancel" >Cancel</a>),
        (<a className="card-footer-item" onClick={this.incrementResponse.bind(null, response.key)} key="increment" >Increment</a>),
        (<a className="card-footer-item" onClick={this.updateResponse.bind(null, response.key)} key="update" >Update</a>)
      ];
    } else {
      buttons = [
        (<a className="card-footer-item" onClick={this.editResponse.bind(null, response.key)} key="edit" >Edit</a>),
        (<a className="card-footer-item" onClick={this.deleteResponse.bind(null, response.key)} key="delete" >Delete</a>)
      ];
    }
    if (this.props.response.statusCode === 3) {
      if (this.props.response.weak) {
        buttons = buttons.concat([(<a className="card-footer-item" onClick={this.unmarkAsWeak.bind(null, response.key)} key="weak" >Unmark as weak</a>)]);
      } else {
        buttons = buttons.concat([(<a className="card-footer-item" onClick={this.markAsWeak.bind(null, response.key)} key="weak" >Mark as weak</a>)]);
      }
    }
    if (this.props.response.statusCode > 1) {
      buttons = buttons.concat([(<a className="card-footer-item" onClick={this.rematchResponse.bind(null, response.key)} key="rematch" >Rematch</a>)]);
    }
    return (
      <footer className="card-footer">
        {buttons}

      </footer>
    );
  }

  renderResponseHeader(response) {
    let bgColor;
    let icon;
    const headerCSSClassNames = ['human-optimal-response', 'human-sub-optimal-response', 'algorithm-optimal-response', 'algorithm-sub-optimal-response', 'not-found-response'];
    bgColor = headerCSSClassNames[response.statusCode];
    if (response.weak) {
      icon = '⚠️';
    }
    const authorStyle = { marginLeft: '10px', };
    const showTag = response.author && (response.statusCode === 2 || response.statusCode === 3)
    const author = showTag ? <span style={authorStyle} className="tag is-dark">{response.author}</span> : undefined;
    const checked = this.props.massEdit.selectedResponses.includes(response.id) ? 'checked' : '';
    return (
      <div style={{ display: 'flex', alignItems: 'center', }} className={bgColor}>
        <input type="checkbox" checked={checked} onChange={() => this.onMassSelectCheckboxToggle(response.id)} style={{ marginLeft: '15px', }} />
        <header onClick={() => this.props.expand(response.key)} className={`card-content ${this.headerClasses()}`} style={{ flexGrow: '1', }}>
          <div className="content">
            <div className="media">
              <div className="media-content">
                <p><span style={{ whiteSpace: 'pre-wrap' }}>{response.text}</span> {author}</p>
              </div>
              <div className="media-right" style={{ textAlign: 'right', }}>
                <figure className="image is-32x32">
                  <span>{ icon } { response.firstAttemptCount ? response.firstAttemptCount : 0 }</span>
                </figure>
              </div>
              <div className="media-right" style={{ textAlign: 'right', }}>
                <figure className="image is-32x32">
                  <span>{ icon } { response.count ? response.count : 0 }</span>
                </figure>
              </div>
            </div>
          </div>
        </header>
      </div>
    );
  }

  cardClasses() {
    if (this.props.expanded) {
      return 'has-bottom-margin has-top-margin';
    }
  }

  headerClasses() {
    if (!this.props.expanded) {
      return 'unexpanded';
    }
    return 'expanded';
  }

  renderChildResponses(isViewingChildResponses, key) {
    if (isViewingChildResponses) {
      return (
        <Modal close={this.cancelChildResponseView.bind(null, key)}>
          <ResponseList
            responses={this.props.getChildResponses(key)}
            getResponse={this.props.getResponse}
            getChildResponses={this.props.getChildResponses}
            states={this.props.states}
            questionID={this.props.questionID}
            dispatch={this.props.dispatch}
            admin={false}
            expanded={this.props.allExpanded}
            expand={this.props.expand}
            ascending={this.props.ascending}
            showPathways={false}
          />
        </Modal>
      );
    }
  }

  printResponsePathways() {
    this.viewFromResponses(this.props.response.key);
    // this.props.printPathways(this.props.response.key);
  }

  toResponsePathways() {
    this.viewToResponses(this.props.response.key);
    // this.props.printPathways(this.props.response.key);
  }

  renderToResponsePathways(isViewingToResponses, key) {
    if (isViewingToResponses) {
      return (
        <Modal close={this.cancelToResponseView.bind(null, key)}>
          <ResponseList
            responses={this.props.toPathways(this.props.response.key)}
            getResponse={this.props.getResponse}
            getChildResponses={this.props.getChildResponses}
            states={this.props.states}
            questionID={this.props.questionID}
            dispatch={this.props.dispatch}
            admin={false}
            expanded={this.props.allExpanded}
            expand={this.props.expand}
            ascending={this.props.ascending}
            showPathways={false}
          />
        </Modal>
      );
    }
  }

  renderFromResponsePathways(isViewingFromResponses, key) {
    if (isViewingFromResponses) {
      const pathways = this.props.printPathways(this.props.response.key);
      let initialCount;
      const resps = _.reject(hashToCollection(pathways), fromer => fromer.initial === true);
      if (_.find(pathways, { initial: true, })) {
        initialCount = (
          <p style={{ color: 'white', }}>First attempt: {_.find(pathways, { initial: true, }).pathCount}</p>
        );
      }
      return (
        <Modal close={this.cancelFromResponseView.bind(null, key)}>
          {initialCount}
          <br />
          <ResponseList
            responses={resps}
            getResponse={this.props.getResponse}
            getChildResponses={this.props.getChildResponses}
            states={this.props.states}
            questionID={this.props.questionID}
            dispatch={this.props.dispatch}
            admin={false}
            expanded={this.props.allExpanded}
            expand={this.props.expand}
            ascending={this.props.ascending}
            showPathways={false}
          />
        </Modal>
      );
    }
  }

  render() {
    const { response, state, } = this.props;
    const isEditing = (state === (`${ActionTypes.START_RESPONSE_EDIT}_${response.id}`));
    const isViewingChildResponses = (state === (`${ActionTypes.START_CHILD_RESPONSE_VIEW}_${response.key}`));
    const isViewingFromResponses = (state === (`${ActionTypes.START_FROM_RESPONSE_VIEW}_${response.key}`));
    const isViewingToResponses = (state === (`${ActionTypes.START_TO_RESPONSE_VIEW}_${response.key}`));
    return (
      <div className={`card is-fullwidth ${this.cardClasses()}`}>
        {this.renderResponseHeader(response)}
        {this.renderResponseContent(isEditing, response)}
        {this.renderResponseFooter(isEditing, response)}
        {this.renderChildResponses(isViewingChildResponses, response.key)}
        {this.renderFromResponsePathways(isViewingFromResponses, response.key)}
        {this.renderToResponsePathways(isViewingToResponses, response.key)}
      </div>
    );
  }
}
