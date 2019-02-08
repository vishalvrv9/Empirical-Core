class Teachers::ClassroomUnitsController < ApplicationController
  include QuillAuthentication
  require 'pusher'
  respond_to :json
  before_action :authorize!, except: [
    :lessons_activities_cache,
    :lessons_units_and_activities, :update_multiple_due_dates
  ]
  before_action :teacher!
  before_action :lesson, only: :launch_lesson

  def launch_lesson
    begin
    @unit_activity = UnitActivity.find_by(
      unit_id: @classroom_unit.unit_id,
      activity: @lesson.id
    )
    cuas = ClassroomUnitActivityState.find_or_create_by(
      classroom_unit: @classroom_unit,
      unit_activity: @unit_activity
    )
    rescue ActiveRecord::StatementInvalid
      flash.now[:error] = "We cannot launch this lesson. If the problem persists, please contact support."
      redirect_to :back
      return
    end

    if lesson_tutorial_completed?
      if cuas && cuas.update(locked: false, pinned: true)
        find_or_create_lesson_activity_sessions_for_classroom
        PusherLessonLaunched.run(@classroom_unit.classroom)
        # if @classroom_unit.is_valid_for_google_announcement_with_specific_user?(current_user)
        #   return post_to_google_classroom
        # end
        redirect_to lesson_url(lesson) and return
      else
        flash.now[:error] = "We cannot launch this lesson. If the problem persists, please contact support."
        redirect_to :back
      end
    else
      redirect_to "#{ENV['DEFAULT_URL']}/tutorials/lessons?url=#{URI.escape(launch_lesson_url)}" and return
    end
  end

  def lessons_activities_cache
    render json: {
      data: lessons_cache
    }
  end

  def lessons_units_and_activities
    render json: {
      data: get_lessons_units_and_activities
    }
  end

  def mark_lesson_as_completed
    redirect_to mark_lesson_as_completed_url
  end

  private

  def set_activity_session
    @activity_sessions = ActivitySession.where(classroom_unit_id: @classroom_units.ids)
  end

  def set_classroom_units
    @classroom_units = ClassroomUnit.where(activity: @classroom_unit.activity, unit: @classroom_unit.unit)
  end

  def mark_lesson_as_completed_url
    "#{lesson.classification_form_url}teach/class-lessons/#{lesson.uid}/mark_lesson_as_completed?&classroom_unit_id=#{@classroom_unit.id}"
  end

  def lesson_tutorial_completed?
    @tutorial_completed ||= UserMilestone.exists?(milestone_id: view_lessons_tutorial_milestone.id, user_id: current_user.id)
  end

  def launch_lesson_url
    "/teachers/classroom_units/#{@classroom_unit.id}/launch_lesson/#{lesson.uid}"
  end

  def lesson
    @lesson ||= Activity.find_by(uid: params['lesson_uid']) || Activity.find_by(id: params['lesson_uid'])
  end

  def view_lessons_tutorial_milestone
    Milestone.find_by(name: 'View Lessons Tutorial')
  end

  def lesson_url(lesson)
    if (ActivitySession.find_by(classroom_unit_id: @classroom_unit.id, state: 'started'))
      "#{lesson.classification_form_url}teach/class-lessons/#{lesson.uid}?&classroom_unit_id=#{@classroom_unit.id}"
    else
      "#{lesson.classification_form_url}customize/#{lesson.uid}?&classroom_unit_id=#{@classroom_unit.id}"
    end
  end

  def post_to_google_classroom
    # google_response = GoogleIntegration::LessonAnnouncement
    #   .new(@classroom_unit, @unit_activity).post
    # if google_response == 'UNAUTHENTICATED'
    #   session[:google_redirect] = request.path
    #   return redirect_to '/auth/google_oauth2'
    # else
    #   redirect_to lesson_url(lesson)
    # end
  end

  def find_or_create_lesson_activity_sessions_for_classroom
    @classroom_unit.assigned_student_ids.each{|id| ActivitySession.unscoped.find_or_create_by(classroom_unit_id: @classroom_unit.id, activity_id: @lesson.id, user_id: id).update(visible: true)}
  end

  def authorize!
    @classroom_unit = ClassroomUnit.find params[:id]
    if @classroom_unit.classroom.teacher_ids.exclude?(current_user.id) then auth_failed end
  end


  def get_lessons_units_and_activities
    # collapses lessons cache into unique array of activity ids
    grouped_lessons_cache = lessons_cache.group_by{|ca| {activity_id: ca['activity_id'], name: ca['activity_name'], completed: ca['completed']}}
    grouped_lessons_cache.keys.select { |lesson| lesson[:completed] == false }
  end

  def lessons_cache
    lessons_cache = $redis.get("user_id:#{current_user.id}_lessons_array")
    if lessons_cache
      JSON.parse(lessons_cache)
    else
      current_user.set_and_return_lessons_cache_data
    end
  end

  def classroom_unit_params
    params[:classroom_unit].permit(:choose_everyone, {assigned_student_ids: []}, :unit_id)
  end
end
