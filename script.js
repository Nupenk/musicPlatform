// Не змінюйте й не видаляйте клієнт айді, воно відповідає за Api Jamendo
const CLIENT_ID = '2b6cb1ee';
const trackNameEl = document.querySelector('.cover-title');
const coverEl = document.querySelector('.cover img');
const playBtn = document.querySelector('.play');
const seekBar = document.querySelector('.seek-bar');
// Змінні музики
let audio = null;
let trackUrl = '';
let trackImage = '';
let trackName = '';

let trackIndex = 0;
let genre = 'electronic';
// Функція для знаходження та встановлення треку
function fetchTrack() {
  // Взаємодіючи з силкою можна виставляти різні жанри музики, ліміт пісень 200
  fetch(`https://api.jamendo.com/v3.0/tracks/?client_id=${CLIENT_ID}&format=json&limit=200&tags=${genre}`)
    .then(res => res.json())
    .then(data => {
      console.log('Jamendo response:', data); // Додаємо логування
      const track = data.results[trackIndex];
      // Якщо не знайшло пісню, хай знов дивититься, але зі затримкою щоб не їло систему
      if (!track) {
        console.log("Не знайдено трек, спроба знову");
        setTimeout( () => {
          fetchTrack();
        },500);
      }
      // Встановлення властивостей пісні
      trackUrl = track.audio;
      trackImage = track.image; // Є ще властивість album_image
      trackName = track.name;

      coverEl.src = trackImage;
      trackNameEl.textContent = trackName;

      // Створення класу музики
      audio = new Audio(trackUrl);
      attachAudioEvents();
      playBtn.textContent = '⏸';

      // Якщо пісня грає не першою, то відразу хай починає грати
      if (audio) {
        audio.play();
      }

    })
    .catch(err => console.error('Помилка:', err));
}
// Оновлення полоски часу музики
function updateSeekBar() {
  if (audio && audio.duration) {
    seekBar.max = Math.floor(audio.duration);
    seekBar.value = Math.floor(audio.currentTime);
  }
}
// Коли пісня закінчується, встановлюємо наступну пісню та ресетаємо полоску часу
function attachAudioEvents() {
  if (!audio) return;
  audio.ontimeupdate = updateSeekBar;
  audio.onended = () => {
    playBtn.textContent = '▶';
    audio = null;
    seekBar.value = 0;
    trackIndex++;   
    fetchTrack(); 
  };
}
// Місце повзунка відповідно до часу пісні
seekBar.addEventListener('input', () => {
  if (audio) audio.currentTime = seekBar.value;
});
// Функціонал кнопки зупинити або відтворити
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

// Перехід назад між треками
document.querySelector('.prev').addEventListener('click', () => {
  if (trackIndex > 0) {
    if (audio && !audio.paused) audio.pause();
    trackIndex--;
    playBtn.textContent = '▶';
    audio = null;
    seekBar.value = 0;
    fetchTrack();
  } else {
    alert("Вже перший трек, нікуди не можна назад");
  }
});
  
// Перехід вперед між треками
document.querySelector('.next').addEventListener('click', () => {
  if (trackIndex < 199) {
    if (audio && !audio.paused) audio.pause();
    trackIndex++;
    playBtn.textContent = '▶';
    audio = null;
    seekBar.value = 0;
    fetchTrack();
  } else {
    alert("Вже останній трек, нікуди не можна вперед");
  }
});

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
