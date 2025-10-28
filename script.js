(() => {
  const CLIENT_ID = '2b6cb1ee';

  // основные элементы
  const trackNameEl = document.querySelector('.cover-title');
  const coverEl = document.querySelector('.cover img');
  const playBtn = document.querySelector('.play');
  const seekBar = document.querySelector('.seek-bar');
  const volumeIcon = document.querySelector('.volume-icon');
  const volumeSlider = document.querySelector('.volume-slider');
  const sidebarLeft = document.querySelector('.sidebar-left');
  const createBtn = document.querySelector('.create-playlist');
  const deleteModalOverlay = document.querySelector('.modal-overlay');
  const createOverlay = document.querySelector('.create-playlist-overlay');
  const coverTitleEditable = createOverlay.querySelector('.cover-title-editable');
  const confirmCreateBtn = createOverlay.querySelector('.confirm-create');
  const cancelCreateBtn = createOverlay.querySelector('.cancel-create');
  const recommendedContainerSelector = '.recommended-tracks';

  let audio = null;
  let trackUrl = '';
  let playlistToDelete = null;

  /* ===== 🎶 Загрузка основного трека ===== */
  function fetchTrack() {
    fetch(`https://api.jamendo.com/v3.0/tracks/?client_id=${CLIENT_ID}&format=json&limit=1`)
      .then(res => res.json())
      .then(data => {
        const track = data.results[0];
        if (!track) return;
        trackUrl = track.audio;
        coverEl.src = track.album_image;
        trackNameEl.textContent = track.name;
      })
      .catch(err => console.error('Помилка завантаження треку:', err));
  }
  fetchTrack();

  /* ===== ⏱ Seek bar ===== */
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
      audio.volume = parseFloat(volumeSlider?.value || 1);
      audio.play();
      playBtn.textContent = '⏸';
      attachAudioEvents();
    }
  });

  /* ===== 🔊 Volume ===== */
  if (volumeSlider) {
    volumeSlider.addEventListener('input', () => {
      const v = parseFloat(volumeSlider.value);
      if (audio) audio.volume = v;
      if (volumeIcon) {
        if (v === 0) volumeIcon.className = 'fa-solid fa-volume-xmark volume-icon';
        else if (v < 0.5) volumeIcon.className = 'fa-solid fa-volume-low volume-icon';
        else volumeIcon.className = 'fa-solid fa-volume-high volume-icon';
      }
    });
  }

  if (volumeIcon && volumeSlider) {
    volumeIcon.addEventListener('click', () => {
      if (!audio) return;
      if (audio.muted) {
        audio.muted = false;
        volumeSlider.value = audio.volume;
      } else {
        audio.muted = true;
        volumeSlider.value = 0;
      }
      volumeSlider.dispatchEvent(new Event('input'));
    });
  }

  /* ===== 📋 Меню плейлистов ===== */
  document.addEventListener('click', (e) => {
    const menuBtn = e.target.closest('.menu-btn');
    if (menuBtn) {
      e.stopPropagation();
      const menu = menuBtn.parentElement.querySelector('.playlist-menu');
      const isActive = menu && menu.classList.contains('active');
      document.querySelectorAll('.playlist-menu.active').forEach(m => m.classList.remove('active'));
      if (menu && !isActive) menu.classList.add('active');
      return;
    }

    if (!e.target.closest('.playlist')) {
      document.querySelectorAll('.playlist-menu.active').forEach(m => m.classList.remove('active'));
    }

    const delBtn = e.target.closest('.delete-btn');
    if (delBtn) {
      e.stopPropagation();
      playlistToDelete = delBtn.closest('.playlist');
      if (deleteModalOverlay) deleteModalOverlay.classList.add('active');
      return;
    }
  });

  /* ===== 🗑️ Модалка удаления ===== */
  deleteModalOverlay.addEventListener('click', (e) => {
    if (e.target === deleteModalOverlay || e.target.closest('.cancel-delete')) {
      deleteModalOverlay.classList.remove('active');
      playlistToDelete = null;
    }
  });

  deleteModalOverlay.querySelector('.confirm-delete').addEventListener('click', () => {
    if (playlistToDelete) playlistToDelete.remove();
    deleteModalOverlay.classList.remove('active');
    playlistToDelete = null;
  });

  /* ===== 🎵 Рекомендованные треки ===== */
 function populateRecommendedTracks(limit = 3) {
  const container = createOverlay.querySelector(recommendedContainerSelector);
  if (!container) return;

  container.innerHTML = `<div style="color:#ddd;text-align:center;padding:12px;">Завантаження рекомендацій...</div>`;

  const url = `https://api.jamendo.com/v3.0/tracks/?client_id=${CLIENT_ID}&format=json&limit=6&order=rand&include=musicinfo`;

  fetch(url, { mode: 'cors' })
    .then(res => res.json())
    .then(data => {
      const results = (data && data.results) ? data.results : [];
      if (!results.length) throw new Error('no results');

      const renderTracks = (tracks) => tracks.map((t, i) => {
        const title = t.name || `Трек ${i + 1}`;
        const artist = t.artist_name || 'автор';
        const img = t.album_image || 'placeholder.jpg';
        const checked = i === 0 ? 'checked' : '';
        return `
          <label class="track-item" style="opacity:0; transform:translateY(10px); animation: fadeInTrack 0.4s forwards ${i * 0.05}s;">
            <input type="checkbox" ${checked}>
            <img class="rec-thumb" src="${img}" alt="thumb">
            <div class="track-info">
              <span>${escapeHtml(title)}</span>
              <small>${escapeHtml(artist)}</small>
            </div>
          </label>`;
      }).join('');

      const first = results.slice(0, limit);
      const rest = results.slice(limit);

      container.innerHTML = renderTracks(first);

      if (rest.length > 0) {
        const showMoreBtn = document.createElement('button');
        showMoreBtn.textContent = 'Показати ще';
        showMoreBtn.className = 'show-more-btn';
        showMoreBtn.addEventListener('click', () => {
          container.insertAdjacentHTML('beforeend', renderTracks(rest));
          showMoreBtn.remove();
        });
        container.appendChild(showMoreBtn);
      }
    })
    .catch(() => {
      // 🌈 Fallback треки при сбое Jamendo
      const fallback = [
        { title: 'Fallback трек 1', artist: 'автор A' },
        { title: 'Fallback трек 2', artist: 'автор B' },
        { title: 'Fallback трек 3', artist: 'автор C' },
      ];

      container.innerHTML = fallback.map((t, i) => `
        <label class="track-item" style="opacity:0; transform:translateY(10px); animation: fadeInTrack 0.4s forwards ${i * 0.05}s;">
          <input type="checkbox" ${i === 0 ? 'checked' : ''}>
          <img class="rec-thumb" src="placeholder.jpg" alt="thumb">
          <div class="track-info">
            <span>${t.title}</span>
            <small>${t.artist}</small>
          </div>
        </label>`).join('');
    });
}

  /* ===== 🪄 Модалка создания плейлиста ===== */
  if (createBtn) {
    createBtn.addEventListener('click', () => {
      populateRecommendedTracks(3);
      createOverlay.classList.add('active');
      setTimeout(() => coverTitleEditable.focus(), 100);
    });
  }

  cancelCreateBtn.addEventListener('click', () => {
    createOverlay.classList.remove('active');
    coverTitleEditable.textContent = 'Назва плейлісту';
  });

  createOverlay.addEventListener('click', (e) => {
    if (e.target === createOverlay) createOverlay.classList.remove('active');
  });

  function escapeHtml(t) {
    return String(t || '').replace(/[&<>"]/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[s]));
  }

  function createPlaylistElement(name, desc) {
    const p = document.createElement('div');
    p.className = 'playlist';
    p.innerHTML = `
      <img src="placeholder.jpg" alt="cover">
      <div class="info">
        <span>${escapeHtml(name)}</span>
        <small>${escapeHtml(desc || 'автор')}</small>
      </div>
      <button class="menu-btn"><i class="fa-solid fa-ellipsis-vertical"></i></button>
      <div class="playlist-menu">
        <button class="delete-btn"><i class="fa-solid fa-trash"></i> Видалити</button>
        <button><i class="fa-solid fa-pen"></i> Редагувати</button>
        <button><i class="fa-solid fa-arrows-up-down-left-right"></i> Перемістити</button>
        <button><i class="fa-solid fa-shuffle"></i> Перемішати</button>
      </div>`;
    sidebarLeft.appendChild(p);
    p.querySelector('.delete-btn').addEventListener('click', () => {
      playlistToDelete = p;
      deleteModalOverlay.classList.add('active');
    });
    return p;
  }

  confirmCreateBtn.addEventListener('click', () => {
    const name = (coverTitleEditable?.textContent || '').trim();
    if (!name) return alert('Введіть назву плейлісту');
    const checked = Array.from(createOverlay.querySelectorAll('.recommended-tracks input:checked'));
    const desc = checked.map(ch => ch.closest('.track-item')?.querySelector('.track-info span')?.textContent)
      .filter(Boolean).slice(0,2).join(', ') || 'автор';
    const tracksData = checked.map(ch => {
      const item = ch.closest('.track-item');
      return {
        title: item.querySelector('.track-info span')?.textContent || '',
        artist: item.querySelector('.track-info small')?.textContent || '',
        img: item.querySelector('.rec-thumb')?.src || 'placeholder.jpg'
      };
    });
    const playlist = createPlaylistElement(name, desc);
    playlist.dataset.tracks = JSON.stringify(tracksData);
    createOverlay.classList.remove('active');
    coverTitleEditable.textContent = 'Назва плейлісту';
  });

  /* ===== 🎧 Открытие плейлистов ===== */
  sidebarLeft.addEventListener('click', (e) => {
    const playlist = e.target.closest('.playlist');
    if (!playlist || e.target.closest('.menu-btn')) return;
    const info = playlist.querySelector('.info span').textContent;
    const cover = playlist.querySelector('img').src;
    trackNameEl.textContent = info;
    coverEl.src = cover;
    const player = document.querySelector('.player');
    player.style.opacity = '0';
    setTimeout(() => player.style.opacity = '1', 200);
    const tracks = playlist.dataset.tracks ? JSON.parse(playlist.dataset.tracks) : [];
    renderPlaylistTracks(tracks);
  });

  function renderPlaylistTracks(tracks) {
    const player = document.querySelector('.player');
    const oldView = player.querySelector('.playlist-view');
    if (oldView) oldView.remove();
    const listWrapper = document.createElement('div');
    listWrapper.className = 'playlist-view';
    const header = document.createElement('div');
    header.className = 'playlist-header';
    header.innerHTML = `
      <img src="${coverEl.src}" alt="Cover">
      <div class="details">
        <h2>${escapeHtml(trackNameEl.textContent)}</h2>
        <p>${tracks.length} треків • Створено вами</p>
      </div>`;
    listWrapper.appendChild(header);
    const list = document.createElement('div');
    list.className = 'playlist-tracks';
    tracks.forEach((t, i) => {
      const div = document.createElement('div');
      div.className = 'track';
      div.innerHTML = `
        <div class="track-left">
          <img src="${t.img || 'placeholder.jpg'}" alt="Track">
          <div class="info">
            <span>${escapeHtml(t.title)}</span>
            <small>${escapeHtml(t.artist)}</small>
          </div>
        </div>
        <div class="track-time">${Math.floor(Math.random()*3)+2}:${String(Math.floor(Math.random()*60)).padStart(2,'0')}</div>`;
      list.appendChild(div);
    });
    listWrapper.appendChild(list);
    player.appendChild(listWrapper);
  }
  let currentPlaylistTracks = [];
  let currentTrackIndex = 0;

  function playTrack(index) {
    if (!currentPlaylistTracks.length) return;
    currentTrackIndex = (index + currentPlaylistTracks.length) % currentPlaylistTracks.length;
    const t = currentPlaylistTracks[currentTrackIndex];
    trackNameEl.textContent = t.title;
    coverEl.src = t.img || 'placeholder.jpg';

    if (audio) audio.pause();
    audio = new Audio(trackUrl);
    audio.src = t.audio || trackUrl; // если аудио не задано, подставляем основной trackUrl
    audio.volume = parseFloat(volumeSlider?.value || 1);
    audio.play();
    playBtn.textContent = '⏸';
    attachAudioEvents();
  }

  // Обновляем renderPlaylistTracks
  function renderPlaylistTracks(tracks) {
    const player = document.querySelector('.player');
    const oldView = player.querySelector('.playlist-view');
    if (oldView) oldView.remove();

    currentPlaylistTracks = tracks;
    currentTrackIndex = 0;

    const listWrapper = document.createElement('div');
    listWrapper.className = 'playlist-view';
    const header = document.createElement('div');
    header.className = 'playlist-header';
    header.innerHTML = `
      <img src="${coverEl.src}" alt="Cover">
      <div class="details">
        <h2>${escapeHtml(trackNameEl.textContent)}</h2>
        <p>${tracks.length} треків • Створено вами</p>
      </div>`;
    listWrapper.appendChild(header);

    const list = document.createElement('div');
    list.className = 'playlist-tracks';

    tracks.forEach((t, i) => {
      const div = document.createElement('div');
      div.className = 'track';
      div.innerHTML = `
        <div class="track-left">
          <img src="${t.img || 'placeholder.jpg'}" alt="Track">
          <div class="info">
            <span>${escapeHtml(t.title)}</span>
            <small>${escapeHtml(t.artist)}</small>
          </div>
        </div>
        <div class="track-time">${Math.floor(Math.random()*3)+2}:${String(Math.floor(Math.random()*60)).padStart(2,'0')}</div>`;
      div.addEventListener('click', () => playTrack(i));
      list.appendChild(div);
    });

    listWrapper.appendChild(list);
    player.appendChild(listWrapper);
  }

  // ====== Кнопки вперед / назад ======
  const prevBtn = document.querySelector('.prev');
  const nextBtn = document.querySelector('.next');

  if (prevBtn) prevBtn.addEventListener('click', () => playTrack(currentTrackIndex - 1));
  if (nextBtn) nextBtn.addEventListener('click', () => playTrack(currentTrackIndex + 1));

  /* ===== ✏️ Меню кнопок ===== */
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.playlist-menu button');
    if (!btn) return;
    const p = btn.closest('.playlist');
    if (!p) return;
    if (btn.querySelector('.fa-pen')) {
      const t = p.querySelector('.info span');
      const s = p.querySelector('.info small');
      const n = prompt('Нова назва плейлісту', t.textContent) || t.textContent;
      const d = prompt('Новий опис', s.textContent) || s.textContent;
      t.textContent = n; s.textContent = d;
    }
    if (btn.querySelector('.fa-shuffle')) {
      alert(`🎵 Перемішано треки у "${p.querySelector('.info span').textContent}"`);
    }
  });

})();
