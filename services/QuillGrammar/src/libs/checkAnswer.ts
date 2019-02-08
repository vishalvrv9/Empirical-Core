declare function require(name: string);
import { hashToCollection } from 'quill-component-library/dist/componentLibrary';
import * as _ from 'underscore'
import {checkGrammarQuestion} from 'quill-marking-logic'

export default function checkAnswer(question, response, responses, mode= 'default') {
  const fields = {
    responses: responses ? hashToCollection(responses) : [],
    questionUID: question.key
  };
  const focusPoints = question.focusPoints ? hashToCollection(question.focusPoints) : [];
  const incorrectSequences = question.incorrectSequences ? hashToCollection(question.incorrectSequences) : [];
  const defaultConceptUID = question.modelConceptUID || question.concept_uid
  const responseObj = checkGrammarQuestion(fields.questionUID, response, fields.responses, focusPoints, incorrectSequences, defaultConceptUID)
  return {response: responseObj};
}
