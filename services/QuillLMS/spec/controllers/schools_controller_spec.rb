require 'rails_helper'

describe SchoolsController, type: :controller do
  render_views

  before do
    @school1 = School.create(
      zipcode: '60657',
      name: "Josh's Finishing School"
    )
    @school2 = School.create(
      zipcode: '11221',
      name: 'Max Academy'
    )
  end

  it 'fetches schools based on zipcode' do
    get :index, search: '60657', format: 'json'

    expect(response.status).to eq(200)

    json = JSON.parse(response.body)
    expect(json['data'].first['id']).to eq(@school1.id)
  end

  it 'fetches schools based on text string' do
    get :index, search: 'Max A', format: 'json'

    expect(response.status).to eq(200)

    json = JSON.parse(response.body)
    expect(json['data'].first['id']).to eq(@school2.id)
  end

  describe '#select_school' do
    let(:user) { create(:user) }
    let(:school_user) { create(:school_user, user: user) }

    before do
      allow(controller).to receive(:current_user) { user }
    end

    it 'should fire up the sync sales contact worker' do
      expect(SyncSalesContactWorker).to receive(:perform_async)
      put :select_school, school_id_or_type: @school1.id, format: :json
    end
  end

end
