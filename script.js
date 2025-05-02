// Konfigurasi
const API_URL = 'https://animeschedule.net/api/v3'; // Ganti dengan API sebenarnya
const UPDATE_INTERVAL = 6 * 60 * 60 * 1000; // Pembaruan setiap 6 jam
const DAILY_RESET_TIME = 3; // Jam 3 pagi waktu reset harian (WIB)

// Variabel state
let animeData = [];
let lastUpdateTime = null;
let scheduledUpdate = null;

// Elemen DOM
const animeGrid = document.getElementById('animeGrid');
const dayFilter = document.getElementById('dayFilter');
const searchInput = document.getElementById('searchInput');
const loadingSpinner = document.getElementById('loadingSpinner');
const errorMessage = document.getElementById('errorMessage');
const retryButton = document.getElementById('retryButton');
const currentDateElement = document.getElementById('currentDate');
const lastUpdatedElement = document.getElementById('lastUpdated');
const refreshButton = document.getElementById('refreshButton');

// Inisialisasi
document.addEventListener('DOMContentLoaded', () => {
    initDateDisplay();
    initDayFilters();
    loadAnimeData();
    
    // Event listeners
    retryButton.addEventListener('click', loadAnimeData);
    searchInput.addEventListener('input', handleSearch);
    refreshButton.addEventListener('click', forceRefresh);
    
    // Setup auto-update
    setupAutoUpdate();
});

// Fungsi untuk menampilkan tanggal terkini
function initDateDisplay() {
    const now = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    currentDateElement.textContent = `Jadwal tayang anime hari ini, ${now.toLocaleDateString('id-ID', options)}`;
}

// Fungsi untuk setup pembaruan otomatis
function setupAutoUpdate() {
    // Pembaruan berkala
    scheduledUpdate = setInterval(() => {
        checkForDailyUpdate();
    }, UPDATE_INTERVAL);
    
    // Cek pertama kali
    checkForDailyUpdate();
}

// Fungsi untuk cek perlu update harian
function checkForDailyUpdate() {
    const now = new Date();
    const hours = now.getHours();
    
    // Jika sudah lewat waktu reset harian dan data terakhir belum diupdate hari ini
    if (hours >= DAILY_RESET_TIME && 
        (!lastUpdateTime || isDifferentDay(lastUpdateTime, now))) {
        forceRefresh();
    }
}

// Fungsi untuk cek apakah tanggal berbeda
function isDifferentDay(date1, date2) {
    return date1.getDate() !== date2.getDate() || 
           date1.getMonth() !== date2.getMonth() || 
           date1.getFullYear() !== date2.getFullYear();
}

// Fungsi untuk memuat data anime
async function loadAnimeData() {
    showLoading();
    hideError();
    
    try {
        // Tampilkan status pembaruan
        lastUpdatedElement.innerHTML = '<i class="fas fa-sync-alt"></i> Memperbarui jadwal...';
        
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error('Gagal memuat data');
        
        const data = await response.json();
        animeData = processScheduleData(data);
        lastUpdateTime = new Date();
        
        renderAnimeCards(animeData);
        updateLastUpdatedText();
        hideLoading();
    } catch (error) {
        console.error('Error:', error);
        showError();
        hideLoading();
        lastUpdatedElement.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Gagal memperbarui';
    }
}

// Fungsi untuk memproses data jadwal
function processScheduleData(data) {
    // Proses data mentah dari API
    return data.map(item => ({
        id: item.id,
        title: item.title,
        day: translateDay(item.schedule.day),
        time: formatTime(item.schedule.time),
        episode: item.episode.current ? 
               `${item.episode.current}/${item.episode.total || '?'}` : 
               'Selesai',
        platforms: item.platforms,
        status: item.status === 'ongoing' ? 'Ongoing' : 'Completed',
        rating: item.rating ? item.rating.toFixed(2) : 'N/A',
        thumbnail: item.thumbnail || getDefaultThumbnail(item.id)
    }));
}

// Fungsi untuk menerjemahkan hari
function translateDay(englishDay) {
    const days = {
        'Sunday': 'Minggu',
        'Monday': 'Senin',
        'Tuesday': 'Selasa',
        'Wednesday': 'Rabu',
        'Thursday': 'Kamis',
        'Friday': 'Jumat',
        'Saturday': 'Sabtu'
    };
    return days[englishDay] || englishDay;
}

// Fungsi untuk format waktu
function formatTime(timeString) {
    // Konversi dari format "14:30" ke "14:30" (24 jam) atau bisa diubah ke 12 jam jika perlu
    return timeString;
}

// Fungsi untuk force refresh
function forceRefresh() {
    // Tampilkan animasi refresh
    refreshButton.classList.add('refreshing');
    
    // Clear scheduled update
    if (scheduledUpdate) {
        clearInterval(scheduledUpdate);
    }
    
    // Load data baru
    loadAnimeData().finally(() => {
        refreshButton.classList.remove('refreshing');
        
        // Setup ulang auto-update
        setupAutoUpdate();
    });
}

// Fungsi untuk update teks "terakhir diperbarui"
function updateLastUpdatedText() {
    if (!lastUpdateTime) return;
    
    const now = new Date();
    const diffInMinutes = Math.floor((now - lastUpdateTime) / (1000 * 60));
    
    let timeText;
    if (diffInMinutes < 1) {
        timeText = 'beberapa detik yang lalu';
    } else if (diffInMinutes < 60) {
        timeText = `${diffInMinutes} menit yang lalu`;
    } else if (diffInMinutes < 24 * 60) {
        const hours = Math.floor(diffInMinutes / 60);
        timeText = `${hours} jam yang lalu`;
    } else {
        const days = Math.floor(diffInMinutes / (60 * 24));
        timeText = `${days} hari yang lalu`;
    }
    
    lastUpdatedElement.innerHTML = `<i class="fas fa-clock"></i> Diperbarui ${timeText} | <i class="fas fa-redo"></i> Auto-update setiap 6 jam`;
}

/* ... (fungsi-fungsi lainnya seperti renderAnimeCards, filterAnime, dll tetap sama) ... */
