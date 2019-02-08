class PremiumAnalyticsWorker
  include Sidekiq::Worker

  def perform(id, account_type)
    @user = User.find(id)
    analytics = Analyzer.new
    if account_type == 'paid'
      event = SegmentIo::Events::BEGAN_PREMIUM
    else
      # this is a a bit of a misnomer as free-contributor and free low-income
      # go here as well
      event = SegmentIo::Events::BEGAN_TRIAL
    end
    # tell segment.io
    analytics.track(@user, event)
  end
end
