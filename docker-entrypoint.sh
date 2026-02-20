#!/usr/bin/env sh

tsx ./config/_cli_.ts --dest /usr/share/nginx/html

nginx -g "daemon off;"
