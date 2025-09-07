// Фабрики для создания тестовых данных
export const dataFactory = {
  user: (overrides = {}) => ({
    id: crypto.randomUUID(),
    email: `test-${Date.now()}@example.com`,
    name: 'Test User',
    role: 'user',
    createdAt: new Date().toISOString(),
    ...overrides,
  }),

  event: (overrides = {}) => ({
    id: crypto.randomUUID(),
    title: 'Test Event',
    description: 'Test event description',
    date: new Date().toISOString(),
    status: 'draft',
    ...overrides,
  }),

  client: (overrides = {}) => ({
    id: crypto.randomUUID(),
    name: 'Test Client',
    email: `client-${Date.now()}@example.com`,
    phone: '+1234567890',
    ...overrides,
  }),
};
