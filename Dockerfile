FROM ruby:2.3.1 
MAINTAINER max@quill.org 

# Replace shell with bash so we can source files
RUN rm /bin/sh && ln -s /bin/bash /bin/sh

# Set debconf to run non-interactively
RUN echo 'debconf debconf/frontend select Noninteractive' | debconf-set-selections

# Compatibility fix for node on ubuntu
RUN ln -s /usr/bin/nodejs /usr/bin/node;

# Install apt based dependencies required to run Rails as 
# well as RubyGems. As the Ruby image itself is based on a 
# Debian image, we use apt-get to install those.
RUN apt-get update -qq && apt-get install -y -q --no-install-recommends \
apt-transport-https \
        build-essential \
        libpq-dev \
        postgresql-client \
        nodejs \
        curl \
        ca-certificates \
        curl \
        git \
        libssl-dev \
        python \
        rsync \
        software-properties-common \
        wget \
    && rm -rf /var/lib/apt/lists/*

# Node and NVM installation and configuration ##########################
ENV NVM_VERSION v0.33.8
ENV NODE_VERSION v7.5.0
ENV NVM_DIR="$HOME/.nvm"

# Install nvm, node, npm
RUN curl https://raw.githubusercontent.com/creationix/nvm/${NVM_VERSION}/install.sh | bash \
    && . $NVM_DIR/nvm.sh npm --version \
    && nvm install $NODE_VERSION \
    && nvm alias default $NODE_VERSION \
    && nvm use default \
    && npm install -g npm


# Add node and npm to path so the commands are available
ENV NODE_PATH $NVM_DIR/$NODE_VERSION/lib/node_modules
ENV PATH      $NVM_DIR/$NODE_VERSION/bin:$PATH


#RUN ["npm", "-v"]
#RUN ["nvm", "-v"]

# Configure the main working directory. This is the base 
# directory used in any further RUN, COPY, and ENTRYPOINT 
# commands
ENV RAILS_ROOT /app
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
#CMD [ "foreman", "start", "-f", "Procfile.static"]
ENTRYPOINT ["/usr/bin/tail", "-f", "/dev/null"]
