#!/bin/bash

################################################################################
# 🚀 Webprojekte-Verkauf-System - Smart Installer
# Automatische Installation auf Debian/Ubuntu VServer
# Autor: Tech-lab-sys
# Version: 1.0.0
################################################################################

set -e  # Exit bei Fehler

# Farben für Output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging Funktionen
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Banner
print_banner() {
    log_info "🚀 Webprojekte-Verkaufs-System - Smart Installer v2.0"
}
