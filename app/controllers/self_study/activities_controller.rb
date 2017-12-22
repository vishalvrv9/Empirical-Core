class SelfStudy::ActivitiesController < ApplicationController
  # We need to return activities that are suitable for self study ie not group lessons
  # We also need the name of the ActivityCategory, its order relative to the others
  # and the activities order within the category, which comes from ActivityCategoryOrder
  # [{
  #   name: "Commas",
  #   id: 1,
  #   uid: '-erjcjr393jsldkne9',
  #   activity_category_name: "Punctuation",
  #   activity_category_order: 1,
  #   activity_category_activity_order: 1,
  #   activity_classification_id: 1
  # }]
  def index
    render json: Activity.joins(activity_category_activities: :activity_category).where("activities.activity_classification_id != 6").select("activities.name as name, activities.uid as uid , activities.id as id, activities.activity_classification_id as classification_id, activity_categories.name as activity_category_name, activity_categories.order_number as activity_category_order, activity_category_activities.order_number as activity_category_activity_order" )
  end
end