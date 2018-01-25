import * as _ from 'underscore';
import { diffWords } from 'diff';
import {getOptimalResponses} from '../sharedResponseFunctions'
import {stringNormalize} from 'quill-string-normalizer'
import {Response, PartialResponse, ChangeObjectMatch} from '../../interfaces'
import {removePunctuation} from '../helpers/remove_punctuation'
import FEEDBACK_STRINGS from '../constants/feedback_strings'
import {conceptResultTemplate} from '../helpers/concept_result_template'
import {getFeedbackForMissingWord} from '../helpers/joining_words_feedback'

interface TextChangesObject {
  missingText: string|null,
  extraneousText: string|null,
}
interface ChangeObjectMatch {
  errorType: string,
  response: Response,
  missingText: string|null,
  extraneousText: string|null,
}

export function rigidChangeObjectChecker(responseString: string, responses:Array<Response>):ChangeObjectMatch|undefined {
  const match = rigidChangeObjectMatch(responseString, responses);
  if (match) {
    return rigidChangeObjectMatchResponseBuilder(match)
  }
}

export function flexibleChangeObjectChecker(responseString: string, responses:Array<Response>):ChangeObjectMatch|undefined {
  const match = flexibleChangeObjectMatch(responseString, responses);
  if (match) {
    return flexibleChangeObjectMatchResponseBuilder(match)
  }
}

export function rigidChangeObjectMatchResponseBuilder(match: ChangeObjectMatch): PartialResponse|null {
  const res: PartialResponse = {}
  switch (match.errorType) {
    case ERROR_TYPES.INCORRECT_WORD:
      const missingWord = match.missingText;
      const missingTextFeedback = getFeedbackForMissingWord(missingWord);
      res.feedback = missingTextFeedback || FEEDBACK_STRINGS.modifiedWordError;
      res.author = 'Modified Word Hint';
      res.parent_id = match.response.key;
      res.concept_results = [
        conceptResultTemplate('H-2lrblngQAQ8_s-ctye4g')
      ];
      return res;
    case ERROR_TYPES.ADDITIONAL_WORD:
      res.feedback = FEEDBACK_STRINGS.additionalWordError;
      res.author = 'Additional Word Hint';
      res.parent_id = match.response.key;
      res.concept_results = [
        conceptResultTemplate('QYHg1tpDghy5AHWpsIodAg')
      ];
      return res;
    case ERROR_TYPES.MISSING_WORD:

      res.feedback = FEEDBACK_STRINGS.missingWordError;
      res.author = 'Missing Word Hint';
      res.parent_id = match.response.key;
      res.concept_results = [
        conceptResultTemplate('N5VXCdTAs91gP46gATuvPQ')
      ];
      return res;
    default:
      return;
  }
}

export function flexibleChangeObjectMatchResponseBuilder(match: ChangeObjectMatch): PartialResponse|null {
  const initialVals = rigidChangeObjectMatchResponseBuilder(match)
  initialVals.author = "Flexible " + initialVals.author;
  return initialVals;
}

export function rigidChangeObjectMatch(response: string, responses: Array<Response>) {
  const fn = string => stringNormalize(string);
  return checkChangeObjectMatch(response, getOptimalResponses(responses), fn);
}

export function flexibleChangeObjectMatch(response: string, responses: Array<Response>) {
  const fn = string => removePunctuation(stringNormalize(string)).toLowerCase();
  return checkChangeObjectMatch(response, getOptimalResponses(responses), fn);
}

export function checkChangeObjectMatch(userString: string, responses: Array<Response>, stringManipulationFn: (string: string) => string, skipSort: boolean = false): ChangeObjectMatch|null {
  if (!skipSort) {
    responses = _.sortBy(responses, 'count').reverse();
  }
  let matchedErrorType;
  const matched = _.find(responses, (response) => {
    matchedErrorType = getErrorType(stringManipulationFn(response.text), stringManipulationFn(userString));
    return matchedErrorType;
  });
  if (matched) {
    const textChanges = getMissingAndAddedString(matched.text, userString);
    return Object.assign(
      {},
      {
        response: matched,
        errorType: matchedErrorType,
      },
      textChanges
      );
  }
}

const ERROR_TYPES = {
  NO_ERROR: 'NO_ERROR',
  MISSING_WORD: 'MISSING_WORD',
  ADDITIONAL_WORD: 'ADDITIONAL_WORD',
  INCORRECT_WORD: 'INCORRECT_WORD',
};

const getErrorType = (targetString:string, userString:string):string|null => {
  const changeObjects = getChangeObjects(targetString, userString);
  const hasIncorrect = checkForIncorrect(changeObjects);
  const hasAdditions = checkForAdditions(changeObjects);
  const hasDeletions = checkForDeletions(changeObjects);
  if (hasIncorrect) {
    return ERROR_TYPES.INCORRECT_WORD;
  } else if (hasAdditions) {
    return ERROR_TYPES.ADDITIONAL_WORD;
  } else if (hasDeletions) {
    return ERROR_TYPES.MISSING_WORD;
  }
};

const getMissingAndAddedString = (targetString: string, userString: string): TextChangesObject => {
  const changeObjects = getChangeObjects(targetString, userString);
  const missingObject = _.where(changeObjects, { removed: true, })[0];
  const missingText = missingObject ? missingObject.value : undefined;
  const extraneousObject = _.where(changeObjects, { added: true, })[0];
  const extraneousText = extraneousObject ? extraneousObject.value : undefined;
  return {
    missingText,
    extraneousText,
  };
};

const getChangeObjects = (targetString, userString) => diffWords(targetString, userString);

const checkForIncorrect = (changeObjects):boolean => {
  let tooLongError = false;
  const found = false;
  let foundCount = 0;
  let coCount = 0;
  changeObjects.forEach((current, index, array) => {
    if (checkForAddedOrRemoved(current)) {
      coCount += 1;
    }
    tooLongError = checkForTooLongError(current);
    if (current.removed && getLengthOfChangeObject(current) < 2 && index === array.length - 1) {
      foundCount += 1;
    } else {
      foundCount += current.removed && getLengthOfChangeObject(current) < 2 && array[index + 1].added ? 1 : 0;
    }
  });
  return !tooLongError && (foundCount === 1) && (coCount === 2);
};

const checkForAdditions = (changeObjects):boolean => {
  let tooLongError = false;
  const found = false;
  let foundCount = 0;
  let coCount = 0;
  changeObjects.forEach((current, index, array) => {
    if (checkForAddedOrRemoved(current)) {
      coCount += 1;
    }
    tooLongError = checkForTooLongError(current);
    if (current.added && getLengthOfChangeObject(current) < 2 && index === 0) {
      foundCount += 1;
    } else {
      foundCount += current.added && getLengthOfChangeObject(current) < 2 && !array[index - 1].removed ? 1 : 0;
    }
  });
  return !tooLongError && (foundCount === 1) && (coCount === 1);
};

const checkForDeletions = (changeObjects):boolean => {
  let tooLongError = false;
  const found = false;
  let foundCount = 0;
  let coCount = 0;
  changeObjects.forEach((current, index, array) => {
    if (checkForAddedOrRemoved(current)) {
      coCount += 1;
    }
    tooLongError = checkForTooLongError(current);
    if (current.removed && getLengthOfChangeObject(current) < 2 && index === array.length - 1) {
      foundCount += 1;
    } else {
      foundCount += current.removed && getLengthOfChangeObject(current) < 2 && !array[index + 1].added ? 1 : 0;
    }
  });
  return !tooLongError && (foundCount === 1) && (coCount === 1);
};

const checkForAddedOrRemoved = changeObject => changeObject.removed || changeObject.added;

const checkForTooLongChangeObjects = changeObject => getLengthOfChangeObject(changeObject) >= 2;

const checkForTooLongError = changeObject => (changeObject.removed || changeObject.added) && checkForTooLongChangeObjects(changeObject);

const getLengthOfChangeObject = changeObject =>
  // filter boolean removes empty strings from trailing,
  // leading, or double white space.
   changeObject.value.split(' ').filter(Boolean).length;
