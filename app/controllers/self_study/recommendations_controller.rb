class SelfStudy::RecommendationsController < ApplicationController
  
    def index
      diagnostic_session =  ActivitySession.where(user_id: current_user.id, activity_id: 413, state: "finished").last
      counted_concept_results = PublicProgressReports.concept_results_by_count(diagnostic_session)
      
      render json: activities.to_json
    end

    private

    def get_recommended_units(concept_result_scores)
      units = []
      recommendations = Recommendations.recs_for_413.map do |activity_pack_recommendation|
      activity_pack_recommendation[:requirements].each do |req|
        if req[:noIncorrect] && activity_session[:concept_scores][req[:concept_id]]["total"] > activity_session[:concept_scores][req[:concept_id]]["correct"]
          units.concat(activity_pack_recommendation[:activityPackId])
          break
        end
        if activity_session[:concept_scores][req[:concept_id]]["correct"] < req[:count]
          units.concat(activity_pack_recommendation[:activityPackId])
          break
        end
      end
      return units
    end

    def get_acts_from_recommended_units(units)
      activity_pack_ids.each do |actpackid|
        units[actpackid] = UnitTemplate.find(actpackid).activities.map(&:id)
      end 
    end
  
  end