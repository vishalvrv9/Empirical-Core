class SelfStudy::ScoresController < ApplicationController
  
    def index
      scores = ActivitySession.find_by_sql("
        SELECT 
          activity_sessions.activity_id,
          MAX(activity_sessions.percentage),
          MAX(activity_sessions.updated_at) AS updated_at,
          SUM(CASE WHEN activity_sessions.state = 'started' THEN 1 ELSE 0 END) AS resume_link
        FROM activity_sessions
        
        WHERE activity_sessions.user_id = #{current_user.id}
        GROUP BY activity_sessions.activity_id
      "
      render json: scores.to_json
    end
  
  end