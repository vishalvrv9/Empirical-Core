class AssignActivityWorker
  include Sidekiq::Worker

  def perform(teacher_id)
    analytics = SegmentAnalytics.new
    analytics.track_activity_assignment(teacher_id) if teacher_id
  end
end
