class SegmentAnalytics
  # The actual backend that this uses to talk with segment.io.
  # This will be a fake backend under test and a real object
  # elsewhere.
  class_attribute :backend


  # TODO : split this all out in the way that SigninAnalytics splits out

  def initialize
    # Do not clobber the backend object if we already set a fake one under test
    unless Rails.env.test?
      self.backend ||= Segment::Analytics.new({
        write_key: SegmentIo.configuration.write_key,
        on_error: Proc.new { |status, msg| print msg }
      })
    end
  end

  def track_event_from_string(event_name, user_id)
    # make sure that event name is written as a string in the pattern of
    # those in app/services/analytics/segment_io.rb
    # i.e. "BUILD_YOUR_OWN_ACTIVITY_PACK"
    track({
       user_id: user_id,
       event: "SegmentIo::Events::#{event_name}".constantize
      })
  end

  def track_activity_assignment(teacher_id)
    track({
      user_id: teacher_id,
      event: SegmentIo::Events::ACTIVITY_ASSIGNMENT
    })
  end

  def track_classroom_creation(classroom)
    track({
      user_id: classroom&.owner&.id,
      event: SegmentIo::Events::CLASSROOM_CREATION
    })
  end

  def track_click_sign_up
    track({
      user_id: anonymous_uid,
      event: SegmentIo::Events::CLICK_SIGN_UP
    })
  end

  def track_activity_search(user_id, search_query)
    track({
      user_id: user_id,
      event: SegmentIo::Events::ACTIVITY_SEARCH,
      properties: {
        search_query: search_query
      }
    })
  end

  def track_student_login_pdf_download(user_id, classroom_id)
    track({
      user_id: user_id,
      event: SegmentIo::Events::STUDENT_LOGIN_PDF_DOWNLOAD,
      properties: {
        classroom_id: classroom_id
      }
    })
  end

  def track(options)
    if backend.present?
      backend.track(options)
    end
  end


  def identify(user)
    if backend.present?
      backend.identify(identify_params(user))
    end
  end

  private

  def anonymous_uid
    SecureRandom.urlsafe_base64
  end

  def integration_rules(user)
    should_send_data = (user.role == 'teacher')
    integrations = {
     all: true,
     Intercom: should_send_data,
     Salesmachine: should_send_data
    }
    integrations
  end


  def identify_params(user)
    params = {
      user_id: user.id,
      traits: {premium_state: user.premium_state, auditor: user.auditor?},
      integrations: integration_rules(user)
    }
  end

  def user_traits(user)
    SegmentAnalyticsUserSerializer.new(user).as_json(root: false)
  end
end
