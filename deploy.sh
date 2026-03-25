#!/bin/bash
set -eo pipefail

SERVER="https://api.ul-pca-pr-ul01.ulaval.ca:6443"
PROJECT="sse-divers-pr"
APP="directives-ia"

BOLD="\033[1m"
GREEN="\033[0;32m"
CYAN="\033[0;36m"
RED="\033[0;31m"
YELLOW="\033[0;33m"
RESET="\033[0m"

step() { echo -e "\n${CYAN}${BOLD}▸ $1${RESET}"; }
success() { echo -e "${GREEN}✔ $1${RESET}"; }
error() { echo -e "${RED}✖ $1${RESET}"; exit 1; }

while [[ $# -gt 0 ]]; do
  case $1 in
    --token) TOKEN="$2"; shift 2 ;;
    *) error "Unknown option: $1" ;;
  esac
done

if [ -z "$TOKEN" ]; then
  echo -e "${YELLOW}Usage: $0 --token <openshift-token>${RESET}"
  exit 1
fi

command -v oc >/dev/null || error "'oc' CLI not found"
command -v git >/dev/null || error "'git' not found"

echo -e "\n${BOLD}Deploying ${APP}${RESET}"
echo -e "   Server:  ${SERVER}"
echo -e "   Project: ${PROJECT}\n"

step "Logging into OpenShift..."
oc login --token="$TOKEN" --server="$SERVER"
success "Logged in"

step "Switching to project ${PROJECT}..."
oc project "$PROJECT"
success "Project set"

step "Pulling latest changes..."
git pull
success "Up to date"

step "Starting build..."
oc start-build "$APP" --from-dir=. --wait
success "Build complete"

echo -e "\n${GREEN}${BOLD}Deployment finished successfully!${RESET}\n"
