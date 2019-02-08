class Cms::AnnouncementsController < Cms::CmsController
  before_filter :signed_in!

  def index
    @announcements = Announcement.all
  end

  def create
    if Announcement.create(announcement_params)
      flash[:success] = 'Announcement created successfully!'
      return redirect_to cms_announcements_path
    else
      flash[:error] = 'Rut roh. Something has gone awry! 😭'
      return redirect_to :back
    end
  end

  def new
    @announcement = Announcement.new
  end

  def edit
    @announcement = Announcement.find(params[:id])
    @announcement[:start] = @announcement[:start].in_time_zone(Announcement::TIME_ZONE)
    @announcement[:end] = @announcement[:end].in_time_zone(Announcement::TIME_ZONE)
  end

  def update
    Announcement.find(params[:id]).update(announcement_params)
    redirect_to cms_announcements_path
  end

  private
  def announcement_params
    params.require(:announcement).permit(:announcement_type, :link, :text, :start, :end)
  end
end
