FROM ruby:2.3.1 
MAINTAINER max@quill.org 

# Install apt based dependencies required to run Rails as 
# well as RubyGems. As the Ruby image itself is based on a 
# Debian image, we use apt-get to install those.
RUN apt-get update -qq && apt-get install -y build-essential libpq-dev \
  postgresql-client nodejs


# Define where our application will live inside the image
ENV RAILS_ROOT /app

# Create application home. App server will need the pids dir so just create everything in one shot
RUN mkdir -p $RAILS_ROOT/tmp/pids

# Configure the main working directory. This is the base 
# directory used in any further RUN, COPY, and ENTRYPOINT 
# commands
WORKDIR $RAILS_ROOT

# Copy the Gemfile as well as the Gemfile.lock and install 
# the RubyGems. This is a separate step so the dependencies 
# will be cached unless changes to one of those two files 
# are made.
COPY Gemfile Gemfile
COPY Gemfile.lock Gemfile.lock

# Prevent bundler warnings; ensure that the bundler version executed is >= that which cre
RUN gem install bundler

# Finish establishing our Ruby enviornment
RUN bundle install

# Copy the rails application into place
COPY . ./

# Expose port 3000 to the Docker host, so we can access it 
# from the outside.
EXPOSE 3000

# The main command to run when the container starts. Also 
# tell the Rails dev server to bind to all interfaces by 
# default.
CMD ["foreman", "start", "-f", "Procfile.static"]
