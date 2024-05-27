#!/bin/sh

# Read variables from the 'variables.vars' file and dynamically generate sed command
sed_command=""
cat /variables.vars
while IFS='=' read -r name value; do
  sed_command="$sed_command s/$name/$value/g;"
done < /variables.vars


echo "Sed = $sed_command"

# Replace occurrences of variables with their corresponding values in all JavaScript files
find /usr/share/nginx/html/static/js -type f -name '*.js' -exec sed -i "$sed_command" {} +
