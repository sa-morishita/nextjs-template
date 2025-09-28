const isProduction = process.env.NODE_ENV === 'production';

type LogArgs = unknown[];

export const logger = {
  info: (...args: LogArgs) => {
    if (isProduction) return;
    console.log(...args);
  },
  warn: (...args: LogArgs) => {
    if (isProduction) return;
    console.warn(...args);
  },
  error: (...args: LogArgs) => {
    console.error(...args);
  },
};

export type Logger = typeof logger;
