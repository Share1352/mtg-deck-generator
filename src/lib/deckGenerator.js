import { APP_VERSION } from './constants.js';
import { createLogger } from './logger.js';
import { createRng } from './random.js';
import { getFrontendThemePool, pickUniformTheme } from './themePool.js';
import { selectCardsForTheme } from './cardSelection.js';
import { buildManaBase } from './manaBase.js';
import { exportDeck } from './exportDeck.js';
import { validateDeck } from './validation.js';
export async function generateDeck({ seed = Date.now(), onProgress = () => {} } = {}) {
  const rng = createRng(seed);
  const logger = createLogger();
  logger.start(seed);
  onProgress(5);
  const { themes, bannedCount } = await getFrontendThemePool();
  logger.line(`Candidate themes after dedupe/bans: ${themes.length}`);
  logger.line(`Banned theme count: ${bannedCount}`);
  onProgress(12);
  let lastError;
  for (let attempt = 1; attempt <= 4; attempt += 1) {
    const theme = pickUniformTheme(themes, rng);
    logger.line(`Selected theme: ${theme.name} / ${theme.category} / source: ${theme.sources.join('+')}`);
    try {
      onProgress(25);
      const selection = await selectCardsForTheme(theme, { logger, rng });
      onProgress(75);
      const lands = await buildManaBase(selection.nonlands, selection.colors, { theme: theme.name, logger, rng });
      onProgress(92);
      const deck = { appVersion: APP_VERSION, theme, colors: selection.colors, nonlands: selection.nonlands, core: selection.core, random: selection.random, lands };
      const validation = validateDeck(deck);
      logger.line(`Final deck counts: nonlands=${deck.nonlands.length} lands=${deck.lands.length} total=${deck.nonlands.length + deck.lands.length}`);
      if (!validation.ok) throw new Error(validation.errors.join('; '));
      deck.exportText = exportDeck(deck);
      deck.debugLog = logger.text();
      onProgress(100);
      return deck;
    } catch (error) {
      lastError = error;
      logger.error(`generation attempt ${attempt}`, error);
      logger.line(`Rerolled theme "${theme.name}" because it could not produce a valid 23-card spell package plus lands: ${error.message}`);
    }
  }
  throw new Error(`Generation failed after retries: ${lastError?.message || 'unknown error'}\n\n${logger.text()}`);
}
