class SelfStudy::ScoresController < ApplicationController
  def index
    ActivitySession.where(user: current_user).group('activity_id').pluck('activity_id, max(percentage)')
  end
end
  

# ActivitySession.where(user_id: 1830041).group('activity_id').pluck('activity_id, max(percentage)')