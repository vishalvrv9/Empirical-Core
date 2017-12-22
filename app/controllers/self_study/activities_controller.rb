class SelfStudy::ActivitiesController < ApplicationController

  def index
    activities = Activity.find_by_sql("
      SELECT 
        activities.id as id,
        activities.name as name,
        activities.uid as uid,
        activities.activity_classification_id as ac_id,
        ac.name as ac_name,
        ac.order_number as acat_o,
        aca.order_number as aca_o
      FROM activities
      JOIN activity_category_activities AS aca ON aca.activity_id = activities.id
      JOIN activity_categories AS ac ON ac.id = aca.activity_category_id
      WHERE activity_classification_id != 6
      AND activities.id NOT IN (447, 602)
      ORDER BY ac.order_number, aca.order_number
    ")
    render json: activities.to_json
  end

end