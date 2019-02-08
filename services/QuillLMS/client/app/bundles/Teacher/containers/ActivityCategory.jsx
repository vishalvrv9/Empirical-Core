import React from 'react'
import request from 'request'
import getAuthToken from '../components/modules/get_auth_token'
import ActivitySearchAndSelect from '../components/lesson_planner/create_unit/activity_search/activity_search_and_select'

export default class ActivityCategory extends React.Component {
  constructor(props) {
    super(props)

    this.state = {
      selectedActivities: props.activities
    }

    this.toggleActivitySelection = this.toggleActivitySelection.bind(this)
    this.updateActivityOrder = this.updateActivityOrder.bind(this)
    this.destroyAndRecreateOrderNumbers = this.destroyAndRecreateOrderNumbers.bind(this)
  }

  toggleActivitySelection(activity) {
    const newSelectedActivities = this.state.selectedActivities
    const activityIndex = newSelectedActivities.findIndex(a => a.id === activity.id)
    if (activityIndex === -1) {
      const activityWithOrderNumber = Object.assign({}, activity)
      activityWithOrderNumber.order_number = newSelectedActivities.length
      newSelectedActivities.push(activityWithOrderNumber)
    } else {
      newSelectedActivities.splice(activityIndex, 1)
    }
    this.setState({selectedActivities: newSelectedActivities})
  }

  updateActivityOrder(sortInfo) {
    const originalOrderedActivities = this.state.selectedActivities
    const newOrder = sortInfo.data.items.map(item => item.key);
    const newOrderedActivities = newOrder.map((key, i) => {
      const newActivity = originalOrderedActivities[key]
      newActivity.order_number = i
      return newActivity
    })
    this.setState({selectedActivities: newOrderedActivities})
  }

  destroyAndRecreateOrderNumbers() {
    const that = this
    const activities = this.state.selectedActivities;
    request.post(`${process.env.DEFAULT_URL}/cms/activity_categories/destroy_and_recreate_acas`, {
      json: {
        authenticity_token: getAuthToken(),
        activities: activities,
        activity_category_id: that.props.activity_category.id
      }}, (e, r, response) => {
        if (e) {
          alert(`We could not save the updated activity order. Here is the error: ${e}`)
        } else {
          this.setState({selectedActivities: response.activities})
          alert('The updated activity order has been saved.')
        }
      }
    )
  }

  render() {
    return(<div>
      <ActivitySearchAndSelect
        selectedActivities={this.state.selectedActivities}
        toggleActivitySelection={this.toggleActivitySelection}
        sortable={true}
        sortCallback={this.updateActivityOrder}
      />
      <button onClick={this.destroyAndRecreateOrderNumbers}>Save Activities</button>
    </div>
  )
  }
}
