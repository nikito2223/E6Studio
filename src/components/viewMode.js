export function initViewModes() {
  const viewButtons = document.querySelectorAll('.view-btn');
  const gallery = document.getElementById('gallery');

  viewButtons.forEach(button => {
    button.addEventListener('click', function () {
      const viewType = this.getAttribute('data-view');

      viewButtons.forEach(btn => btn.classList.remove('active'));
      this.classList.add('active');

      gallery.classList.toggle('list-view', viewType === 'list');
    });
  });
}
