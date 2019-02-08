class Cms::UsersController < Cms::CmsController
  before_filter :signed_in!
  before_action :set_flags, only: [:edit, :new, :new_with_school ]
  before_action :set_user, only: [:show, :edit, :show_json, :update, :destroy, :edit_subscription, :new_subscription, :complete_sales_stage]
  before_action :set_search_inputs, only: [:index, :search]
  before_action :get_subscription_data, only: [:new_subscription, :edit_subscription]
  before_action :filter_zeroes_from_checkboxes, only: [:update, :create, :create_with_school]

  USERS_PER_PAGE = 30.0

  def index
    @user_search_query = {sort: 'last_sign_in', sort_direction: 'desc'}
    @user_search_query_results = []
    @user_flags = User::VALID_FLAGS
    @number_of_pages = 0
  end

  def search
    user_search_query = user_query_params
    user_search_query_results = user_query(user_query_params)
    user_search_query_results = user_search_query_results ? user_search_query_results : []
    number_of_pages = (number_of_users_matched / USERS_PER_PAGE).ceil
    render json: {numberOfPages: number_of_pages, userSearchQueryResults: user_search_query_results, userSearchQuery: user_search_query}
  end

  def new
    @user = User.new
  end

  def new_with_school
    @user = User.new
    @with_school = true
    @school = School.find(school_id_param)
  end

  def create_with_school
    @user = User.new(user_params)
    if @user.save! && !!SchoolsUsers.create(school_id: school_id_param, user: @user)
      SyncSalesContactWorker.perform_async(@user.id)
      redirect_to cms_school_path(school_id_param)
    else
      flash[:error] = 'Did not save.'
      redirect_to :back
    end
  end

  def show
    # everything is set as props from @user in the view
  end

  def show_json
    render json: @user.generate_teacher_account_info
  end

  def create
    @user = User.new(user_params)
    if @user.save
      SyncSalesContactWorker.perform_async(@user.id)
      redirect_to cms_users_path
    else
      flash[:error] = 'Did not save.'
      redirect_to :back
    end
  end

  def sign_in
    session[:staff_id] = current_user.id
    super(User.find(params[:id]))
    redirect_to profile_path
  end

  def make_admin
    admin = SchoolsAdmins.new
    admin.school_id = params[:school_id]
    admin.user_id = params[:user_id]
    flash[:error] = 'Something went wrong.' unless admin.save
    redirect_to :back
  end

  def remove_admin
    admin = SchoolsAdmins.find_by(user_id: params[:user_id], school_id: params[:school_id])
    flash[:error] = 'Something went wrong.' unless admin.destroy
    flash[:success] = 'Success! 🎉'
    redirect_to :back
  end

  def edit
  end

  def edit_subscription
    @subscription = @user.subscription
  end

  def new_subscription
    @subscription = Subscription.new
  end

  def update
    if @user.update_attributes(user_params)
      redirect_to cms_users_path, notice: 'User was successfully updated.'
    else
      flash[:error] = 'Did not save.'
      render action: 'edit'
    end
  end

  def clear_data
    User.find(params[:id]).clear_data
    redirect_to cms_users_path
  end

  def destroy
    @user.destroy
  end

  def complete_sales_stage
    success = UpdateSalesContact
      .new(@user.id, params[:stage_number], current_user).call

    if success == true
      flash[:success] = 'Stage marked completed'
    else
      flash[:error] = 'Something went wrong'
    end
    redirect_to cms_user_path(@user.id)
  end


protected

  def set_flags
    @valid_flags = User::VALID_FLAGS
  end

  def set_user
    @user = User
      .includes(sales_contact: { stages: [:user, :sales_stage_type] })
      .order('sales_stage_types.order ASC')
      .find(params[:id])
  end

  def school_id_param
    params[:school_id].to_i
  end

  def user_params
    params.require(:user).permit([:name, :email, :username, :title, :role, :classcode, :password, :password_confirmation, :flags =>[]] + default_params
    )
  end

  def user_query_params
    params.permit(@text_search_inputs.map(&:to_sym) + default_params + [:page, :user_role, :user_flag, :sort, :sort_direction, :user_premium_status])
  end

  def user_query(params)
    # This should return an array of hashes that look like this:
    # [
    #   {
    #     name: 'first last',
    #     email: 'example@example.com',
    #     role: 'staff',
    #     premium: 'N/A',
    #     last_sign_in: 'Sep 19, 2017',
    #     school: 'not listed',
    #     school_id: 9,
    #     id: 19,
    #   }
    # ]

    # NOTE: IF YOU CHANGE THIS QUERY'S CONDITIONS, PLEASE BE SURE TO
    # ADJUST THE PAGINATION QUERY STRING AS WELL.
    #
    ActiveRecord::Base.connection.execute("
      SELECT
      	users.name AS name,
      	users.email AS email,
      	users.role AS role,
      	subscriptions.account_type AS subscription,
      	TO_CHAR(users.last_sign_in, 'Mon DD, YYYY') AS last_sign_in,
        schools.name AS school,
        schools.id AS school_id,
      	users.id AS id
      FROM users
      LEFT JOIN schools_users ON users.id = schools_users.user_id
      LEFT JOIN schools ON schools_users.school_id = schools.id
      LEFT JOIN user_subscriptions ON users.id = user_subscriptions.user_id
      AND user_subscriptions.created_at = (SELECT MAX(user_subscriptions.created_at) FROM user_subscriptions WHERE user_subscriptions.user_id = users.id)
      LEFT JOIN subscriptions ON user_subscriptions.subscription_id = subscriptions.id
      #{where_query_string_builder}
      #{order_by_query_string}
      #{pagination_query_string}
    ").to_a
  end

  def where_query_string_builder
    not_temporary = "users.role != 'temporary'"
    conditions = [not_temporary]
    @all_search_inputs.each do |param|
      param_value = user_query_params[param]
      if param_value && !param_value.empty?
        conditions << where_query_string_clause_for(param, param_value)
      end
    end
    "WHERE #{conditions.reject(&:nil?).join(' AND ')}"
  end

  def where_query_string_clause_for(param, param_value)
    # Potential params by which to search:
    # User name: users.name
    # User role: users.role
    # User username: users.username
    # User email: users.email
    # User IP: users.ip_address
    # School name: schools.name
    # User flag: user.flags
    # Premium status: subscriptions.account_type
    sanitized_fuzzy_param_value = ActiveRecord::Base.sanitize('%' + param_value + '%')
    sanitized_param_value = ActiveRecord::Base.sanitize(param_value)
    # sanitized_and_joined_param_value = ActiveRecord::Base.sanitize(param_value.join('\',\''))

    case param
    when 'user_name'
      "users.name ILIKE #{(sanitized_fuzzy_param_value)}"
    when 'user_role'
      "users.role = #{(sanitized_param_value)}"
    when 'user_username'
      "users.username ILIKE #{(sanitized_fuzzy_param_value)}"
    when 'user_email'
      "users.email ILIKE #{(sanitized_fuzzy_param_value)}"
    when 'user_flag'
      "#{(sanitized_param_value)} = ANY (users.flags::text[])"
    when 'user_ip'
      "users.ip_address = #{(sanitized_param_value)}"
    when 'school_name'
      "schools.name ILIKE #{(sanitized_fuzzy_param_value)}"
    when 'user_premium_status'
      "subscriptions.account_type IN (#{sanitized_param_value})"
    else
      nil
    end
  end

  def pagination_query_string
    page = [user_query_params[:page].to_i - 1, 0].max
    "LIMIT #{USERS_PER_PAGE} OFFSET #{USERS_PER_PAGE * page}"
  end

  def order_by_query_string
    sort = user_query_params[:sort]
    sort_direction = user_query_params[:sort_direction]
    if sort && sort_direction && sort != 'undefined' && sort_direction != 'undefined'
      "ORDER BY #{sort} #{sort_direction}"
    else
      "ORDER BY last_sign_in DESC"
    end
  end

  def number_of_users_matched
    ActiveRecord::Base.connection.execute("
      SELECT
      	COUNT(users.id) AS count
      FROM users
      LEFT JOIN schools_users ON users.id = schools_users.user_id
      LEFT JOIN schools ON schools_users.school_id = schools.id
      LEFT JOIN user_subscriptions ON users.id = user_subscriptions.user_id
      LEFT JOIN subscriptions ON user_subscriptions.subscription_id = subscriptions.id
      #{where_query_string_builder}
    ").to_a[0]['count'].to_i
  end

  def set_search_inputs
    @text_search_inputs = ['user_name', 'user_username', 'user_email', 'user_ip', 'school_name']
    @school_premium_types = Subscription.account_types
    @user_role_types = User::ROLES
    @all_search_inputs = @text_search_inputs + ['user_premium_status', 'user_role', 'page', 'user_flag']
  end

  def filter_zeroes_from_checkboxes
    # checkboxes pass back '0' when unchecked -- we only want the attributes that are checked
    params[:user][:flags] = user_params[:flags] - ["0"]
  end

  def subscription_params
    params.permit([:id, :payment_method, :payment_amount, :purchaser_email, :premium_status, :start_date => [:day, :month, :year], :expiration_date => [:day, :month, :year]] + default_params)
  end
end
