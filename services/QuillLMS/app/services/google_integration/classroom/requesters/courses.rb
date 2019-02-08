module GoogleIntegration::Classroom::Requesters::Courses

  def self.run(client)
    service = client.discovered_api('classroom', 'v1')
    google_api_call = client.execute(api_method: service.courses.list)
    google_api_call
  end
end
