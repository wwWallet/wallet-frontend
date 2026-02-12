#!/usr/bin/env sh

tsx ./config/_cli_.ts --dest /usr/share/nginx/html \
	--branding-custom-data ${BRANDING_CUSTOM_DATA:-}

nginx -g "daemon off;"
