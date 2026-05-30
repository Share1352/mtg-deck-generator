import { APP_VERSION } from './constants.js';
import { createLogger } from './logger.js';
import { createRng } from './random.js';
import { getFrontendThemePool, pickTheme } from './themePool.js';
import { selectCardsForTheme } from './cardSelection.js';
import { buildManaBase } from './manaBase.js';
import { isColorTheme } from './colorThemes.js';
import { exportDeck } from './exportDeck.js';
import { validateDeck } from './validation.js';
import { finalizeDeckSynergies } from './deckSynergyCheck.js';
import { ScryfallError } from './scryfallClient.js';

function isHardOutage(error) {
  if (error instanceof ScryfallError && (error.status === 0 || error.status >= 500 || error.status === 429)) return true;
  if (error && typeof error.message === 'string' && /Scryfall catalog/i.test(error.message)) return true;
  return false;
}

export async function generateDeck({ seed = Date.now(), onProgress = () => {}, onLog = null } = {}) {
  const rng = createRng(seed);
  const logger = createLogger({ onLine: typeof onLog === 'function' ? onLog : undefined });
  logger.start(seed);
  onProgress(5);

  let pool;
  try {
    pool = await getFrontendThemePool({ logger });
  } catch (error) {
    logger.error('theme pool fetch', error);
    const err = new Error(
      `Online theme sources are unreachable. The deck generator only works while Scryfall is reachable. ${error.message}\n\n${logger.text()}`,
    );
    err.cause = error;
    throw err;
  }
  const { themes, bannedCount } = pool;
  logger.line(`Candidate themes after dedupe/bans: ${themes.length}`);
  logger.line(`Banned theme count: ${bannedCount}`);
  if (!themes.length) {
    throw new Error(`Online theme sources returned no usable entries after bans.\n\n${logger.text()}`);
  }
  onProgress(15);

  let lastError;
  for (let attempt = 1; attempt <= 4; attempt += 1) {
    const theme = pickTheme(themes, rng);
    logger.line(`Attempt ${attempt}: selected theme: ${theme.name} / ${theme.category} / source: ${theme.sources.join('+')}`);
    try {
      onProgress(25);
      const selection = await selectCardsForTheme(theme, { logger, rng });
      onProgress(75);
      const lands = await buildManaBase(selection.nonlands, selection.colors, { theme: theme.name, requiredLands: selection.requiredLands, noBasics: isColorTheme(theme), logger, rng });
      onProgress(92);
      const deck = {
        appVersion: APP_VERSION,
        theme,
        colors: selection.colors,
        nonlands: selection.nonlands,
        themeCards: selection.themeCards,
        supportCards: selection.supportCards,
        core: selection.core,
        random: selection.random,
        lands,
      };
      onProgress(95);
      await finalizeDeckSynergies(deck, { colors: selection.colors, logger, rng });
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
      if (isHardOutage(error)) {
        const wrapped = new Error(
          `Online card database is unreachable while building ${theme.name}. The deck generator only works while Scryfall is reachable. ${error.message}\n\n${logger.text()}`,
        );
        wrapped.cause = error;
        throw wrapped;
      }
      logger.line(`Rerolled theme "${theme.name}" because it could not produce a valid themed 23-card package under the 10-card direct theme minimum: ${error.message}`);
    }
  }
  throw new Error(`Generation failed after retries: ${lastError?.message || 'unknown error'}\n\n${logger.text()}`);
}
