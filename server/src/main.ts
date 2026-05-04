/**
 * CLI entry point. Imports the configured app and binds it to PORT.
 * Tests import `app` from index.ts directly and never run this file —
 * which is the only way to avoid binding the port during a test run.
 */

import { app } from './index.js';

const PORT = Number(process.env.PORT ?? 3001);

app.listen(PORT, () => {
  console.log(`[asta-pplm-server] listening on http://localhost:${PORT}`);
});
