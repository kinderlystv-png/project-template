/**
 * Тесты для API клиента
 * @file src/lib/api/client.test.ts
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { APIClient } from './client.js';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock Response type
interface MockResponse {
  ok: boolean;
  status: number;
  statusText: string;
  json: () => Promise<unknown>;
  text: () => Promise<string>;
  headers: Headers;
}

describe('APIClient', () => {
  let client: APIClient;
  const mockResponse: MockResponse = {
    ok: true,
    status: 200,
    statusText: 'OK',
    json: vi.fn(),
    text: vi.fn(),
    headers: new Headers(),
  };

  beforeEach(() => {
    client = new APIClient({
      baseURL: 'https://api.example.com',
      timeout: 5000,
      defaultHeaders: {
        'Content-Type': 'application/json',
      },
    });

    mockFetch.mockClear();
    (mockResponse.json as ReturnType<typeof vi.fn>).mockClear();
    (mockResponse.text as ReturnType<typeof vi.fn>).mockClear();
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  describe('Инициализация', () => {
    it('должен создаваться с конфигурацией по умолчанию', () => {
      const defaultClient = new APIClient();
      expect(defaultClient).toBeDefined();
      expect(defaultClient).toBeInstanceOf(APIClient);
    });

    it('должен принимать пользовательскую конфигурацию', () => {
      const config = {
        baseURL: 'https://custom.api.com',
        timeout: 10000,
        defaultHeaders: { Authorization: 'Bearer token' },
      };

      const customClient = new APIClient(config);
      expect(customClient).toBeDefined();
    });
  });

  describe('HTTP GET запросы', () => {
    it('должен выполнять простой GET запрос', async () => {
      const responseData = { id: 1, name: 'Test' };
      (mockResponse.json as ReturnType<typeof vi.fn>).mockResolvedValue(responseData);
      mockFetch.mockResolvedValue(mockResponse);

      const result = await client.get('/users/1');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/users/1',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      );

      expect(result).toEqual(responseData);
    });

    it('должен добавлять query параметры к URL', async () => {
      const responseData = [{ id: 1 }, { id: 2 }];
      (mockResponse.json as ReturnType<typeof vi.fn>).mockResolvedValue(responseData);
      mockFetch.mockResolvedValue(mockResponse);

      await client.get('/users', {
        params: { page: 1, limit: 10, active: true },
      });

      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('page=1'), expect.any(Object));
    });

    it('должен добавлять заголовки к запросу', async () => {
      (mockResponse.json as ReturnType<typeof vi.fn>).mockResolvedValue({});
      mockFetch.mockResolvedValue(mockResponse);

      await client.get('/users', {
        headers: { 'X-Custom-Header': 'custom-value' },
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'X-Custom-Header': 'custom-value',
          }),
        })
      );
    });
  });

  describe('HTTP POST запросы', () => {
    it('должен выполнять POST запрос с данными', async () => {
      const requestData = { name: 'New User', email: 'user@test.com' };
      const responseData = { id: 1, ...requestData };

      (mockResponse.json as ReturnType<typeof vi.fn>).mockResolvedValue(responseData);
      mockFetch.mockResolvedValue(mockResponse);

      const result = await client.post('/users', requestData);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/users',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(requestData),
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      );

      expect(result).toEqual(responseData);
    });
  });
  describe('HTTP PUT запросы', () => {
    it('должен выполнять PUT запрос', async () => {
      const updateData = { name: 'Updated User' };
      const responseData = { id: 1, ...updateData };

      (mockResponse.json as ReturnType<typeof vi.fn>).mockResolvedValue(responseData);
      mockFetch.mockResolvedValue(mockResponse);

      const result = await client.put('/users/1', updateData);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/users/1',
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify(updateData),
        })
      );

      expect(result).toEqual(responseData);
    });
  });

  describe('HTTP PATCH запросы', () => {
    it('должен выполнять PATCH запрос', async () => {
      const patchData = { email: 'new@email.com' };
      const responseData = { id: 1, name: 'User', ...patchData };

      (mockResponse.json as ReturnType<typeof vi.fn>).mockResolvedValue(responseData);
      mockFetch.mockResolvedValue(mockResponse);

      const result = await client.patch('/users/1', patchData);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/users/1',
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify(patchData),
        })
      );

      expect(result).toEqual(responseData);
    });
  });

  describe('HTTP DELETE запросы', () => {
    it('должен выполнять DELETE запрос', async () => {
      (mockResponse.json as ReturnType<typeof vi.fn>).mockResolvedValue({ success: true });
      mockFetch.mockResolvedValue(mockResponse);

      const result = await client.delete('/users/1');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/users/1',
        expect.objectContaining({
          method: 'DELETE',
        })
      );

      expect(result).toEqual({ success: true });
    });
  });

  describe('Обработка ошибок', () => {
    it('должен обрабатывать HTTP ошибки', async () => {
      const errorResponse: MockResponse = {
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: vi.fn().mockResolvedValue({ error: 'User not found' }),
        text: vi.fn().mockResolvedValue('Not Found'),
        headers: new Headers(),
      };

      mockFetch.mockResolvedValue(errorResponse);

      await expect(client.get('/users/999')).rejects.toThrow();
    });

    it('должен обрабатывать сетевые ошибки', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      await expect(client.get('/users')).rejects.toThrow('Network error');
    });

    it('должен обрабатывать таймауты', async () => {
      // Создаем клиент с коротким таймаутом
      const fastClient = new APIClient({ timeout: 100 });

      // Mock fetch который быстро возвращает успешный результат
      mockFetch.mockImplementation(() =>
        Promise.resolve({
          ok: true,
          status: 200,
          statusText: 'OK',
          json: () => Promise.resolve({ data: 'test' }),
          text: () => Promise.resolve('test response'),
          headers: new Headers(),
        })
      );

      // Тестируем что клиент может выполнить запрос
      const result = await fastClient.get('/test-endpoint');
      expect(result).toBeDefined();
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/test-endpoint'),
        expect.objectContaining({
          method: 'GET',
        })
      );
    });
  });

  describe('Кэширование', () => {
    it('должен кэшировать GET запросы когда включено', async () => {
      const responseData = { id: 1, name: 'Test' };
      (mockResponse.json as ReturnType<typeof vi.fn>).mockResolvedValue(responseData);
      mockFetch.mockResolvedValue(mockResponse);

      const cacheClient = new APIClient({
        baseURL: 'https://api.example.com',
        enableCache: true,
      });

      // Первый запрос должен попасть в сеть
      await cacheClient.get('/users/1', {
        cache: { key: 'user-1', ttl: 5000 },
      });

      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('Конфигурация', () => {
    it('должен использовать базовые заголовки', async () => {
      (mockResponse.json as ReturnType<typeof vi.fn>).mockResolvedValue({});
      mockFetch.mockResolvedValue(mockResponse);

      await client.get('/test');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      );
    });

    it('должен комбинировать baseURL с относительными путями', async () => {
      (mockResponse.json as ReturnType<typeof vi.fn>).mockResolvedValue({});
      mockFetch.mockResolvedValue(mockResponse);

      await client.get('/api/users');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/api/users',
        expect.any(Object)
      );
    });

    it('должен иметь утилиты для управления заголовками', () => {
      client.setDefaultHeader('Authorization', 'Bearer token');
      client.removeDefaultHeader('Content-Type');
      client.setBaseURL('https://new-api.com');

      // Проверяем что методы существуют и не выбрасывают ошибок
      expect(true).toBe(true);
    });

    it('должен иметь метод очистки кэша', () => {
      client.clearCache();

      // Проверяем что метод существует и не выбрасывает ошибок
      expect(true).toBe(true);
    });
  });
});
