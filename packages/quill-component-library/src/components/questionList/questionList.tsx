import React from 'react';
import { LinkListItem } from './linkListItem.jsx'

// interface QuestionListProps {
//   showOnlyArchived: boolean;
//   questions: Array<any>;
//   basePath: string;
// }
//
export class QuestionList extends React.Component<any, {}> {
  constructor(props: any) {
    super(props)

    this.renderListItems = this.renderListItems.bind(this)
  }

  renderListItems() {
    const questions = this.props.questions;
    if (questions.length !== 0) {
      let filtered;
      if (!this.props.showOnlyArchived) {
        filtered = questions.filter((question: any) =>
          question.flag !== "archived"
        )
      } else {
        filtered = questions.filter((question: any) =>
          question.flag === "archived"
        )
      }
      return filtered.map((question: any) => (
        <LinkListItem
          key={question.key}
          itemKey={question.key}
          text={question.prompt ? question.prompt : question.title}
          basePath={this.props.basePath}
        />
      ));
    }
  }

  render() {
    return (
      <ul className="menu-list">
        {this.renderListItems()}
      </ul>
    );
  }
}
