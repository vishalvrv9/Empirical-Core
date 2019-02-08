require 'rails_helper'

describe Cms::SchoolsController do
  it { should use_before_filter :signed_in! }
  it { should use_before_action :text_search_inputs }
  it { should use_before_action :set_school }
  it { should use_before_action :get_subscription_data }

  let(:user) { create(:staff) }

  before do
    allow(controller).to receive(:current_user) { user }
  end

  describe "SCHOOLS_PER_PAGE" do
    it 'should have the correct value' do
      expect(described_class::SCHOOLS_PER_PAGE).to eq 30.0
    end
  end

  describe '#index' do
    let(:school_hash) { {school_zip: "1234", number_teachers: 23, number_admins: 5, frl: "frl"} }

    before do
      allow(ActiveRecord::Base.connection).to receive(:execute) { [school_hash] }
    end

    it 'should allows staff memeber to view and search through school' do
      get :index
      expect(assigns(:school_search_query)).to eq({'search_schools_with_zero_teachers' => true})
      expect(assigns(:school_search_query_results)).to eq [school_hash]
      expect(assigns(:number_of_pages)).to eq 0
    end
  end

  describe '#search' do
    let(:school_hash) { {school_zip: 1234, number_teachers: 23, number_admins: 5, frl: "frl"} }

    before do
      allow(ActiveRecord::Base.connection).to receive(:execute).and_return([school_hash])
    end

    it 'should search for the school and give the results' do
      get :search
      expect(response.body).to eq({numberOfPages: 0, schoolSearchQueryResults: [school_hash]}.to_json)
    end
  end

  describe '#show' do
    let!(:school) { create(:school) }

    before do
      allow_any_instance_of(Cms::TeacherSearchQuery).to receive(:run) { "teacher data" }
    end

    it 'should assignt the correct values' do
      get :show, id: school.id
      expect(assigns(:subscription)).to eq school.subscription
      expect(assigns(:school_subscription_info)).to eq({
       'School Premium Type' => school&.subscription&.account_type,
       'Expiration' => school&.subscription&.expiration&.strftime('%b %d, %Y')
      })
      expect(assigns(:school)).to eq({
       'Name' => school.name,
       'City' => school.city || school.mail_city,
       'State' => school.state || school.mail_state,
       'ZIP' => school.zipcode || school.mail_zipcode,
       'District' => school.leanm,
       'Free and Reduced Price Lunch' => "#{school.free_lunches}%",
       'NCES ID' => school.nces_id,
       'PPIN' => school.ppin
      })
      expect(assigns(:teacher_data)).to eq "teacher data"
      expect(assigns(:admins)).to eq(SchoolsAdmins.includes(:user).where(school_id: school.id).map do |admin|
        {
            name: admin.user.name,
            email: admin.user.email,
            school_id: admin.school_id,
            user_id: admin.user_id
        }
        end
      )
    end
  end

  describe '#edit' do
    let!(:school) { create(:school) }

    it 'should assign the school and editable attributes' do
      get :edit, id: school.id
      expect(assigns(:school)).to eq school
      expect(assigns(:editable_attributes)).to eq({
          'School Name' => :name,
          'School City' => :city,
          'School State' => :state,
          'School ZIP' => :zipcode,
          'District Name' => :leanm,
          'FRP Lunch' => :free_lunches
      })
    end
  end

  describe '#update' do
    let!(:school) { create(:school) }

    it 'should update the given school' do
      post :update, id: school.id, school: { id: school.id, name: "test name" }
      expect(school.reload.name).to eq "test name"
      expect(response).to redirect_to cms_school_path(school.id)
    end
  end

  describe '#edit_subscription' do
    let!(:school) { create(:school) }

    it 'should assing the subscription' do
      get :edit_subscription, id: school.id
      expect(assigns(:subscription)).to eq school.subscription
    end
  end

  describe '#create' do
    it 'should create the school with the given params and kick off sync sales account worker' do
      expect(SyncSalesAccountWorker).to receive(:perform_async)
      post :create, school: {
          name: "test",
          city: "test city",
          state: "test state",
          zipcode: "1100",
          leanm: "lean",
          free_lunches: 2
      }
      expect(School.last.name).to eq "test"
      expect(School.last.city).to eq "test city"
      expect(School.last.state).to eq "test state"
      expect(School.last.zipcode).to eq "1100"
      expect(School.last.leanm).to eq "lean"
      expect(School.last.free_lunches).to eq 2
      expect(response).to redirect_to cms_school_path(School.last.id)
    end
  end

  describe '#add_by_admin' do
    let!(:another_user) { create(:user) }
    let!(:school) { create(:school) }

    it 'should create the schools admin and redirect to cms school path' do
      post :add_admin_by_email, email_address: another_user.email, id: school.id
      expect(flash[:success]).to eq "Yay! It worked! 🎉"
      expect(response).to redirect_to cms_school_path(school.id)
      expect(SchoolsAdmins.last.user).to eq another_user
      expect(SchoolsAdmins.last.school).to eq school
    end
  end
end