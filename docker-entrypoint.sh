#!/usr/bin/env sh

tsx ./config/_cli_.ts

nginx -g "daemon off;"
