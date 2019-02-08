class StudentsController < ApplicationController
  include QuillAuthentication

  before_filter :authorize!, except: [:student_demo]

  def index
    @current_user = current_user
    @js_file = 'student'
    if params["joined"] == 'success' && params["classroom"]
      classroom = Classroom.find(params["classroom"])
      flash.now["join-class-notification"] = "You have joined #{classroom.name} 🎉🎊"
    end
  end

  def account_settings
    @current_user = current_user
    @js_file = 'student'
  end

  def student_demo
    @user = User.find_by_email 'maya_angelou_demo@quill.org'
    if @user.nil?
      Demo::ReportDemoDestroyer.destroy_demo(nil)
      Demo::ReportDemoCreator.create_demo(nil)
      redirect_to "/student_demo"
    else
      sign_in @user
      redirect_to '/profile'
    end
  end

  def update_email
    if current_user.update(email: params[:email])
      render json: {status: 200}
    else
      render json: {errors: 'Please enter a valid email address.'}, status: 422
    end
  end

  private

  def authorize!
    auth_failed unless current_user
  end

end
