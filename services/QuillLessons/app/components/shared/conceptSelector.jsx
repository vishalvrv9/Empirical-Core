import React from 'react'
import { connect } from 'react-redux'
// import Select from 'react-select-search'
import _ from 'underscore'
import Select from 'react-select';

// TODO: delete everywhere else that we use conceptsToOptions

class ConceptSelector extends React.Component {

  conceptsToOptions () {
    let concepts = this.props.concepts.data["0"];
    if(this.props.onlyShowConceptsWithConceptFeedback) {
      concepts = _.filter(concepts, (concept) => {
        return _.keys(this.props.conceptsFeedback.data).includes(concept.uid);
      });
    }
    return _.map(concepts, (concept)=>{
      return (
        {label: concept.displayName, value: concept.uid, shortenedName: concept.name}
      )
    })
  }

  currentConcept () {
    return _.find(this.props.concepts.data["0"], {uid: this.props.currentConceptUID})
  }

  placeholder () {
    if (this.props.currentConceptUID && this.props.currentConceptUID.length > 0 && this.currentConcept()) {
      return this.currentConcept().displayName
    } else {
      return 'Please select a concept.'
    }
  }

  render() {
    return (
      <Select
        disabled={this.props.selectorDisabled}
        options={this.conceptsToOptions()}
        placeholder={this.placeholder()}
        onChange={this.props.handleSelectorChange}
        style={{display: 'block'}}
      />
    )
  }
}

function select (state) {
  return {
    concepts: state.concepts,
    conceptsFeedback: state.conceptsFeedback
  }
}

export default connect(select)(ConceptSelector)
