import fs from 'fs-extra';
import path from 'path';

export async function generateEventsAndListeners(srcDir: string): Promise<void> {
  const eventsDir = path.join(srcDir, 'events');
  const listenersDir = path.join(eventsDir, 'listeners');
  await fs.ensureDir(eventsDir);
  await fs.ensureDir(listenersDir);

  // eventEmitter.ts
  const eventEmitterContent = `import { EventEmitter } from 'events';
import { logger } from '../utils/logger.js';

class AppEventEmitter extends EventEmitter {
  emit(event: string | symbol, ...args: any[]): boolean {
    logger.debug(\`Event emitted: \${String(event)}\`);
    return super.emit(event, ...args);
  }
}

export const eventEmitter = new AppEventEmitter();

// Event names
export const Events = {
  USER_REGISTERED: 'user.registered',
  USER_VERIFIED: 'user.verified',
  PASSWORD_RESET_REQUESTED: 'password.reset.requested',
  PASSWORD_RESET: 'password.reset',
  EMAIL_SENT: 'email.sent',
} as const;

export type EventName = typeof Events[keyof typeof Events];
`;

  await fs.writeFile(path.join(eventsDir, 'eventEmitter.ts'), eventEmitterContent);

  // listeners/index.ts
  const listenersContent = `import { eventEmitter, Events } from '../eventEmitter.js';
import { logger } from '../utils/logger.js';

/**
 * Register all event listeners
 */
export function registerListeners() {
  // User registered listener
  eventEmitter.on(Events.USER_REGISTERED, (data) => {
    logger.info(\`User registered: \${data.email}\`);
    // Add your custom logic here
  });

  // User verified listener
  eventEmitter.on(Events.USER_VERIFIED, (data) => {
    logger.info(\`User verified: \${data.email}\`);
    // Add your custom logic here
  });

  // Password reset requested listener
  eventEmitter.on(Events.PASSWORD_RESET_REQUESTED, (data) => {
    logger.info(\`Password reset requested for: \${data.email}\`);
    // Add your custom logic here
  });

  // Password reset listener
  eventEmitter.on(Events.PASSWORD_RESET, (data) => {
    logger.info(\`Password reset for: \${data.email}\`);
    // Add your custom logic here
  });

  // Email sent listener
  eventEmitter.on(Events.EMAIL_SENT, (data) => {
    logger.debug(\`Email sent to: \${data.to}\`);
    // Add your custom logic here
  });

  logger.info('Event listeners registered');
}
`;

  await fs.writeFile(path.join(listenersDir, 'index.ts'), listenersContent);
}
