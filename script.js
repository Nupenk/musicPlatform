const CLIENT_ID = '2b6cb1ee';
const trackNameEl = document.querySelector('.cover-title');
const coverEl = document.querySelector('.cover img');
const playBtn = document.querySelector('.play');
const seekBar = document.querySelector('.seek-bar');

let audio = null;
let trackUrl = '';
let trackImage = '';
let trackName = '';

function fetchTrack() {
  fetch(`https://api.jamendo.com/v3.0/tracks/?client_id=${CLIENT_ID}&format=json&limit=1`)
    .then(res => res.json())
    .then(data => {
      const track = data.results[0];
      if (!track) return;
      trackUrl = track.audio;
      trackImage = track.album_image;
      trackName = track.name;

      coverEl.src = trackImage;
      trackNameEl.textContent = trackName;
    })
    .catch(err => console.error('Помилка:', err));
}

function updateSeekBar() {
  if (audio && audio.duration) {
    seekBar.max = Math.floor(audio.duration);
    seekBar.value = Math.floor(audio.currentTime);
  }
}

function attachAudioEvents() {
  if (!audio) return;
  audio.ontimeupdate = updateSeekBar;
  audio.onended = () => {
    playBtn.textContent = '▶';
    audio = null;
    seekBar.value = 0;
  };
}

seekBar.addEventListener('input', () => {
  if (audio) audio.currentTime = seekBar.value;
});

playBtn.addEventListener('click', () => {
  if (audio && !audio.paused) {
    audio.pause();
    playBtn.textContent = '▶';
  } else if (audio && audio.paused) {
    audio.play();
    playBtn.textContent = '⏸';
  } else if (trackUrl) {
    audio = new Audio(trackUrl);
    audio.play();
    playBtn.textContent = '⏸';
    attachAudioEvents();
  }
});

fetchTrack();

/* ===== Меню плейлиста ===== */
document.querySelectorAll('.menu-btn').forEach(btn => {
  btn.addEventListener('click', e => {
    e.stopPropagation();
    const menu = btn.nextElementSibling;
    const isActive = menu.classList.contains('active');
    document.querySelectorAll('.playlist-menu.active').forEach(m => m.classList.remove('active'));
    if (!isActive) menu.classList.add('active');
  });
});

document.addEventListener('click', e => {
  if (!e.target.closest('.playlist')) {
    document.querySelectorAll('.playlist-menu.active').forEach(m => m.classList.remove('active'));
  }
});

/* ===== Модалка удаления ===== */
const modalOverlay = document.querySelector('.modal-overlay');
const confirmDeleteBtn = document.querySelector('.confirm-delete');
const cancelDeleteBtn = document.querySelector('.cancel-delete');
let playlistToDelete = null;

document.querySelectorAll('.delete-btn').forEach(btn => {
  btn.addEventListener('click', e => {
    e.stopPropagation();
    playlistToDelete = btn.closest('.playlist');
    modalOverlay.classList.add('active');
  });
});

cancelDeleteBtn.addEventListener('click', () => {
  modalOverlay.classList.remove('active');
  playlistToDelete = null;
});

confirmDeleteBtn.addEventListener('click', () => {
  if (playlistToDelete) {
    playlistToDelete.remove();
    playlistToDelete = null;
  }
  modalOverlay.classList.remove('active');
});
