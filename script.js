const CLIENT_ID = '2b6cb1ee'; // замініть на свій клю
const trackNameEl = document.querySelector('.track-name');
const coverEl = document.querySelector('.cover img');
const playBtn = document.querySelector('.play');

let audio = null;
let trackUrl = '';
let trackImage = '';
let trackName = '';

let trackIndex = 0;
let genre = 'electronic';

function fetchTrack() {
  fetch(`https://api.jamendo.com/v3.0/tracks/?client_id=${CLIENT_ID}&format=json&limit=200&tags=${genre}`)
    .then(res => res.json())
    .then(data => {
      console.log('Jamendo response:', data); // Додаємо логування
      const track = data.results[trackIndex];
      if (!track) {
        alert('Трек не знайдено!');
        return;
      }
      trackUrl = track.audio;
      trackImage = track.image;
      trackName = track.name;

      coverEl.src = trackImage;
      trackNameEl.textContent = trackName;

      if (audio) {
        audio.pause();
      }
      audio = new Audio(trackUrl);
      attachAudioEvents();
      playBtn.textContent = '▶';

    })
    .catch(err => {
      console.error('Помилка запиту:', err);
      alert('Не вдалося отримати трек!');
    });
}

const seekBar = document.querySelector('.seek-bar');

// Оновлюємо прогрес-бар під час відтворення
function updateSeekBar() {
  if (audio && audio.duration) {
    seekBar.max = Math.floor(audio.duration);
    seekBar.value = Math.floor(audio.currentTime);
  }
}

// Слухаємо подію timeupdate для аудіо
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

// Перемотування по прогрес-бару
seekBar.addEventListener('input', () => {
  if (audio) {
    audio.currentTime = seekBar.value;
  }
});

// Оновлений обробник playBtn
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
