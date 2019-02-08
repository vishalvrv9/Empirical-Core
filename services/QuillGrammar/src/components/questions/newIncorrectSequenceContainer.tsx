import * as React from 'react';
import { connect } from 'react-redux';
import IncorrectSequencesInputAndConceptSelectorForm from '../shared/incorrectSequencesInputAndConceptSelectorForm';
import * as questionActions from '../../actions/questions';

class NewIncorrectSequencesContainer extends React.Component {
  constructor(props) {
    super(props);

    this.submitSequenceForm = this.submitSequenceForm.bind(this);
  }

  componentWillMount() {
    const qid = this.props.match.params.questionID
    if (!this.props.generatedIncorrectSequences.suggested[qid]) {
      this.props.dispatch(questionActions.getSuggestedSequences(qid))
    }
  }

  submitSequenceForm(data) {
    delete data.conceptResults.null;
    this.props.dispatch(questionActions.submitNewIncorrectSequence(this.props.match.params.questionID, data));
    window.history.back();
  }

  render() {
    const {generatedIncorrectSequences, match, questions} = this.props
    return (
      <div>
        <IncorrectSequencesInputAndConceptSelectorForm
          itemLabel='Incorrect Sequence'
          onSubmit={this.submitSequenceForm}
          suggestedSequences={generatedIncorrectSequences.suggested[match.params.questionID]}
          usedSequences={generatedIncorrectSequences.used[match.params.questionID]}
          coveredSequences={generatedIncorrectSequences.covered[match.params.questionID]}
          questions={questions}
          questionID={match.params.questionID}
        />
        {this.props.children}
      </div>
    );
  }
}

function select(props) {
  return {
    questions: props.questions,
    generatedIncorrectSequences: props.generatedIncorrectSequences
  };
}

export default connect(select)(NewIncorrectSequencesContainer);
