# README

1. - clone the repo
1. - gem install bundler
1. - bundle install
1. - docker-compose up
1. - rake db:create
1. - rake db:migrate
1. - rake responses_csv:import (get responses from donald)
1. - brew install elasticsearch
1. - brew services start elasticsearch
1. - rails c
1. - `Response.__elasticsearch__.create_index!`
1. - `Response.__elasticsearch__.import`
1. - set up redis with ```redis-server --port 6400```
1. - rails s
1. - go to [localhost:3100](http://localhost:3100)
