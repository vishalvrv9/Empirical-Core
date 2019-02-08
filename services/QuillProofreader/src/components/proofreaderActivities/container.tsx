import * as React from "react";
import * as Redux from "redux";
import {connect} from "react-redux";
import * as request from 'request';
import * as _ from 'lodash';
import { stringNormalize } from 'quill-string-normalizer'

const questionIconSrc = `${process.env.QUILL_CDN_URL}/images/icons/question_icon.svg`
const refreshIconSrc = `${process.env.QUILL_CDN_URL}/images/icons/refresh.svg`

import getParameterByName from '../../helpers/getParameterByName';
import { getActivity } from "../../actions/proofreaderActivities";
import { startListeningToConcepts } from "../../actions/concepts";
import {
  updateConceptResultsOnFirebase,
  updateSessionOnFirebase,
  updateSession,
  setSessionReducerToSavedSession
} from "../../actions/session";
// import { getConceptResultsForAllQuestions, calculateScoreForLesson } from '../../helpers/conceptResultsGenerator'
import { SessionState } from '../../reducers/sessionReducer'
import { ProofreaderActivityState } from '../../reducers/proofreaderActivitiesReducer'
import { ConceptResultObject } from '../../interfaces/proofreaderActivities'
import PassageEditor from './passageEditor'
import PassageReviewer from './passageReviewer'
import EarlySubmitModal from './earlySubmitModal'
import ResetModal from './resetModal'
import ReviewModal from './reviewModal'
import LoadingSpinner from '../shared/loading_spinner'

interface PlayProofreaderContainerProps {
  proofreaderActivities: ProofreaderActivityState;
  session: SessionState;
  dispatch: Function;
  admin?: Boolean;
  activityUID?: string;
}

interface PlayProofreaderContainerState {
  passage?: string;
  edits: string[];
  reviewing: boolean;
  resetting: boolean;
  showEarlySubmitModal: boolean;
  showReviewModal: boolean;
  showResetModal: boolean;
  editsWithOriginalValue: Array<{index: string, originalText: string, currentText: string}>;
  necessaryEdits?: String[];
  numberOfCorrectChanges?: number;
  originalPassage?: string;
  reviewablePassage?: string;
  conceptResultsObjects?: ConceptResultObject[];
}

export class PlayProofreaderContainer extends React.Component<PlayProofreaderContainerProps, PlayProofreaderContainerState> {
    constructor(props: any) {
      super(props);

      this.state = {
        edits: [],
        reviewing: false,
        showEarlySubmitModal: false,
        showReviewModal: false,
        showResetModal: false,
        editsWithOriginalValue: [],
        resetting: false
      }

      this.saveToLMS = this.saveToLMS.bind(this)
      this.finishActivitySession = this.finishActivitySession.bind(this)
      this.finishReview = this.finishReview.bind(this)
      this.createAnonActivitySession = this.createAnonActivitySession.bind(this)
      this.handlePassageChange = this.handlePassageChange.bind(this)
      this.finishActivity = this.finishActivity.bind(this)
      this.renderShowEarlySubmitModal = this.renderShowEarlySubmitModal.bind(this)
      this.closeEarlySubmitModal = this.closeEarlySubmitModal.bind(this)
      this.renderShowReviewModal = this.renderShowReviewModal.bind(this)
      this.closeReviewModal = this.closeReviewModal.bind(this)
      this.checkWork = this.checkWork.bind(this)
      this.calculateScoreForLesson = this.calculateScoreForLesson.bind(this)
      this.openResetModal = this.openResetModal.bind(this)
      this.closeResetModal = this.closeResetModal.bind(this)
      this.reset = this.reset.bind(this)
      this.finishReset = this.finishReset.bind(this)
    }

    componentWillMount() {
      const activityUID = getParameterByName('uid', window.location.href) || this.props.activityUID
      const sessionID = getParameterByName('student', window.location.href)

      this.props.dispatch(startListeningToConcepts())

      if (sessionID) {
        this.props.dispatch(setSessionReducerToSavedSession(sessionID))
      }

      if (activityUID) {
        this.props.dispatch(getActivity(activityUID))
      }

    }

    componentWillReceiveProps(nextProps: PlayProofreaderContainerProps) {
      if (nextProps.proofreaderActivities.currentActivity && !this.state.passage) {
        const { passage, underlineErrorsInProofreader } = nextProps.proofreaderActivities.currentActivity
        const initialPassageData = this.formatInitialPassage(passage, underlineErrorsInProofreader)
        const formattedPassage = initialPassageData.passage
        this.setState({ passage: formattedPassage, originalPassage: formattedPassage, necessaryEdits: initialPassageData.necessaryEdits })
      }

      if (!_.isEqual(nextProps.proofreaderActivities.currentActivity, this.props.proofreaderActivities.currentActivity)) {
        const { passage, underlineErrorsInProofreader } = nextProps.proofreaderActivities.currentActivity
        const initialPassageData = this.formatInitialPassage(passage, underlineErrorsInProofreader)
        const formattedPassage = initialPassageData.passage
        this.setState({ passage: formattedPassage, originalPassage: formattedPassage, necessaryEdits: initialPassageData.necessaryEdits })
      }

      const sessionID = getParameterByName('student', window.location.href)
      if (sessionID && !_.isEqual(nextProps.session, this.props.session)) {
        updateSessionOnFirebase(sessionID, nextProps.session.passage)
      }
    }

    formatInitialPassage(passage: string, underlineErrors: boolean) {
      const necessaryEdits = []
      passage = passage.replace(/&#x27;/g, "'").replace(/&quot;/g, '"')
      passage.replace(/{\+([^-]+)-([^|]+)\|([^}]*)}/g, (key: string, plus: string, minus: string, conceptUID: string) => {
        passage = passage.replace(key, `<u id="${necessaryEdits.length}">${minus}</u>`);
        necessaryEdits.push(key)
      });
      return {passage, necessaryEdits}
    }

    saveToLMS() {
      const results: ConceptResultObject[]|undefined = this.state.conceptResultsObjects;
      if (results) {
      const score = this.calculateScoreForLesson();
      const activityUID = getParameterByName('uid', window.location.href)
      const sessionID = getParameterByName('student', window.location.href)
      if (sessionID) {
        this.finishActivitySession(sessionID, results, score);
      } else if (activityUID) {
        this.createAnonActivitySession(activityUID, results, score);
      }
      }
    }

    calculateScoreForLesson() {
      const { numberOfCorrectChanges, necessaryEdits } = this.state
      if (numberOfCorrectChanges && necessaryEdits && necessaryEdits.length) {
        return numberOfCorrectChanges / necessaryEdits.length
      } else {
        return 0
      }
    }

    finishActivitySession(sessionID: string, results: ConceptResultObject[], score: number) {
      request(
        { url: `${process.env.EMPIRICAL_BASE_URL}/api/v1/activity_sessions/${sessionID}`,
          method: 'PUT',
          json:
          {
            state: 'finished',
            concept_results: results,
            percentage: score,
          },
        },
        (err, httpResponse, body) => {
          if (httpResponse && httpResponse.statusCode === 200) {
            document.location.href = `${process.env.EMPIRICAL_BASE_URL}/activity_sessions/${sessionID}`;
          }
        }
      );
    }

    createAnonActivitySession(lessonID: string, results: ConceptResultObject[], score: number) {
      request(
        { url: `${process.env.EMPIRICAL_BASE_URL}/api/v1/activity_sessions/`,
          method: 'POST',
          json:
          {
            state: 'finished',
            activity_uid: lessonID,
            concept_results: results,
            percentage: score,
          },
        },
        (err, httpResponse, body) => {
          if (httpResponse.statusCode === 200) {
            document.location.href = `${process.env.EMPIRICAL_BASE_URL}/activity_sessions/${body.activity_session.uid}`;
          }
        }
      );
    }

    // this method handles weirdness created by HTML formatting in Slate
    formatReceivedPassage(value: string) {
      let fixedString = value.replace(/<span data-original-index="\d+">|<\/span>|<strong> <\/strong>/gm, '').replace(/&#x27;/g, "'").replace(/&quot;/g, '"')
    // regex below matches case that looks like this: <strong><u id="6"> </u></strong><strong><u id="6"></u></strong><strong><u id="6"><u id="6">delivering</u></u></strong>
      const tripleStrongTagWithFourMatchingNestedURegex = /<strong>(<u id="\d+">)([^(<]*?)<\/u><\/strong><strong>(<u id="\d+">)([^(<]*?)<\/u><\/strong><strong>(<u id="\d+">)(<u id="\d+">)([^(<]*?)<\/u><\/u><\/strong>/
      // regex below matches case that looks like this: <strong><u id="10">A</u></strong><strong><u id="10"><u id="10">sia,</u></u></strong><strong><u id="10"> </u></strong>
      const tripleStrongTagWithThreeMatchingNestedURegex = /<strong>(<u id="\d+">)([^(<]+?)<\/u><\/strong><strong>(<u id="\d+">)(<u id="\d+">)([^(<]+?)<\/u><\/u><\/strong><strong>(<u id="\d+">)([^(<]+?)<\/u><\/strong>/gm

      // regex below matches case that looks like this: <strong><u id="3">Addison</u></strong><strong><u id="3">,</u></strong><strong><u id="3"> Parker, and Julian,</u></strong>
      const tripleStrongTagWithThreeMatchingURegex = /<strong>(<u id="\d+">)([^(<]+?)<\/u><\/strong><strong>(<u id="\d+">)([^(<]+?)<\/u><\/strong><strong>(<u id="\d+">)([^(<]+?)<\/u><\/strong>/gm

      // regex below matches case that looks like this: <strong><u id="3">Addison</u></strong><strong>,</strong><strong><u id="3"> Parker, and Julian,</u></strong>
      const tripleStrongTagWithTwoMatchingURegex = /<strong>(<u id="\d+">)([^(<]+?)<\/u><\/strong><strong>([^(<]+?)<\/strong><strong>(<u id="\d+">)([^(<]+?)<\/u><\/strong>/gm

      // regex below matches case that looks like this: <strong><u id="5"> </u></strong><strong><u id="5"></u></strong><u id="5">these?"</u>
      const doubleStrongTagWithThreeMatchingURegex = /<strong>(<u id="\d+">)([^(<]*?)<\/u><\/strong><strong>(<u id="\d+">)([^(<]*?)<\/u><\/strong>(<u id="\d+">)([^(<]*?)<\/u>/

      // regex below matches case that looks like this: <strong><u id="3"><u id="3">shows.</u></u></strong><strong><u id="3"> </u></strong>
      const doubleStrongTagWithThreeMatchingNestedUOnFirstTagRegex = /<strong>(<u id="\d+">)(<u id="\d+">)([^(<]+?)<\/u><\/u><\/strong><strong>(<u id="\d+">)([^(<]+?)<\/u><\/strong>/gm

      // regex below matches case that looks like this: <strong><u id="6">Y</u></strong><strong><u id="6"><u id="6">ellowstone</u></u></strong>
      const doubleStrongTagWithThreeMatchingNestedUOnSecondTagRegex = /<strong>(<u id="\d+">)([^(<]+?)<\/u><\/strong><strong>(<u id="\d+">)(<u id="\d+">)([^(<]+?)<\/u><\/u><\/strong>/gm

      // regex below matches case that looks like this: <strong>Addison</strong><strong><u id="3">, Parker, and Julian,</u></strong>
      const doubleStrongTagWithTwoMatchingURegex = /<strong>(<u id="\d+">)([^(<]+?)<\/u><\/strong><strong>(<u id="\d+">)([^(<]+?)<\/u><\/strong>/gm

      // regex below matches case that looks like this: <strong>Addison</strong><strong><u id="3">, Parker, and Julian,</u></strong>
      const doubleStrongTagWithUOnSecondTagRegex = /<strong>([^(<)]+?)<\/strong><strong>(<u id="\d+">)(.+?)<\/u><\/strong>/gm

      // regex below matches case that looks like this: <strong><u id="3">Addison</u></strong><strong>, Parker, and Julian,</strong>
      const doubleStrongTagWithUOnFirstTagRegex = /<strong>(<u id="\d+">)([^(<)]+?)<\/u><\/strong><strong>=(.+?)<\/strong>/gm

      // regex below matches case that looks like this: <strong>A</strong><strong>ntartctic</strong>
      const doubleStrongTagRegex = /<strong>[^(<)]+?<\/strong><strong>[^(<)]+?<\/strong>/gm

      const singleStrongTagWithThreeMatchingURegex = /(<u id="\d+">)([^(<]*?)<\/u>(<u id="\d+">)([^(<]*?)<\/u><strong>(<u id="\d+">)([^(<]*?)<\/u><\/strong>/

      // regex below matches case that looks like this: <strong><u id="3"><u id="3">are</u></u></strong>
      const singleStrongTagWithTwoMatchingNestedURegex = /<strong>(<u id="\d+">)(<u id="\d+">)([^(<]+?)<\/u><\/u><\/strong>/gm

      // regex below matches case that looks like this: <strong><u id="4">"That's</u></strong><u id="4"><u id="4"> </u></u>
      const singleStrongTagWithThreeMatchingURegexAtEnd = /<strong>(<u id="\d+">)([^(<]+?)<\/u><\/strong>(<u id="\d+">)(<u id="\d+">)([^(<]+?)<\/u><\/u>/gm

      // regex below matches case that looks like this: <strong><u id="6">John</u></strong><u id="6"> </u>
      const singleStrongTagWithTwoMatchingURegex = /<strong>(<u id="\d+">)([^(<]+?)<\/u><\/strong>(<u id="\d+">)([^(<]+?)<\/u>/gm

      if (tripleStrongTagWithFourMatchingNestedURegex.test(fixedString)) {
        fixedString = fixedString.replace(tripleStrongTagWithFourMatchingNestedURegex, (key, uTagA, contentA, uTagB, contentB, uTagC, uTagD, contentC) => {
          if (uTagA === uTagB && uTagB === uTagC && uTagC === uTagD) {
            return `<strong>${uTagA}${contentA}${contentB}${contentC}</u></strong>`
          } else {
            return key
          }
        })
      }

      if (tripleStrongTagWithThreeMatchingNestedURegex.test(fixedString)) {
        fixedString = fixedString.replace(tripleStrongTagWithThreeMatchingNestedURegex, (key, uTagA, contentA, uTagB, uTagC, contentB, uTagD, contentC) => {
          if (uTagA === uTagB && uTagB === uTagC && uTagC === uTagD) {
            return `<strong>${uTagA}${contentA}${contentB}${contentC}</u></strong>`
          } else {
            return key
          }
        })
      }

      if (tripleStrongTagWithThreeMatchingURegex.test(fixedString)) {
        fixedString = fixedString.replace(tripleStrongTagWithThreeMatchingURegex, (key, uTagA, contentA, uTagB, contentB, uTagC, contentC) => {
          if (uTagA === uTagB && uTagB === uTagC) {
            return `<strong>${uTagA}${contentA}${contentB}${contentC}</u></strong>`
          } else {
            return key
          }
        })
      }
      if (tripleStrongTagWithTwoMatchingURegex.test(fixedString)) {
        fixedString = fixedString.replace(tripleStrongTagWithTwoMatchingURegex, (key, uTagA, contentA, contentB, uTagC, contentC) => {
          if (uTagA === uTagC) {
            return `<strong>${uTagA}${contentA}${contentB}${contentC}</u></strong>`
          } else {
            return key
          }
        })
      }

      if (doubleStrongTagWithThreeMatchingNestedUOnFirstTagRegex.test(fixedString)) {
        fixedString = fixedString.replace(doubleStrongTagWithThreeMatchingNestedUOnFirstTagRegex, (key, uTagA, uTagB, contentA, uTagC, contentB) => {
          if (uTagA === uTagB && uTagB === uTagC) {
            return `<strong>${uTagA}${contentA}${contentB}</u></strong>`
          } else {
            return key
          }
        })
      }

      if (doubleStrongTagWithThreeMatchingURegex.test(fixedString)) {
        fixedString = fixedString.replace(doubleStrongTagWithThreeMatchingURegex, (key, uTagA, contentA, uTagB, contentB, uTagC, contentC) => {
          if (uTagA === uTagB && uTagB === uTagC) {
            return `<strong>${uTagA}${contentA}${contentB}${contentC}</u></strong>`
          } else {
            return key
          }
        })
      }

      if (doubleStrongTagWithThreeMatchingNestedUOnSecondTagRegex.test(fixedString)) {
        fixedString = fixedString.replace(doubleStrongTagWithThreeMatchingNestedUOnSecondTagRegex, (key, uTagA, contentA, uTagB, uTagC, contentB) => {
          if (uTagA === uTagB && uTagB === uTagC) {
            return `<strong>${uTagA}${contentA}${contentB}</u></strong>`
          } else {
            return key
          }
        })
      }

      if (doubleStrongTagWithTwoMatchingURegex.test(fixedString)) {
        fixedString = fixedString.replace(doubleStrongTagWithTwoMatchingURegex, (key, uTagA, contentA, uTagB, contentB) => {
          if (uTagA === uTagB) {
            return `<strong>${uTagA}${contentA}${contentB}</u></strong>`
          } else {
            return key
          }
        })
      }

      if (doubleStrongTagWithUOnSecondTagRegex.test(fixedString)) {
        fixedString = fixedString.replace(doubleStrongTagWithUOnSecondTagRegex, (key, contentA, uTag, contentB) => {
          if (contentA.includes(' ')) {
            const splitA = contentA.split(' ')
            return `<strong>${splitA[0]}</strong> <strong>${uTag}${splitA[1]}${contentB}</u></strong>`
          } else {
            return `<strong>${uTag}${contentA}${contentB}</u></strong>`
          }
        })
      }

      if (doubleStrongTagWithUOnFirstTagRegex.test(fixedString)) {
        fixedString = fixedString.replace(doubleStrongTagWithUOnSecondTagRegex, (key, uTag, contentA, contentB) => {
          if (contentB.includes(' ')) {
            const splitB = contentB.split(' ')
            return `<strong>${uTag}${contentA}${splitB[0]}</u></strong> <strong>${splitB[1]}</strong>`
          } else {
            return `<strong>${uTag}${contentA}${contentB}</u></strong>`
          }
        })
      }

      if (doubleStrongTagRegex.test(fixedString)) {
        fixedString = fixedString.replace(doubleStrongTagRegex, (key) => {
          return key.replace(/<\/strong><strong>/, '')
        })
      }

      if (singleStrongTagWithThreeMatchingURegex.test(fixedString)) {
        fixedString = fixedString.replace(singleStrongTagWithThreeMatchingURegex, (key, uTagA, contentA, uTagB, contentB, uTagC, contentC) => {
          if (uTagA === uTagB && uTagB === uTagC) {
            return `<strong>${uTagA}${contentA}${contentB}${contentC}</u></strong>`
          } else {
            return key
          }
        })
      }

      if (singleStrongTagWithTwoMatchingNestedURegex.test(fixedString)) {
        fixedString = fixedString.replace(singleStrongTagWithTwoMatchingNestedURegex, (key, uTagA, uTagB, content) => {
          if (uTagA === uTagB) {
            return `<strong>${uTagA}${content}</u></strong>`
          } else {
            return key
          }
        })
      }

      if (singleStrongTagWithThreeMatchingURegexAtEnd.test(fixedString)) {
        fixedString = fixedString.replace(singleStrongTagWithThreeMatchingURegexAtEnd, (key, uTagA, contentA, uTagB, uTagC, contentB) => {
          if (uTagA === uTagB && uTagB === uTagC) {
            return `<strong>${uTagA}${contentA}${contentB}</u></strong>`
          } else {
            return key
          }
        })
      }

      if (singleStrongTagWithTwoMatchingURegex.test(fixedString)) {
        fixedString = fixedString.replace(singleStrongTagWithTwoMatchingURegex, (key, uTagA, contentA, uTagB, contentB) => {
          if (uTagA === uTagB) {
            return `<strong>${uTagA}${contentA}${contentB}</u></strong>`
          } else {
            return key
          }
        })
      }

      return fixedString
    }

    handlePassageChange(value: string, editsWithOriginalValue: Array<{index: string, originalText: string, currentText: string}>) {
      this.props.dispatch(updateSession(value))
      const formattedValue = this.formatReceivedPassage(value)
      const regex = /<strong>.*?<\/strong>/gm
      const edits = formattedValue.match(regex)
      if (edits) {
        this.setState({ passage: formattedValue, edits, editsWithOriginalValue })
      } else if (this.state.edits) {
        this.setState({ passage: formattedValue, edits: [], editsWithOriginalValue })
      }
    }

    checkWork(): { reviewablePassage: string, numberOfCorrectChanges: number, conceptResultsObjects: ConceptResultObject[]}|void {
      const { currentActivity } = this.props.proofreaderActivities
      const { necessaryEdits, passage, editsWithOriginalValue } = this.state
      let remainingEditsWithOriginalValue = editsWithOriginalValue
      let numberOfCorrectChanges = 0
      const correctEditRegex = /\+([^-]+)-/m
      const originalTextRegex = /\-([^|]+)\|/m
      const conceptUIDRegex = /\|([^}]+)}/m
      const conceptResultsObjects: ConceptResultObject[] = []
      if (passage && necessaryEdits) {
        const gradedPassage = passage.replace(/<strong>(.*?)<\/strong>/gm , (key, edit) => {
          const uTag = edit.match(/<u id="(\d+)">(.+)<\/u>/m)
          if (uTag && uTag.length) {
            const id = Number(uTag[1])
            const text = stringNormalize(uTag[2]).trim()
            if (necessaryEdits && necessaryEdits[id]) {
              const correctEdit = necessaryEdits[id].match(correctEditRegex) ? stringNormalize(necessaryEdits[id].match(correctEditRegex)[1]).replace(/&#x27;/g, "'") : ''
              const conceptUID = necessaryEdits[id].match(conceptUIDRegex) ? necessaryEdits[id].match(conceptUIDRegex)[1] : ''
              const originalText = necessaryEdits[id].match(originalTextRegex) ? necessaryEdits[id].match(originalTextRegex)[1] : ''
              if (correctEdit.split('~').includes(text)) {
                numberOfCorrectChanges++
                conceptResultsObjects.push({
                  metadata: {
                    answer: text,
                    correct: 1,
                    instructions: currentActivity.description,
                    prompt: originalText,
                    questionNumber: id + 1,
                    unchanged: false,
                  },
                  concept_uid: conceptUID,
                  question_type: "passage-proofreader"
                })
                return `{+${text}-|${conceptUID}}`
              } else {
                conceptResultsObjects.push({
                  metadata: {
                    answer: text,
                    correct: 0,
                    instructions: currentActivity.description,
                    prompt: originalText,
                    questionNumber: id + 1,
                    unchanged: false,
                  },
                  concept_uid: conceptUID,
                  question_type: "passage-proofreader"
                })
                return `{+${correctEdit}-${text}|${conceptUID}}`
              }
            } else {
              const editObject = remainingEditsWithOriginalValue.find(editObj => editObj.currentText === edit)
              if (editObject) {
                remainingEditsWithOriginalValue = remainingEditsWithOriginalValue.filter(edit => edit.index !== editObject.index)
                return `{+${editObject.originalText}-${text}|unnecessary}`
              } else {
                return `{+-${edit}|unnecessary}`
              }
            }
          } else {
            const editObject = remainingEditsWithOriginalValue.find(editObj => editObj.currentText === edit)
            if (editObject) {
              remainingEditsWithOriginalValue = remainingEditsWithOriginalValue.filter(edit => edit.index !== editObject.index)
              return `{+${editObject.originalText}-${edit}|unnecessary}`
            } else {
              return `{+-${edit}|unnecessary}`
            }
          }
        })
        const reviewablePassage = gradedPassage.replace(/<u id="(\d+)">(.+?)<\/u>/gm, (key, id, text) => {
          if (necessaryEdits && necessaryEdits[id]) {
            const conceptUID = necessaryEdits[id].match(conceptUIDRegex) ? necessaryEdits[id].match(conceptUIDRegex)[1] : ''
            const originalText = necessaryEdits[id].match(originalTextRegex) ? necessaryEdits[id].match(originalTextRegex)[1] : ''
            const correctEdit = necessaryEdits[id].match(correctEditRegex) ? stringNormalize(necessaryEdits[id].match(correctEditRegex)[1]).replace(/&#x27;/g, "'") : ''
            if (correctEdit.split('~').includes(text)) {
              conceptResultsObjects.push({
                metadata: {
                  answer: text,
                  correct: 1,
                  instructions: currentActivity.description,
                  prompt: originalText,
                  questionNumber: Number(id) + 1,
                  unchanged: true,
                },
                concept_uid: conceptUID,
                question_type: "passage-proofreader"
              })
              return `{+${text}-|${conceptUID}}`
            } else {
              conceptResultsObjects.push({
                metadata: {
                  answer: text,
                  correct: 0,
                  instructions: currentActivity.description,
                  prompt: originalText,
                  questionNumber: Number(id) + 1,
                  unchanged: true,
                },
                concept_uid: conceptUID,
                question_type: "passage-proofreader"
              })
              return necessaryEdits[id]
            }
          } else {
            return `${text} `
          }
        }).replace(/<br\/>/gm, '')
        return { reviewablePassage, numberOfCorrectChanges, conceptResultsObjects }
      }
    }

    finishActivity() {
      const { edits, necessaryEdits } = this.state
      const requiredEditCount = necessaryEdits && necessaryEdits.length ? Math.floor(necessaryEdits.length / 2) : 5
      if (necessaryEdits && necessaryEdits.length && edits.length === 0 || edits.length < requiredEditCount) {
        this.setState({showEarlySubmitModal: true})
      } else {
        const { reviewablePassage, numberOfCorrectChanges, conceptResultsObjects } = this.checkWork()
        console.log('conceptResultsObjects', conceptResultsObjects)
        console.log('numberOfCorrectChanges', numberOfCorrectChanges)
        this.setState( { reviewablePassage, showReviewModal: true, numberOfCorrectChanges, conceptResultsObjects } )
      }
    }

    finishReview() {
      const activityUID = getParameterByName('uid', window.location.href)
      const sessionID = getParameterByName('student', window.location.href)
      const { conceptResultsObjects, necessaryEdits, numberOfCorrectChanges } = this.state
      if (this.props.admin) {
        this.setState({
          passage: this.state.originalPassage,
          edits: [],
          reviewing: false,
          showEarlySubmitModal: false,
          showReviewModal: false,
          numberOfCorrectChanges: undefined,
          reviewablePassage: undefined,
          conceptResultsObjects: undefined
        })
      } else if (conceptResultsObjects && activityUID) {
        const firebaseSessionID = updateConceptResultsOnFirebase(sessionID, activityUID, conceptResultsObjects)
        if (necessaryEdits && (necessaryEdits.length === numberOfCorrectChanges)) {
          this.saveToLMS()
        } else if (firebaseSessionID) {
          window.location.href = `${process.env.QUILL_GRAMMAR_URL}/play/sw?proofreaderSessionId=${firebaseSessionID}`
        }
      }
    }

    openResetModal() {
      this.setState({ showResetModal: true })
    }

    closeResetModal() {
      this.setState({ showResetModal: false })
    }

    closeEarlySubmitModal() {
      this.setState({ showEarlySubmitModal: false })
    }

    closeReviewModal() {
      this.setState({ showReviewModal: false, reviewing: true })
    }

    reset() {
      const { passage, underlineErrorsInProofreader } = this.props.proofreaderActivities.currentActivity
      const initialPassageData = this.formatInitialPassage(passage, underlineErrorsInProofreader)
      const formattedPassage = initialPassageData.passage
      this.setState({
        passage: formattedPassage,
        originalPassage: formattedPassage,
        necessaryEdits: initialPassageData.necessaryEdits,
        edits: [],
        editsWithOriginalValue: [],
        resetting: true,
        showResetModal: false
      })
    }

    finishReset() {
      this.setState({ resetting: false} )
    }

    renderShowEarlySubmitModal(): JSX.Element|void {
      const { showEarlySubmitModal, necessaryEdits } = this.state
      const requiredEditCount = necessaryEdits && necessaryEdits.length ? Math.floor(necessaryEdits.length / 2) : 5
      if (showEarlySubmitModal) {
        return <EarlySubmitModal
          requiredEditCount={requiredEditCount}
          closeModal={this.closeEarlySubmitModal}
        />
      }
    }

    renderShowResetModal(): JSX.Element|void {
      const { showResetModal, } = this.state
      if (showResetModal) {
        return <ResetModal
          reset={this.reset}
          closeModal={this.closeResetModal}
        />
      }
    }

    renderShowReviewModal(): JSX.Element|void {
      const { showReviewModal, necessaryEdits, numberOfCorrectChanges } = this.state
      const numberOfErrors = necessaryEdits && necessaryEdits.length ? necessaryEdits.length : 0
      if (showReviewModal) {
        return <ReviewModal
          numberOfErrors={numberOfErrors}
          numberOfCorrectChanges={numberOfCorrectChanges || 0}
          closeModal={this.closeReviewModal}
        />
      }
    }

    renderPassage(): JSX.Element|void {
      const { reviewing, reviewablePassage, originalPassage, resetting } = this.state
      const { passageFromFirebase } = this.props.session
      if (reviewing) {
        const text = reviewablePassage ? reviewablePassage : ''
        return <PassageReviewer
          text={text}
          concepts={this.props.concepts.data[0]}
          finishReview={this.finishReview}
        />
      } else if (originalPassage) {
        return <PassageEditor
          key={this.props.proofreaderActivities.currentActivity.passage}
          savedText={passageFromFirebase}
          text={originalPassage}
          handleTextChange={this.handlePassageChange}
          resetting={resetting}
          finishReset={this.finishReset}
        />
      }
    }

    renderCheckWorkButton(): JSX.Element|void {
      if (!this.state.reviewing) {
        return <button className="check-work" onClick={this.finishActivity}>Check Work</button>
      }
    }

    renderResetButton(): JSX.Element|void {
      const { reviewing, edits, } = this.state
      if (!reviewing) {
        if (edits.length) {
          return <button className="reset-button" onClick={this.openResetModal}><img src={refreshIconSrc} /> Reset</button>
        } else {
          return <button className="reset-button disabled"><img src={refreshIconSrc} /> Reset</button>
        }
      }
    }

    render(): JSX.Element {
      const { edits, necessaryEdits} = this.state
      const { currentActivity } = this.props.proofreaderActivities
      const numberOfCorrectEdits = necessaryEdits ? necessaryEdits.length : 0
      if (currentActivity) {
        const className = currentActivity.underlineErrorsInProofreader ? 'underline-errors' : ''
        const necessaryEditsLength = necessaryEdits ? necessaryEdits.length : 1
        const meterWidth = edits.length / necessaryEditsLength * 100
        return <div className="passage-container">
          <div className="header-section">
            <div className="inner-header">
              <h1>{currentActivity.title}</h1>
              <div className="instructions">
                <div>
                  <img src={questionIconSrc} />
                  <p dangerouslySetInnerHTML={{__html: currentActivity.description}}/>
                </div>
                <div className="edits-made">
                  <p>Edits Made: {edits.length} of {numberOfCorrectEdits}</p>
                  <div className="progress-bar-indication">
                    <span className="meter"
                      style={{width: `${meterWidth}%`}}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
          {this.renderShowEarlySubmitModal()}
          {this.renderShowResetModal()}
          {this.renderShowReviewModal()}
          <div className={`passage ${className}`}>
            {this.renderPassage()}
          </div>
          <div className="bottom-section">
            {this.renderResetButton()}
            {this.renderCheckWorkButton()}
          </div>
        </div>
      } else if (this.props.session.error) {
        return (
          <div>{this.props.session.error}</div>
        );
      } else {
        return <LoadingSpinner />
      }
    }
}

const mapStateToProps = (state: any) => {
    return {
        proofreaderActivities: state.proofreaderActivities,
        session: state.session,
        concepts: state.concepts
    };
};

const mapDispatchToProps = (dispatch: Redux.Dispatch<any>) => {
    return {
        dispatch
    };
};

export default connect(mapStateToProps, mapDispatchToProps)(PlayProofreaderContainer);
