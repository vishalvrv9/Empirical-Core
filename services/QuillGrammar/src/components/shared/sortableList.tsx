import * as React from 'react';
const { sortable } = require('react-sortable');
import ListItem from './listItem'

const SortableListItem = sortable(ListItem);

// interface SortableListProps {
//   data: data;
// }
//
// interface data {
//   items: any
// }

class SortableList extends React.Component<any, any> {
  constructor(props: any) {
    super(props)

    this.state = {
      draggingIndex: null,
			data: {
				items: this.props.data
			}
    }

    this.updateState = this.updateState.bind(this)
  }


	componentWillReceiveProps(nextProps: any) {
		if (nextProps.data !== this.state.data.items) {
			this.setState({data: {items: nextProps.data}})
		}
	}

	updateState(obj: object) {
		this.setState(obj, this.props.sortCallback(this.state));
	}

	render() {
		const childProps = {
			className: 'myClass1'
		};
		const listItems = this.state.data.items.map((item: any, i: number) => {
			return (
				<SortableListItem
          key={i}
          onSortItems={this.updateState}
          updateState={this.updateState}
          items={this.state.data.items}
          draggingIndex={this.state.draggingIndex}
          sortId={i}
          outline="list"
          childProps={childProps}
        >
          {item}
        </SortableListItem>
			);
		}, this);

		return (
			<div className="list">{listItems}</div>
		);
	}
}

export default SortableList
