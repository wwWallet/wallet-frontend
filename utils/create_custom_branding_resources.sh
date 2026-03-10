#!/bin/sh
set -e

# Available options from environment variables:
# BRANDING_OUTPUT_BASE_PATH: Branding directory in which "custom/*" should be created (required)
# BRANDING_THEME_JSON: JSON formatted theme configuration
# BRANDING_FAVICON: Data URL with favicon ("image/vnd.microsoft.icon")
# BRANDING_LOGO_LIGHT: Data URL with logo light ("image/png" or "image/svg")
# BRANDING_LOGO_DARK: Data URL with logo dark ("image/png" or "image/svg")

# -------------------------------------------------------------------------------------------------
log() {
	LEVEL="${1}"
	MESSAGE="${2}"

	echo "${LEVEL}: ${MESSAGE}"

	if [ "${LEVEL}" = "ERROR" ]; then
		exit 1
	fi
}

get_image_type() {
	printf '%s' "${1}" | grep data:image/ | cut -d / -f 2 | cut -d ';' -f 1
}

get_data() {
	printf '%s' "${1}" | cut -d , -f 2- | base64 -d
}

# -------------------------------------------------------------------------------------------------
if ! [ -d "${BRANDING_OUTPUT_BASE_PATH}" ]; then
	log ERROR "Variable \"BRANDING_OUTPUT_BASE_PATH\" does not contain an existing directory"
fi

log INFO "Creating custom branding directories in \"${BRANDING_OUTPUT_BASE_PATH}\""
OUTPUT_PATH="${BRANDING_OUTPUT_BASE_PATH}/custom"
mkdir -p "${OUTPUT_PATH}/logo"

# -------------------------------------------------------------------------------------------------
if [ -n "${BRANDING_THEME_JSON}" ]; then
	log INFO "Processing custom theme JSON"

	log INFO "Writing custom theme JSON to output file"
	echo "${BRANDING_THEME_JSON}" > "${OUTPUT_PATH}/theme.json"
fi

# -------------------------------------------------------------------------------------------------
if [ -n "${BRANDING_FAVICON}" ]; then
	log INFO "Processing custom favicon"

	log INFO "Validating favicon image type from data URL"
	if [ "$(get_image_type "${BRANDING_FAVICON}")" != "vnd.microsoft.icon" ]; then
		log ERROR "Invalid favicon image type in data URL"
	fi

	log INFO "Writing favicon data to output file"
	get_data "${BRANDING_FAVICON}" > "${OUTPUT_PATH}/favicon.ico"
fi

# -------------------------------------------------------------------------------------------------
if [ -n "${BRANDING_LOGO_LIGHT}" ]; then
	log INFO "Processing custom logo light"

	log INFO "Validating logo light image type from data URL"
	LOGO_LIGHT_IMAGE_TYPE="$(get_image_type "${BRANDING_LOGO_LIGHT}")"
	if [ "${LOGO_LIGHT_IMAGE_TYPE}" != "png" ] && [ "${LOGO_LIGHT_IMAGE_TYPE}" != "svg" ]; then
		log ERROR "Invalid logo light image type in data URL"
	fi

	log INFO "Writing logo light data to output file"
	get_data "${BRANDING_LOGO_LIGHT}" > "${OUTPUT_PATH}/logo/logo_light.${LOGO_LIGHT_IMAGE_TYPE}"
fi

# -------------------------------------------------------------------------------------------------
if [ -n "${BRANDING_LOGO_DARK}" ]; then
	log INFO "Processing custom logo dark"

	log INFO "Validating logo dark image type from data URL"
	LOGO_DARK_IMAGE_TYPE="$(get_image_type "${BRANDING_LOGO_DARK}")"
	if [ "${LOGO_DARK_IMAGE_TYPE}" != "png" ] && [ "${LOGO_DARK_IMAGE_TYPE}" != "svg" ]; then
		log ERROR "Invalid logo dark image type in data URL"
	fi

	log INFO "Writing logo dark data to output file"
	get_data "${BRANDING_LOGO_DARK}" > "${OUTPUT_PATH}/logo/logo_dark.${LOGO_DARK_IMAGE_TYPE}"
fi

# -------------------------------------------------------------------------------------------------
log INFO "Successfully applied custom branding"
