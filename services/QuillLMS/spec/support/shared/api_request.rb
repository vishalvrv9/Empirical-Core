require 'active_support/inflector'

shared_context "calling the api" do

  let(:application) { Doorkeeper::Application.create!(name: "MyApp", redirect_uri: "https://app.com") }
  let(:user) { create(:user) }
  let(:token) { Doorkeeper::AccessToken.create! application_id: application.id, resource_owner_id: user.id }

  before do
    allow(controller).to receive(:doorkeeper_token) { token }
  end
end

shared_examples "a simple api request" do
  let(:lwc_model_name) {controller.controller_name.classify.underscore}

  before do
    create_list(lwc_model_name.to_sym, 10)
    get :index
  end

  it 'sends a list' do
    expect(response).to be_success
    json = JSON.parse(response.body)
    expect(json[lwc_model_name.pluralize].length).to eq(10)
  end

  it 'includes only uid and name' do
    json = JSON.parse(response.body)
    hash = json[lwc_model_name.pluralize][0]
    expect(hash.keys).to match_array(['uid', 'name'])
  end
end



shared_examples "an api request" do
  context "has standard response items" do

    describe "root nodes" do
      it "has a meta attribute" do
        expect(@parsed_body.keys).to include('meta')
      end

      context "meta node" do
        before(:each) do
          @meta = @parsed_body['meta']
        end

        it "has a status attribute" do
          expect(@meta.keys).to include('status')
        end

        it "has a message attribute" do
          expect(@meta.keys).to include('message')
        end

        it "has a errors attribute" do
          expect(@meta.keys).to include('errors')
        end

      end

    end
  end
end
