# @navigator.menu/plugin-logger

Configurable logging plugin for Navigator.menu with multiple log levels and flexible output.

## Installation

```bash
pnpm add @navigator.menu/plugin-logger
```

## Usage

```typescript
import { NavigatorCore } from '@navigator.menu/core';
import { LoggerPlugin, LogLevel } from '@navigator.menu/plugin-logger';

const nav = new NavigatorCore();
const logger = new LoggerPlugin({ 
  level: LogLevel.INFO,
  prefix: '[MyApp]',
  timestamps: true
});

nav.use(logger);

// Log messages
logger.debug('Debug info'); // Won't show (level is INFO)
logger.info('Operation started');
logger.warn('Potential issue');
logger.error('Critical error');

// Change level dynamically
logger.setLevel(LogLevel.DEBUG);
```

## Log Levels

- `LogLevel.DEBUG` (0): Detailed debugging information
- `LogLevel.INFO` (1): General informational messages
- `LogLevel.WARN` (2): Warning messages
- `LogLevel.ERROR` (3): Error messages
- `LogLevel.NONE` (4): Disable all logging

## Options

- `level`: Minimum log level to display (default: `LogLevel.INFO`)
- `prefix`: Custom prefix for all messages (default: `[Navigator]`)
- `timestamps`: Enable ISO timestamps (default: `false`)

## License

MIT
