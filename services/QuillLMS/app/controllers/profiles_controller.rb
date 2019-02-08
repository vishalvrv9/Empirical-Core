class ProfilesController < ApplicationController
  before_filter :signed_in!

  def show
    @user = current_user
    if current_user.role == 'student'
      @firewall_test = true
      @js_file = 'student'
      if current_user.classrooms.any?
        # in the future, we could use the following sql query to direct the student
        # to the classroom with the most recently updated classroom activity,
        # but it may not be worth the memory use now.
        # SELECT classroom_units.classroom_id FROM classroom_units
        # WHERE 1892827 = ANY(classroom_units.assigned_student_ids)
        # ORDER BY classroom_units.updated_at DESC
        # LIMIT 1
        render 'students/index'
      else
        redirect_to '/add_classroom'
      end
    else
      send current_user.role
    end
  end

  def user
    student
  end

  def student_profile_data
    if current_user.classrooms.any?
      render json: {
        scores: student_profile_data_sql(params[:current_classroom_id]),
        next_activity_session: next_activity_session,
        student: student_data,
        classroom_id: params[:current_classroom_id] ? params[:current_classroom_id] : current_user.classrooms.last.id
      }
    else
      render json: {error: 'Current user has no classrooms'}
    end
  end

  def get_mobile_profile_data
    if current_user.classrooms.any?
      grouped_scores = get_parsed_mobile_profile_data(params[:current_classroom_id])
      render json: {grouped_scores: grouped_scores}
    else
      render json: {error: 'Current user has no classrooms'}
    end
  end

  def students_classrooms_json
    render json: {classrooms: students_classrooms_with_join_info}
  end

  def teacher
    if @user.classrooms_i_teach.any? || @user.archived_classrooms.any?
      redirect_to dashboard_teachers_classrooms_path
    elsif @user.schools_admins.any?
      redirect_to teachers_admin_dashboard_path
    else
      redirect_to new_teachers_classroom_path
    end
  end

  def staff
    render :staff
  end

protected
  def user_params
    params.require(:user).permit(:classcode, :email, :name, :username, :password)
  end

  def student_data
    {
      name: current_user&.name,
      classroom: {
        name: @current_classroom&.name,
        id: @current_classroom&.id,
        teacher: {
          name: @current_classroom&.owner&.name
        }
      },
    }
  end

  def students_classrooms_with_join_info
    ActiveRecord::Base.connection.execute(
    "SELECT classrooms.name AS name, teacher.name AS teacher, classrooms.id AS id FROM classrooms
      JOIN students_classrooms AS sc ON sc.classroom_id = classrooms.id
      JOIN classrooms_teachers ON classrooms_teachers.classroom_id = sc.classroom_id AND classrooms_teachers.role = 'owner'
      JOIN users AS teacher ON teacher.id = classrooms_teachers.user_id
      WHERE sc.student_id = #{current_user.id}
      AND classrooms.visible = true
      AND sc.visible = true
      ORDER BY sc.created_at ASC").to_a
  end

  def student_profile_data_sql(classroom_id=nil)
    @current_classroom = current_classroom(classroom_id)
    if @current_classroom && current_user
      @act_sesh_records = ActiveRecord::Base.connection.execute(
        "SELECT unit.name,
         activity.name,
         activity.description,
         activity.repeatable,
         activity.activity_classification_id,
         unit.id AS unit_id,
         ua.id AS ua_id,
         unit.created_at AS unit_created_at,
         unit.name AS unit_name,
         cu.id AS ca_id,
         COALESCE(cuas.completed, 'f') AS marked_complete,
         ua.activity_id,
         MAX(acts.updated_at) AS act_sesh_updated_at,
         ua.due_date,
         cu.created_at AS unit_activity_created_at,
         COALESCE(cuas.locked, 'f') AS locked,
         COALESCE(cuas.pinned, 'f') AS pinned,
         MAX(acts.percentage) AS max_percentage,
         SUM(CASE WHEN acts.state = 'started' THEN 1 ELSE 0 END) AS resume_link
      FROM unit_activities AS ua
      JOIN units AS unit ON unit.id = ua.unit_id
      JOIN classroom_units AS cu ON unit.id = cu.unit_id
      LEFT JOIN activity_sessions AS acts ON cu.id = acts.classroom_unit_id AND acts.activity_id = ua.activity_id AND acts.visible = true
      AND acts.user_id = #{current_user.id}
      JOIN activities AS activity ON activity.id = ua.activity_id
      LEFT JOIN classroom_unit_activity_states AS cuas ON ua.id = cuas.unit_activity_id
      AND cu.id = cuas.classroom_unit_id
      WHERE #{current_user.id} = ANY (cu.assigned_student_ids::int[])
      AND cu.classroom_id = #{@current_classroom.id}
      AND cu.visible = true
      AND unit.visible = true
      AND ua.visible = true
      GROUP BY unit.id, unit.name, unit.created_at, cu.id, activity.name, activity.activity_classification_id, activity.id, activity.uid, ua.due_date, ua.created_at, unit_activity_id, cuas.completed, cuas.locked, cuas.pinned, ua.id

      ORDER BY pinned DESC, locked ASC, max_percentage DESC, ua.due_date ASC, unit.created_at ASC, ua.id ASC").to_a
    else
      @act_sesh_records = []
    end
  end

  def next_activity_session
    # We only need to check the first activity session record here because of
    # the order in which the the query returns these.
    can_display_next_activity = begin
      @act_sesh_records.any? &&
      @act_sesh_records.first['locked'] == 'f' &&
      @act_sesh_records.first['marked_complete'] == 'f' &&
      !@act_sesh_records.first['max_percentage']
    end

    if can_display_next_activity
      @act_sesh_records.first
    end
  end

  def get_parsed_mobile_profile_data(classroom_id)
    # classroom = current_classroom(classroom_id)
    Profile::Mobile::ActivitySessionsByUnit.new.query(current_user, classroom_id)
  end

  def current_classroom(classroom_id = nil)
    if !classroom_id
       current_user.classrooms.last
    else
      current_user.classrooms.find_by(id: classroom_id.to_i) if !!classroom_id
    end
  end
end
