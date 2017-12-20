class SelfStudyController < ApplicationController

  def self_study_activities
    activities = Activity.find_by_sql("
      SELECT 
        activities.id,
        activities.name,
        activities.uid,
        activities.activity_classification_id,
        ac.name,
        ac.order_number,
        aca.order_number
      FROM activities
      JOIN activity_category_activities AS aca ON aca.activity_id = activities.id
      JOIN activity_categories AS ac ON ac.id = aca.activity_category_id
      WHERE activity_classification_id != 6
      AND activities.id NOT IN (447, 602)
      ORDER BY ac.order_number, aca.order_number
    ")
    render json: {activities: activities}
  end

end