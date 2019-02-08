class ReferralsUser < ActiveRecord::Base
  belongs_to :user
  has_one :referred_user, class_name: 'User', foreign_key: :id, primary_key: :referred_user_id

  after_create :trigger_invited_event
  after_save :trigger_activated_event, if: Proc.new { self.activated_changed? && self.activated }

  def referring_user
    self.user
  end

  def referrer
    self.user
  end

  def referral
    self.referred_user
  end

  def referrer_id
    self.user_id
  end

  def referral_id
    self.referred_user_id
  end

  def send_activation_email
    user_info = ActiveRecord::Base.connection.execute("SELECT name, email FROM users WHERE id = #{self.referrer_id} OR id = #{self.referral_id}").to_a
    referrer_hash = user_info.first
    referral_hash = user_info.last
    if Rails.env.production? || (referrer_hash['email'].match('quill.org') && referral_hash['email'].match('quill.org'))
      UserMailer.activated_referral_email(referrer_hash, referral_hash).deliver_now!
    end
  end

  def self.ids_due_for_activation
    act_sess_ids = ActiveRecord::Base.connection.execute("
      SELECT DISTINCT classroom_units.id as classroom_unit_id FROM referrals_users
        JOIN classrooms_teachers ON referrals_users.referred_user_id = classrooms_teachers.user_id
        JOIN classroom_units ON classrooms_teachers.classroom_id = classroom_units.classroom_id
        WHERE referrals_users.activated = FALSE;
    ").to_a.map(&:values).flatten

    unless act_sess_ids.empty?
      classroom_unit_ids =ActiveRecord::Base.connection.execute("
        SELECT classroom_unit_id FROM activity_sessions WHERE classroom_unit_id IN (#{act_sess_ids.join(',')})
        AND activity_sessions.completed_at IS NOT NULL
      ").to_a.map(&:values).flatten
    else
      return []
    end

    unless classroom_unit_ids.empty?
      ActiveRecord::Base.connection.execute("
        SELECT DISTINCT referrals_users.id FROM referrals_users
          JOIN classrooms_teachers ON referrals_users.referred_user_id = classrooms_teachers.user_id
          JOIN classroom_units ON classrooms_teachers.classroom_id = classroom_units.classroom_id
          WHERE classroom_units.id IN (#{classroom_unit_ids.join(',')})
      ").to_a.map(&:values).flatten
    else
      return []
    end
  end

  private
  def trigger_invited_event
    # Unlike other analytics events, we want to track this event with respect
    # to the referrer, not the current user, because we are attempting to
    # measure the referrer's referring activity and not the current user's.
    ReferrerAnalytics.new.track_referral_invited(self.referrer, self.referred_user.id)
  end

  def trigger_activated_event
    # Unlike other analytics events, we want to track this event with respect
    # to the referrer, not the current user, because we are attempting to
    # measure the referrer's referring activity and not the current user's.
    ReferrerAnalytics.new.track_referral_activated(self.referrer, self.referred_user.id)
    UserMilestone.find_or_create_by(user_id: self.referrer.id, milestone_id: Milestone.find_or_create_by(name: Milestone::TYPES[:refer_an_active_teacher]).id)
    ReferralEmailWorker.perform_async(self.id)
  end
end
