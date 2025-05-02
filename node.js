// server.js - Contoh backend untuk generate jadwal harian
const express = require('express');
const axios = require('axios');
const cron = require('node-cron');
const app = express();

// Database sederhana (dalam produksi gunakan database sesungguhnya)
let animeSchedule = [];

// Fungsi untuk mengambil data anime dari sumber eksternal
async function fetchAnimeData() {
    try {
        // Contoh: Ambil dari MyAnimeList API atau sumber lainnya
        const response = await axios.get('https://api.myanimelist.net/v2/anime/season', {
            params: {
                season: getCurrentSeason(),
                year: new Date().getFullYear(),
                sort: 'anime_num_list_users',
                limit: 50
            },
            headers: {
                'X-MAL-CLIENT-ID': 'YOUR_CLIENT_ID'
            }
        });
        
        // Proses data untuk dijadikan jadwal
        const processedData = processAnimeData(response.data.data);
        
        // Simpan ke database
        animeSchedule = generateDailySchedule(processedData);
        
        console.log('Jadwal anime telah diperbarui:', new Date());
    } catch (error) {
        console.error('Gagal memperbarui jadwal anime:', error);
    }
}

// Jadwalkan pembaruan setiap hari jam 3 pagi WIB
cron.schedule('0 3 * * *', () => {
    console.log('Memulai pembaruan jadwal harian...');
    fetchAnimeData();
}, {
    timezone: "Asia/Jakarta"
});

// Endpoint untuk client
app.get('/api/schedule', (req, res) => {
    res.json({
        lastUpdated: new Date(),
        schedule: animeSchedule
    });
});

// Jalankan server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server berjalan di port ${PORT}`);
    fetchAnimeData(); // Jalankan pertama kali saat server start
});

// Fungsi bantuan
function getCurrentSeason() {
    const month = new Date().getMonth() + 1;
    if (month >= 1 && month <= 3) return 'winter';
    if (month >= 4 && month <= 6) return 'spring';
    if (month >= 7 && month <= 9) return 'summer';
    return 'fall';
}

function processAnimeData(animeList) {
    // Proses data mentah menjadi format yang diinginkan
    return animeList.map(anime => ({
        id: anime.node.id,
        title: anime.node.title,
        // ... properti lainnya
    }));
}

function generateDailySchedule(animeData) {
    // Generate jadwal harian berdasarkan data anime
    // Ini adalah contoh sederhana, dalam produksi bisa lebih kompleks
    const days = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
    const schedule = [];
    
    animeData.forEach((anime, index) => {
        const dayIndex = index % days.length;
        const timeHour = 8 + Math.floor(index / days.length) * 2; // Generate waktu tayang
        
        schedule.push({
            ...anime,
            schedule: {
                day: days[dayIndex],
                time: `${timeHour}:00`
            },
            status: Math.random() > 0.7 ? 'completed' : 'ongoing',
            // ... properti lainnya
        });
    });
    
    return schedule;
}