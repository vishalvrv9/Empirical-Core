require 'rails_helper'

describe SubscriptionsController do
  let!(:user) { create(:teacher, :premium) }

  before do
    allow(controller).to receive(:current_user) { user }
  end

  describe '#index' do
    it 'should set the instance variables' do
      get :index
      expect(assigns(:subscriptions)).to eq user.subscriptions
      expect(assigns(:premium_credits)).to eq user.credit_transactions
      expect(assigns(:school_subscription_types)).to eq Subscription::OFFICIAL_SCHOOL_TYPES
      expect(assigns(:last_four)).to eq user.last_four
      expect(assigns(:trial_types)).to eq Subscription::TRIAL_TYPES
    end
  end

  describe "#purchaser_name" do
    context 'when subscription is not associated with current user' do
      let(:another_user) { create(:user) }

      before do
        allow_any_instance_of(Subscription).to receive(:users) { [another_user] }
        user.subscriptions.first.update(purchaser: another_user)
      end

      it 'should sign the user out' do
        get :purchaser_name, id: user.subscriptions.first.id
        expect(session[:attempted_path]).to eq request.fullpath
        expect(response).to redirect_to new_session_path
      end
    end

    context 'when subscription is associated with current user' do
      it 'should render the purchaser name' do
        user.subscriptions.first.update(purchaser: user)
        get :purchaser_name, id: user.subscriptions.first.id
        expect(response.body).to eq({name: user.name}.to_json)
      end
    end
  end

  describe '#create' do
    it 'should create the subscription' do
      post :create, subscription: { purchaser_id: user.id, expiration: Date.today+10.days, account_type: "some_type", recurring: false }
      expect(user.reload.subscriptions.last.account_type).to eq "some_type"
      expect(user.reload.subscriptions.last.recurring).to eq false
    end
  end

  describe '#update' do
    it 'should update the given subscription' do
      post :update, id: user.subscriptions.first, subscription: { account_type: "some_type" }
      expect(user.reload.subscriptions.first.account_type).to eq "some_type"
    end
  end

  describe '#destroy' do
    it 'should destroy the given subscription' do
      subscription = user.subscriptions.first
      delete :destroy, id: subscription.id
      expect{ Subscription.find(subscription.id) }.to raise_exception ActiveRecord::RecordNotFound
    end
  end
end