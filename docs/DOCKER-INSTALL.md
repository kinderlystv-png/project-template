# Установка Docker для SHINOMONTAGKA

## Windows

### Вариант 1: Docker Desktop (Рекомендуется)

1. **Скачайте Docker Desktop для Windows**
   - Перейдите на <https://www.docker.com/products/docker-desktop/>
   - Скачайте версию для Windows

2. **Установите Docker Desktop**
   - Запустите установщик от имени администратора
   - Следуйте инструкциям установщика
   - Перезагрузите компьютер при необходимости

3. **Проверьте установку**
   ```powershell
   docker --version
   docker-compose --version
   ```

### Вариант 2: Chocolatey

```powershell
# Установите Chocolatey (если не установлен)
Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))

# Установите Docker Desktop
choco install docker-desktop
```

### Вариант 3: Winget

```powershell
winget install Docker.DockerDesktop
```

## Linux (Ubuntu/Debian)

```bash
# Обновите систему
sudo apt update

# Установите зависимости
sudo apt install apt-transport-https ca-certificates curl gnupg lsb-release

# Добавьте GPG ключ Docker
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

# Добавьте репозиторий Docker
echo "deb [arch=amd64 signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Обновите список пакетов
sudo apt update

# Установите Docker
sudo apt install docker-ce docker-ce-cli containerd.io

# Установите Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Добавьте пользователя в группу docker
sudo usermod -aG docker $USER

# Перелогиньтесь или выполните
newgrp docker
```

## macOS

### Вариант 1: Docker Desktop

1. Скачайте Docker Desktop для Mac с <https://www.docker.com/products/docker-desktop/>
2. Установите .dmg файл
3. Запустите Docker Desktop

### Вариант 2: Homebrew

```bash
# Установите Homebrew (если не установлен)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Установите Docker
brew install --cask docker

# Или установите через формулу
brew install docker docker-compose
```

## Проверка установки

После установки проверьте:

```bash
# Версия Docker
docker --version

# Версия Docker Compose
docker-compose --version

# Тест запуска
docker run hello-world
```

## Настройка для SHINOMONTAGKA

После установки Docker:

1. **Клонируйте проект**

   ```bash
   git clone https://github.com/kinderlystv-png/project-template.git
   cd project-template
   ```

2. **Скопируйте файлы окружения**

   ```bash
   # Windows (PowerShell)
   Copy-Item .env.development.example .env.development
   Copy-Item .env.test.example .env.test
   Copy-Item .env.production.example .env.production

   # Linux/macOS
   cp .env.development.example .env.development
   cp .env.test.example .env.test
   cp .env.production.example .env.production
   ```

3. **Запустите проект**

   ```bash
   # Windows
   .\docker\run.ps1 dev

   # Linux/macOS
   ./docker/run.sh development

   # Или через npm
   npm run docker:dev
   ```

## Troubleshooting

### Windows

**Проблема**: "WSL 2 installation is incomplete"
**Решение**:

- Установите WSL 2: `wsl --install`
- Перезагрузите компьютер
- Обновите WSL: `wsl --update`

**Проблема**: "Hardware assisted virtualization and data execution protection must be enabled"
**Решение**: Включите виртуализацию в BIOS/UEFI

### Linux

**Проблема**: "Permission denied" при запуске docker команд
**Решение**:

```bash
sudo usermod -aG docker $USER
newgrp docker
```

**Проблема**: "Docker daemon is not running"
**Решение**:

```bash
sudo systemctl start docker
sudo systemctl enable docker
```

### macOS

**Проблема**: "Docker Desktop requires macOS 10.15 or newer"
**Решение**: Используйте Docker через Homebrew или обновите macOS

## Системные требования

### Минимальные требования

- **RAM**: 4GB (рекомендуется 8GB+)
- **Диск**: 10GB свободного места
- **CPU**: 64-bit процессор с поддержкой виртуализации

### Рекомендуемые требования

- **RAM**: 16GB+
- **Диск**: SSD с 50GB+ свободного места
- **CPU**: 4+ ядра

## Дополнительные инструменты

### Visual Studio Code расширения

```bash
# Установите полезные расширения
code --install-extension ms-azuretools.vscode-docker
code --install-extension ms-vscode-remote.remote-containers
```

### Альтернативы Docker Desktop

- **Podman**: Совместимая с Docker альтернатива
- **Rancher Desktop**: Открытая альтернатива Docker Desktop
- **Colima**: Легковесная альтернатива для macOS

---

После установки вернитесь к [основной документации Docker](DOCKER.md) для работы с проектом.
