window.function = function (playerName, characterType, difficulty, startLevel, levelData, coopMode, player2Name) {
  const name = playerName.value || 'WARRIOR';
  const charType = (characterType.value || 'soldier').toLowerCase();
  const diff = (difficulty.value || 'normal').toLowerCase();
  const level = Math.max(1, Math.min(3, startLevel.value || 1));
  const customLevel = levelData.value || '';
  const coop = (coopMode.value || 'false').toLowerCase() === 'true';
  const p2name = player2Name.value || 'PLAYER 2';
  
  // Build URL with all parameters
  const params = new URLSearchParams({
    player: name,
    char: charType,
    diff: diff,
    level: level,
    coop: coop,
    player2: p2name
  });
  
  if (customLevel) {
    params.append('custom', encodeURIComponent(customLevel));
  }
  
  return `https://johnatfreecoffee.github.io/GLIDE-WARRIOR/game.html?${params.toString()}`;
}
