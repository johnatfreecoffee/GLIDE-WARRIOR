window.function = function (playerName, difficulty) {
  const name = playerName.value || 'PLAYER';
  const diff = difficulty.value || 'easy';
  
  // Build URL with parameters
  const params = new URLSearchParams({
    player: name,
    diff: diff
  });
  
  // Return direct URL to game page (CHANGE THIS TO YOUR GITHUB URL!)
  return `https://johnatfreecoffee.github.io/GLIDE-WARRIOR/game.html?${params.toString()}`;
}
