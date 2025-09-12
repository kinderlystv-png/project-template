#!/usr/bin/env python3
"""
HTTP сервер с подробным логированием для диагностики EAP Dashboard
"""

import http.server
import socketserver
import os
import sys
from datetime import datetime

class LoggingHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, format, *args):
        """Переопределяем логирование для более подробного вывода"""
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        message = format % args
        print(f"[{timestamp}] {message}")

        # Дополнительная информация о запросе
        print(f"    📍 Путь запроса: {self.path}")
        print(f"    🌐 Метод: {self.command}")
        print(f"    📁 Рабочая директория сервера: {os.getcwd()}")

        # Проверяем существование запрашиваемого файла
        if self.path == '/':
            target_file = 'index.html'
        else:
            target_file = self.path.lstrip('/')

        file_exists = os.path.exists(target_file)
        print(f"    📄 Запрашиваемый файл: {target_file}")
        print(f"    ✅ Файл существует: {file_exists}")

        if file_exists:
            file_size = os.path.getsize(target_file)
            print(f"    📊 Размер файла: {file_size} байт")

        print("    " + "-" * 50)

def run_server(port=8080):
    """Запуск HTTP сервера с логированием"""
    print("🚀 EAP Dashboard HTTP Server с логированием")
    print(f"📂 Рабочая директория: {os.getcwd()}")
    print(f"🔗 URL: http://localhost:{port}")
    print("=" * 60)

    # Проверяем наличие index.html
    if os.path.exists('index.html'):
        print("✅ index.html найден")
        print(f"   Размер: {os.path.getsize('index.html')} байт")
    else:
        print("❌ index.html НЕ НАЙДЕН!")
        print("   Содержимое директории:")
        for item in os.listdir('.'):
            print(f"   - {item}")

    print("=" * 60)

    try:
        with socketserver.TCPServer(("", port), LoggingHTTPRequestHandler) as httpd:
            print(f"🌐 Сервер запущен на порту {port}")
            print("📋 Логи запросов будут показаны ниже:")
            print("=" * 60)
            httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n⏹️  Сервер остановлен")
    except Exception as e:
        print(f"❌ Ошибка сервера: {e}")

if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8080
    run_server(port)
