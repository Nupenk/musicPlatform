const CLIENT_ID = '2b6cb1ee';
const trackNameEl = document.querySelector('.cover-title');
const coverEl = document.querySelector('.cover img');
const playBtn = document.querySelector('.play');
const seekBar = document.querySelector('.seek-bar');
const volumeIcon = document.querySelector('.volume-icon');
const volumeSlider = document.querySelector('.volume-slider');
const volumeContainer = document.querySelector('.volume-container');

let audio = null;
let trackUrl = '';
let hideTimeout = null;

function fetchTrack() {
  fetch(`https://api.jamendo.com/v3.0/tracks/?client_id=${CLIENT_ID}&format=json&limit=1`)
    .then(res => res.json())
    .then(data => {
      const track = data.results[0];
      if (!track) return;
      trackUrl = track.audio;
      coverEl.src = track.album_image;
      trackNameEl.textContent = track.name;
    });
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
  audio.onended = () => playBtn.textContent = '▶';
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
    audio.volume = volumeSlider.value;
    audio.play();
    playBtn.textContent = '⏸';
    attachAudioEvents();
  }
});

fetchTrack();

/* === Меню плейлистов === */
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

/* === Модалка удаления === */
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

cancelDeleteBtn.addEventListener('click', () => modalOverlay.classList.remove('active'));

confirmDeleteBtn.addEventListener('click', () => {
  if (playlistToDelete) playlistToDelete.remove();
  modalOverlay.classList.remove('active');
});

/* === Громкость (улучшено) === */
volumeContainer.addEventListener('mouseenter', () => {
  clearTimeout(hideTimeout);
  volumeContainer.classList.add('show');
});

volumeContainer.addEventListener('mouseleave', () => {
  hideTimeout = setTimeout(() => volumeContainer.classList.remove('show'), 800);
});

volumeSlider.addEventListener('input', () => {
  if (audio) audio.volume = volumeSlider.value;
});
/* 🌟 Логика создания плейлиста */
const createBtn = document.querySelector('.create-playlist');
const createOverlay = document.querySelector('.create-playlist-overlay');
const cancelCreateBtn = document.querySelector('.cancel-create');
const confirmCreateBtn = document.querySelector('.confirm-create');
const playlistNameInput = document.querySelector('.playlist-name-input');
const playlistDescInput = document.querySelector('.playlist-desc-input');

createBtn.addEventListener('click', () => {
  createOverlay.classList.add('active');
  playlistNameInput.focus();
});

cancelCreateBtn.addEventListener('click', () => {
  createOverlay.classList.remove('active');
  playlistNameInput.value = '';
  playlistDescInput.value = '';
});

// Закрытие по клику вне модалки
createOverlay.addEventListener('click', e => {
  if (e.target === createOverlay) {
    createOverlay.classList.remove('active');
  }
});

// Обработка создания плейлиста
confirmCreateBtn.addEventListener('click', () => {
  const name = playlistNameInput.value.trim();
  const desc = playlistDescInput.value.trim();

  if (!name) {
    alert('Введіть назву плейлісту');
    return;
  }

  // 👉 Здесь можно добавить сохранение в массив или localStorage
  console.log('✅ Створено плейліст:', { name, desc });

  // Закрываем окно
  createOverlay.classList.remove('active');
  playlistNameInput.value = '';
  playlistDescInput.value = '';
});
/* 🧠 Динамическое добавление плейлистов */
const sidebarLeft = document.querySelector('.sidebar-left');

function createPlaylistElement(name, desc) {
  // Обёртка плейлиста
  const playlistDiv = document.createElement('div');
  playlistDiv.classList.add('playlist');

  playlistDiv.innerHTML = `
    <img src="placeholder.jpg" alt="cover">
    <div class="info">
      <span>${name}</span>
      <small>${desc || 'автор'}</small>
    </div>
    <button class="menu-btn"><i class="fa-solid fa-ellipsis-vertical"></i></button>
    <div class="playlist-menu">
      <button class="delete-btn"><i class="fa-solid fa-trash"></i> Видалити</button>
      <button><i class="fa-solid fa-pen"></i> Редагувати</button>
      <button><i class="fa-solid fa-arrows-up-down-left-right"></i> Перемістити</button>
      <button><i class="fa-solid fa-shuffle"></i> Перемішати</button>
    </div>
  `;

  // Вставляем в DOM (после кнопки "Створити плейлист")
  sidebarLeft.appendChild(playlistDiv);

  // Навешиваем обработчики на новое меню
  const menuBtn = playlistDiv.querySelector('.menu-btn');
  const menu = playlistDiv.querySelector('.playlist-menu');

  menuBtn.addEventListener('click', e => {
    e.stopPropagation();
    const isActive = menu.classList.contains('active');

    document.querySelectorAll('.playlist-menu.active').forEach(m => m.classList.remove('active'));
    if (!isActive) menu.classList.add('active');
  });

  // Кнопка удаления с подтверждением
  const deleteBtn = playlistDiv.querySelector('.delete-btn');
  deleteBtn.addEventListener('click', () => {
    showDeleteModal(playlistDiv);
  });
}

/* 🧰 Модальное окно подтверждения удаления */
function showDeleteModal(playlistElement) {
  const modal = document.createElement('div');
  modal.className = 'modal-overlay active';
  modal.innerHTML = `
    <div class="modal">
      <p>Ви дійсно хочете видалити цей плейліст?</p>
      <div class="modal-actions">
        <button class="confirm-delete">Видалити</button>
        <button class="cancel-delete">Скасувати</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  modal.querySelector('.cancel-delete').addEventListener('click', () => {
    modal.remove();
  });

  modal.addEventListener('click', e => {
    if (e.target === modal) modal.remove();
  });

  modal.querySelector('.confirm-delete').addEventListener('click', () => {
    playlistElement.remove();
    modal.remove();
  });
}

/* 📝 Обновляем логику создания */
confirmCreateBtn.addEventListener('click', () => {
  const name = playlistNameInput.value.trim();
  const desc = playlistDescInput.value.trim();

  if (!name) {
    alert('Введіть назву плейлісту');
    return;
  }

  createPlaylistElement(name, desc);

  createOverlay.classList.remove('active');
  playlistNameInput.value = '';
  playlistDescInput.value = '';
});

