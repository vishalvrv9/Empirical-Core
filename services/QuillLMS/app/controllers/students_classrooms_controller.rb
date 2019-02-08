class StudentsClassroomsController < ApplicationController
  skip_before_action :verify_authenticity_token

  def create
    if current_user
      @user = current_user
      classcode = params[:classcode].downcase.gsub(/\s+/, "")
      begin
        classroom = Classroom.where(code: classcode).first
        Associators::StudentsToClassrooms.run(@user, classroom)
        JoinClassroomWorker.perform_async(@user.id)
      rescue NoMethodError => exception
        if Classroom.unscoped.where(code: classcode).first.nil?
          InvalidClasscodeWorker.perform_async(@user.id, params[:classcode], classcode)
          render status: 404, json: {error: "No such classcode"}, text: "No such classcode"
        else
          render status: 400, json: {error: "Class is archived"}, text: "Class is archived"
        end
      else
        render json: classroom.attributes
      end
    else
      render status: 403, json: {error: "Student not logged in."}, text: "Student not logged in."
    end
  end

  def hide
    sc = current_user.students_classrooms.find(params[:id])
    sc.update(visible: false)
    render json: sc
  end

  def unhide
    sc = StudentsClassrooms.unscoped.find_by(student_id: current_user.id, id: params[:id], visible: false)
    sc.update(visible: true)
    render json: sc
  end

  def teacher_hide
    classroom_teacher!(params[:classroom_id])
    row = StudentsClassrooms.find_by(student_id: params[:student_id], classroom_id: params[:classroom_id])
    row.update(visible: false)
    redirect_to teachers_classrooms_path
  end

  def add_classroom
    @js_file = 'student'
    render :add_classroom
  end

  def classroom_manager
    render "student_teacher_shared/archived_classroom_manager"
  end

  def classroom_manager_data
    begin
    active = current_user.students_classrooms
      .includes(classroom: :teacher)
      .map(&:archived_classrooms_manager)
    inactive = StudentsClassrooms.unscoped
      .where(student_id: current_user.id, visible: false)
      .includes(classroom: :teacher)
      .map(&:archived_classrooms_manager)
    rescue NoMethodError => exception
      render json: {error: "No classrooms yet!"}, status: 400
    else
      render json: {active: active, inactive: inactive}
    end
  end
end
