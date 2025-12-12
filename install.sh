#!/bin/bash
################################################################################
# 🚀 Webprojekte-Verkauf-System - Smart Installer
# Automatische Installation auf Debian/Ubuntu VServer
# Autor: Tech-lab-sys
# Version: 2.0.0
################################################################################
set -e

# Farben
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Globale Variablen
DOMAIN="${DOMAIN:-localhost}"
IS_ROOT=false

# Logging
log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Banner
print_banner() {
    echo -e "${GREEN}"
    cat << 'EOF'
╭────────────────────────────────────────────────────────────╮
│  🚀 Webprojekte-Verkaufs-System - Smart Installer v2.0  │
╰────────────────────────────────────────────────────────────╯
EOF
    echo -e "${NC}"
}

# System Check
check_system() {
    log_info "Prüfe System..."
    
    if [ -f /etc/os-release ]; then
        . /etc/os-release
        OS=$ID
    else
        log_error "OS nicht erkannt"
        exit 1
    fi
    
    if [[ "$OS" != "ubuntu" && "$OS" != "debian" ]]; then
        log_error "Nur Ubuntu/Debian unterstützt"
        exit 1
    fi
    
    [[ $EUID -eq 0 ]] && IS_ROOT=true || IS_ROOT=false
    
    log_success "System-Check OK ($OS)"
}

# System Update
update_system() {
    log_info "Update System..."
    ${IS_ROOT} && apt update -qq && apt upgrade -y -qq || sudo apt update -qq && sudo apt upgrade -y -qq
    log_success "System aktualisiert"
}

# Essentials
install_essentials() {
    log_info "Installiere Tools..."
    ${IS_ROOT} && apt install -y curl wget git build-essential ufw htop nano > /dev/null 2>&1 || sudo apt install -y curl wget git build-essential ufw htop nano > /dev/null 2>&1
    log_success "Tools installiert"
}

# Firewall
setup_firewall() {
    log_info "Setup Firewall..."
    if ${IS_ROOT}; then
        ufw --force enable && ufw allow OpenSSH && ufw allow 80/tcp && ufw allow 443/tcp
    else
        sudo ufw --force enable && sudo ufw allow OpenSSH && sudo ufw allow 80/tcp && sudo ufw allow 443/tcp
    fi
    log_success "Firewall konfiguriert"
}

# Node.js
install_nodejs() {
    log_info "Installiere Node.js 20..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash - > /dev/null 2>&1
    ${IS_ROOT} && apt install -y nodejs > /dev/null 2>&1 || sudo apt install -y nodejs > /dev/null 2>&1
    npm install -g pnpm > /dev/null 2>&1
    log_success "Node.js $(node -v) & pnpm installiert"
}

# PostgreSQL
install_postgresql() {
    log_info "Installiere PostgreSQL..."
    ${IS_ROOT} && apt install -y postgresql postgresql-contrib > /dev/null 2>&1 && systemctl start postgresql && systemctl enable postgresql || sudo apt install -y postgresql postgresql-contrib > /dev/null 2>&1 && sudo systemctl start postgresql && sudo systemctl enable postgresql
    log_success "PostgreSQL installiert"
}

# DB Setup
setup_database() {
    log_info "Setup Datenbank..."
    DB_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)
    ${IS_ROOT} && sudo -u postgres psql << EOF > /dev/null 2>&1 || sudo -u postgres psql << EOF > /dev/null 2>&1
CREATE USER webprojekte WITH PASSWORD '$DB_PASSWORD';
CREATE DATABASE webprojekte OWNER webprojekte;
GRANT ALL PRIVILEGES ON DATABASE webprojekte TO webprojekte;
EOF
    echo "DATABASE_URL=\"postgresql://webprojekte:$DB_PASSWORD@localhost:5432/webprojekte\"" > /tmp/db_credentials.txt
    log_success "DB konfiguriert"
}

# PM2
install_pm2() {
    log_info "Installiere PM2..."
    npm install -g pm2 > /dev/null 2>&1
    log_success "PM2 installiert"
}

# Nginx
install_nginx() {
    log_info "Installiere Nginx..."
    ${IS_ROOT} && apt install -y nginx certbot python3-certbot-nginx > /dev/null 2>&1 && systemctl start nginx && systemctl enable nginx || sudo apt install -y nginx certbot python3-certbot-nginx > /dev/null 2>&1 && sudo systemctl start nginx && sudo systemctl enable nginx
    log_success "Nginx installiert"
}

# Clone App
clone_application() {
    log_info "Clone Repository..."
    TARGET="/home/${USER}/webprojekte-verkauf-system"
    [ -d "$TARGET" ] && log_warning "Verzeichnis existiert" || git clone https://github.com/Tech-lab-sys/webprojekte-verkauf-system.git "$TARGET" > /dev/null 2>&1
    log_success "Repository geklont"
}

# Dependencies
install_dependencies() {
    log_info "Installiere Dependencies..."
    cd "/home/${USER}/webprojekte-verkauf-system"
    pnpm install > /dev/null 2>&1
    log_success "Dependencies installiert"
}

# Prisma Setup
setup_prisma() {
    log_info "Setup Prisma..."
    cd "/home/${USER}/webprojekte-verkauf-system"
    pnpm db:push > /dev/null 2>&1
    [ -f "prisma/seed.ts" ] && pnpm db:seed > /dev/null 2>&1 || true
    log_success "Prisma konfiguriert"
}

# .env
create_env() {
    log_info "Erstelle .env.local..."
    cd "/home/${USER}/webprojekte-verkauf-system"
    DB_URL=$(cat /tmp/db_credentials.txt)
    cat > .env.local << EOF
$DB_URL
STRIPE_SECRET_KEY="sk_test_DEIN_KEY"
STRIPE_WEBHOOK_SECRET="whsec_DEIN_SECRET"
PERPLEXITY_API_KEY="pplx_DEIN_KEY"
NEXT_PUBLIC_APP_URL="http://${DOMAIN}:3000"
NODE_ENV="production"
PORT="3000"
EOF
    log_success ".env.local erstellt"
}

# Nginx Config
create_nginx_config() {
    log_info "Nginx Config für $DOMAIN..."
    CONFIG="/etc/nginx/sites-available/webprojekte"
    ${IS_ROOT} && cat > "$CONFIG" << 'NGINX' || sudo bash -c "cat > $CONFIG" << 'NGINX'
server {
    listen 80;
    server_name DOMAIN_PLACEHOLDER www.DOMAIN_PLACEHOLDER;
    client_max_body_size 500M;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
NGINX
    ${IS_ROOT} && sed -i "s/DOMAIN_PLACEHOLDER/$DOMAIN/g" "$CONFIG" || sudo sed -i "s/DOMAIN_PLACEHOLDER/$DOMAIN/g" "$CONFIG"
    ${IS_ROOT} && ln -sf "$CONFIG" /etc/nginx/sites-enabled/ && rm -f /etc/nginx/sites-enabled/default && nginx -t && systemctl reload nginx || sudo ln -sf "$CONFIG" /etc/nginx/sites-enabled/ && sudo rm -f /etc/nginx/sites-enabled/default && sudo nginx -t && sudo systemctl reload nginx
    log_success "Nginx konfiguriert"
}

# Start App
start_application() {
    log_info "Starte App mit PM2..."
    cd "/home/${USER}/webprojekte-verkauf-system"
    pm2 start "pnpm dev" --name webprojekte-verkauf
    pm2 save
    pm2 startup systemd -u "${USER}" --hp "/home/${USER}" > /dev/null 2>&1 || true
    log_success "App gestartet"
}

# Summary
print_summary() {
    echo ""
    cat << EOF
${GREEN}════════════════════════════════════════════════${NC}
${GREEN}✓ Installation erfolgreich!${NC}
${GREEN}════════════════════════════════════════════════${NC}

${BLUE}📋 Komponenten:${NC}
  ✓ Node.js $(node -v)
  ✓ PostgreSQL
  ✓ Nginx
  ✓ PM2

${BLUE}🌐 Zugriff:${NC}
  → http://${DOMAIN}

${BLUE}📁 Pfad:${NC}
  → /home/${USER}/webprojekte-verkauf-system

${BLUE}🔑 DB-Credentials:${NC}
  → /tmp/db_credentials.txt

${BLUE}📝 Befehle:${NC}
  pm2 status
  pm2 logs
  pm2 restart webprojekte-verkauf

${YELLOW}⚠️  Wichtig:${NC}
  1. Sichere DB-Credentials
  2. Editiere .env.local mit API Keys
  3. Starte neu: pm2 restart webprojekte-verkauf

${GREEN}Viel Erfolg! 🚀${NC}
EOF
}

# Main
main() {
    log_info "Start Installation..."
    check_system
    update_system
    install_essentials
    setup_firewall
    install_nodejs
    install_postgresql
    setup_database
    install_pm2
    install_nginx
    clone_application
    install_dependencies
    setup_prisma
    create_env
    create_nginx_config
    start_application
    print_summary
}

print_banner
main
