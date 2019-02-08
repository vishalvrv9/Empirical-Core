class WelcomeEmailWorker
  include Sidekiq::Worker
  sidekiq_options queue: 'critical'

  def perform(id)
    @user = User.find(id)
    @user.send_welcome_email
  end
end
