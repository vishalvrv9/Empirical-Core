import * as React from "react";
import {Link} from "react-router";
import { Query, Mutation } from "react-apollo";
import gql from "graphql-tag";
import { Concept } from "../containers/ConceptsShow";
import ConceptReplaceFormFields from './ConceptReplaceFormFields';

const REPLACE_CONCEPT = gql`
  mutation replaceConcept($id: ID! $replacementId: ID!){
    replaceConcept(input: {id: $id, replacementId: $replacementId}){
      concept {
        id
        uid
        name
        parentId
        visible
      }
    }
  }
`;


export interface AppProps {
  concept: Concept
  redirectToShow(Concept): null
}

class ConceptReplaceForm extends React.Component<AppProps, any> {
  constructor(props){
    super(props)
    this.state = {
      fields: {
        replacementId: {
          value: null,
        },
      },
    };
  }

  handleFormChange = (changedFields) => {
    this.setState(({ fields }) => {
      const newState =  {
        fields: { ...fields, ...changedFields },
      }
      return newState;
    });
  }

  handleFormSubmit = (e) => {
    e.preventDefault()
  }

  redirectToShow = (data) => {
    this.props.redirectToShow(data.replaceConcept.concept)
  }

  render() {
    const fields = this.state.fields;
    return (
      <Mutation mutation={REPLACE_CONCEPT} onCompleted={this.redirectToShow}>
        {(replaceConcept, { data }) => (
          <ConceptReplaceFormFields {...fields} onChange={this.handleFormChange} formSubmitCopy={"Replace"} onSubmit={(e) => {
            e.preventDefault();
            replaceConcept({ variables: {id: this.props.concept.id, replacementId: this.state.fields.replacementId.value[this.state.fields.replacementId.value.length - 1]}});
          }} />
        )}
      </Mutation>
    )
  }
};

export default ConceptReplaceForm