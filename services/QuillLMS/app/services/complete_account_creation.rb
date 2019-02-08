class CompleteAccountCreation

  def initialize(user, ip)
    @user = user
    @ip = ip
  end

  def call
    WelcomeEmailWorker.perform_async(user.id) if user.teacher?
    IpLocationWorker.perform_async(user.id, ip) unless user.student?
    AccountCreationWorker.perform_async(user.id)
    true
  end

  private

  attr_reader :user, :ip
end
