export const CACHE_TAGS = {
  TODOS: {
    ALL: 'todos-all',
    USER: (userId: string) => `todos-user-${userId}`,
  },
  DIARIES: {
    USER: (userId: string) => `diaries-user-${userId}`,
  },
} as const;
