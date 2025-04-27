// --- Starter Page Toggle Cards ---

document.addEventListener('DOMContentLoaded', function() {
  const featureCards = document.querySelectorAll('.feature-card');

  featureCards.forEach(card => {
    card.addEventListener('click', function() {
      this.classList.toggle('expanded');

      // Arrow flipping
      const arrow = this.querySelector('.arrow');
      if (this.classList.contains('expanded')) {
        arrow.textContent = '▲';
      } else {
        arrow.textContent = '▼';
      }
    });
  });
});
