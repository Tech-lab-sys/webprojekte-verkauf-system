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
    echo -e "${GREEN}"
    cat << "EOF"
╦ ╦┌─┐┌┐ ┌─┐┬─┐┌─┐ ┬┌─┐┬┌─┌┬┐┌─┐   ╦  ╦┌─┐┬─┐┬┌─┌─┐┬ ┬┌─┐
║║║├┤ ├┴┐├─┘├┬┘│ │ │├┤ ├┴┐ │ ├┤ ───╚╗╔╝├┤ ├┬┘├┴┐├─┤│ │├┤ 
╚╩╝└─┘└─┘┴  ┴└─└─┘└┘└─┘┴ ┴ ┴ └─┘    ╚╝ └─┘┴└─┴ ┴┴ ┴└─┘└  
                Smart Installer v1.0.0
EOF
    echo -e "${NC}"
}

# Systeminfo prüfen
check_system() {
    log_info "Prüfe Systemvoraussetzungen..."
    
    # OS Detection
    if [ -f /etc/os-release ]; then
        . /etc/os-release
        OS=$ID
        VER=$VERSION_ID
    else
        log_error "OS konnte nicht erkannt werden!"
        exit 1
    fi
    
    log_info "Erkanntes System: $OS $VER"
    
    if [[ "$OS" != "ubuntu" && "$OS" != "debian" ]]; then
        log_error "Nur Ubuntu und Debian werden unterstützt!"
        exit 1
    fi
    
    # Root Check
    if [[ $EUID -eq 0 ]]; then
        log_warning "Läuft als Root - Deploy-User wird erstellt"
        IS_ROOT=true
    else
        log_info "Läuft als Non-Root User"
        IS_ROOT=false
    fi
    
    # RAM Check
    TOTAL_RAM=$(free -m | awk '/^Mem:/{print $2}')
    if [ "$TOTAL_RAM" -lt 2000 ]; then
        log_warning "Weniger als 2GB RAM verfügbar. Performance könnte leiden."
    fi
    
    log_success "System-Check abgeschlossen"
}

# System Updates
update_system() {
    log_info "System wird aktualisiert..."
    
    if [ "$IS_ROOT" = true ]; then
        apt update -qq
        apt upgrade -y -qq
    else
        sudo apt update -qq
        sudo apt upgrade -y -qq
    fi
    
    log_success "System aktualisiert"
}

# Basis-Tools installieren
install_essentials() {
    log_info "Installiere Basis-Tools..."
    
    local PACKAGES="curl wget git build-essential ufw fail2ban htop nano"
    
    if [ "$IS_ROOT" = true ]; then
        apt install -y $PACKAGES > /dev/null 2>&1
    else
        sudo apt install -y $PACKAGES > /dev/null 2>&1
    fi
    
    log_success "Basis-Tools installiert"
}

# Firewall konfigurieren
setup_firewall() {
    log_info "Konfiguriere Firewall (UFW)..."
    
    if [ "$IS_ROOT" = true ]; then
        ufw --force enable
        ufw allow OpenSSH
        ufw allow 80/tcp
        ufw allow 443/tcp
    else
        sudo ufw --force enable
        sudo ufw allow OpenSSH
        sudo ufw allow 80/tcp
        sudo ufw allow 443/tcp
    fi
    
    log_success "Firewall konfiguriert"
}

# Deploy User erstellen
create_deploy_user() {
    if [ "$IS_ROOT" = true ]; then
        log_info "Erstelle Deploy-User..."
        
        if id "deploy" &>/dev/null; then
            log_warning "User 'deploy' existiert bereits"
        else
            adduser --disabled-password --gecos "" deploy
            usermod -aG sudo deploy
            log_success "Deploy-User erstellt"
        fi
    fi
}

# Node.js installieren
install_nodejs() {
    log_info "Installiere Node.js 20 LTS..."
    
    # NodeSource Repository
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash - > /dev/null 2>&1
    
    if [ "$IS_ROOT" = true ]; then
        apt install -y nodejs > /dev/null 2>&1
    else
        sudo apt install -y nodejs > /dev/null 2>&1
    fi
    
    # pnpm installieren
    npm install -g pnpm > /dev/null 2>&1
    
    NODE_VERSION=$(node --version)
    PNPM_VERSION=$(pnpm --version)
    
    log_success "Node.js $NODE_VERSION & pnpm $PNPM_VERSION installiert"
}

# PostgreSQL installieren
install_postgresql() {
    log_info "Installiere PostgreSQL..."
    
    if [ "$IS_ROOT" = true ]; then
        apt install -y postgresql postgresql-contrib > /dev/null 2>&1
        systemctl start postgresql
        systemctl enable postgresql
    else
        sudo apt install -y postgresql postgresql-contrib > /dev/null 2>&1
        sudo systemctl start postgresql
        sudo systemctl enable postgresql
    fi
    
    log_success "PostgreSQL installiert"
}

# Datenbank konfigurieren
setup_database() {
    log_info "Konfiguriere Datenbank..."
    
    # Generiere sicheres Passwort
    DB_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)
    
    # Datenbank erstellen
    if [ "$IS_ROOT" = true ]; then
        sudo -u postgres psql << EOF > /dev/null 2>&1
CREATE USER webprojekte WITH PASSWORD '$DB_PASSWORD';
CREATE DATABASE webprojekte OWNER webprojekte;
GRANT ALL PRIVILEGES ON DATABASE webprojekte TO webprojekte;
EOF
    else
        sudo -u postgres psql << EOF > /dev/null 2>&1
CREATE USER webprojekte WITH PASSWORD '$DB_PASSWORD';
CREATE DATABASE webprojekte OWNER webprojekte;
GRANT ALL PRIVILEGES ON DATABASE webprojekte TO webprojekte;
EOF
    fi
    
    # Speichere DB-Credentials
    echo "DATABASE_URL=\"postgresql://webprojekte:$DB_PASSWORD@localhost:5432/webprojekte\"" > /tmp/db_credentials.txt
    
    log_success "Datenbank konfiguriert"
    log_info "DB-Passwort: $DB_PASSWORD (gespeichert in /tmp/db_credentials.txt)"
}

# Nginx installieren
install_nginx() {
    log_info "Installiere Nginx..."
    
    if [ "$IS_ROOT" = true ]; then
        apt install -y nginx certbot python3-certbot-nginx > /dev/null 2>&1
        systemctl start nginx
        systemctl enable nginx
    else
        sudo apt install -y nginx certbot python3-certbot-nginx > /dev/null 2>&1
        sudo systemctl start nginx
        sudo systemctl enable nginx
    fi
    
    log_success "Nginx installiert"
}

# PM2 installieren
install_pm2() {
    log_info "Installiere PM2..."
    
    npm install -g pm2 > /dev/null 2>&1
    
    log_success "PM2 installiert"
}

# Application klonen
clone_application() {
    log_info "Klone Application von GitHub..."
    
    TARGET_DIR="/home/${USER}/webprojekte-verkauf-system"
    
    if [ -d "$TARGET_DIR" ]; then
        log_warning "Verzeichnis existiert bereits, überspringe Klonen"
    else
        git clone https://github.com/Tech-lab-sys/webprojekte-verkauf-system.git "$TARGET_DIR" > /dev/null 2>&1
        log_success "Application geklont nach $TARGET_DIR"
    fi
}

# Dependencies installieren
install_dependencies() {
    log_info "Installiere Application Dependencies..."
    
    TARGET_DIR="/home/${USER}/webprojekte-verkauf-system"
    cd "$TARGET_DIR"
    
    pnpm install > /dev/null 2>&1
    
    log_success "Dependencies installiert"
}

# .env Template erstellen
create_env_template() {
    log_info "Erstelle .env.local Template..."
    
    TARGET_DIR="/home/${USER}/webprojekte-verkauf-system"
    
    # Lese DB-Credentials
    DB_URL=$(cat /tmp/db_credentials.txt)
    
    cat > "$TARGET_DIR/.env.local" << EOF
# Datenbank
$DB_URL

# Stripe (KONFIGURIERE DIESE!)
STRIPE_SECRET_KEY="sk_test_DEIN_KEY_HIER"
STRIPE_WEBHOOK_SECRET="whsec_DEIN_SECRET_HIER"

# Perplexity AI (KONFIGURIERE DIESE!)
PERPLEXITY_API_KEY="pplx_DEIN_KEY_HIER"

# OpenAI (Fallback - Optional)
OPENAI_API_KEY="sk-DEIN_KEY_HIER"

# Email SMTP
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_SECURE="false"
SMTP_USER="deine-email@gmail.com"
SMTP_PASS="dein-app-passwort"

# Storage (Lokal auf VPS)
USE_S3_STORAGE="false"

# Application
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NODE_ENV="production"
PORT="3000"
EOF
    
    log_success ".env.local erstellt"
    log_warning "WICHTIG: Editiere .env.local und füge deine API Keys ein!"
}

# PM2 Ecosystem erstellen
create_pm2_config() {
    log_info "Erstelle PM2 Konfiguration..."
    
    TARGET_DIR="/home/${USER}/webprojekte-verkauf-system"
    
    cat > "$TARGET_DIR/ecosystem.config.js" << 'EOF'
module.exports = {
  apps: [{
    name: 'webprojekte-verkauf',
    script: 'npm',
    args: 'start',
    cwd: '/home/deploy/webprojekte-verkauf-system',
    instances: 2,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: '/home/deploy/logs/err.log',
    out_file: '/home/deploy/logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    max_memory_restart: '1G'
  }]
};
EOF
    
    # Logs Verzeichnis
    mkdir -p /home/${USER}/logs
    
    log_success "PM2 Config erstellt"
}

# Nginx Config erstellen
create_nginx_config() {
    log_info "Erstelle Nginx Konfiguration..."
    
    read -p "Domain eingeben (z.B. example.com): " DOMAIN
    
    if [ "$IS_ROOT" = true ]; then
        cat > /etc/nginx/sites-available/webprojekte << EOF
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;

    client_max_body_size 500M;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }
}
EOF
        
        ln -sf /etc/nginx/sites-available/webprojekte /etc/nginx/sites-enabled/
        rm -f /etc/nginx/sites-enabled/default
        nginx -t && systemctl reload nginx
        
        log_success "Nginx konfiguriert für $DOMAIN"
    else
        sudo bash -c "cat > /etc/nginx/sites-available/webprojekte << EOF
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;

    client_max_body_size 500M;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \\\$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \\\$host;
        proxy_cache_bypass \\\$http_upgrade;
    }
}
EOF"
        
        sudo ln -sf /etc/nginx/sites-available/webprojekte /etc/nginx/sites-enabled/
        sudo rm -f /etc/nginx/sites-enabled/default
        sudo nginx -t && sudo systemctl reload nginx
        
        log_success "Nginx konfiguriert für $DOMAIN"
    fi
}

# Abschluss-Informationen
print_summary() {
    echo ""
    cat << "EOF"
${GREEN}═══════════════════════════════════════════════════════════════════${NC}
${GREEN}✓ Installation erfolgreich abgeschlossen!${NC}
${GREEN}═══════════════════════════════════════════════════════════════════${NC}

${BLUE}📋 Installierte Komponenten:${NC}
  ✓ Node.js $(node -v)
  ✓ PostgreSQL
  ✓ Nginx Reverse Proxy
  ✓ PM2 Process Manager
  ✓ UFW Firewall

${BLUE}🌐 Zugriff:${NC}
  → https://$DOMAIN
  → http://$DOMAIN (Weiterleitung zu HTTPS)

${BLUE}📁 Installationspfad:${NC}
  → /home/deploy/webprojekte-verkauf-system

${BLUE}🔑 Datenbank-Credentials:${NC}
  → Gespeichert in: /tmp/db_credentials.txt
  → Bitte sichern und löschen!

${BLUE}📝 Nützliche Befehle:${NC}
  pm2 status              - Status anzeigen
  pm2 logs               - Logs anzeigen
  pm2 restart ecosystem  - Neustart
  pm2 monit             - Monitoring

${YELLOW}⚠️  Wichtig:${NC}
  1. Sichere die DB-Credentials aus /tmp/db_credentials.txt
  2. Lösche die Datei nach dem Sichern
  3. SSL-Zertifikat kann jederzeit mit Certbot erneuert werden

${GREEN}Viel Erfolg mit deinem Webprojekte-Verkaufs-System! 🚀${NC}
EOF
}

# Main Installation
main() {
    log_info "Starte Smart Installer..."
    
    check_os
    check_root
    install_dependencies
    setup_user
    setup_postgresql
    clone_repository
    setup_env
    install_app
    setup_pm2
    create_nginx_config
    install_nginx
    setup_certbot
    
    print_summary
}

# Start installation
main
