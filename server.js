require('dotenv').config();
const express = require('express');
const multer = require('multer');
const axios = require('axios');
const FormData = require('form-data');
const cors = require('cors');

const app = express();

// Mengizinkan lalu lintas data dari domain Vercel Anda
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Menyimpan file gambar sementara di memori RAM Vercel
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Menyajikan file statis halaman utama dari folder public
app.use(express.static(__dirname));


// RUTE UTAMA PEMROSESAN GAMBAR HAPUS BACKGROUND
app.post('/remove-bg', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Mohon unggah file gambar terlebih dahulu.' });
        }

        // Menyusun data untuk dikirim ke API Remove.bg
        const formData = new FormData();
        formData.append('size', 'auto');
        formData.append('image_file', req.file.buffer, {
            filename: req.file.originalname || 'image.jpg',
            contentType: req.file.mimetype
        });

        // Menembak langsung ke API resmi Remove.bg
        const response = await axios({
            method: 'post',
            url: 'https://remove.bg',
            data: formData,
            headers: {
                ...formData.getHeaders(),
                'X-Api-Key': process.env.REMOVE_BG_API_KEY
            },
            responseType: 'arraybuffer'
        });

        // Mengubah hasil gambar mentah menjadi format teks Base64 yang aman untuk browser
        const base64Image = Buffer.from(response.data).toString('base64');
        const imageUrl = `data:${req.file.mimetype};base64,${base64Image}`;

        // Mengirimkan hasil akhir kembali ke browser Anda
        return res.status(200).json({
            message: 'Background berhasil dihapus!',
            imageUrl: imageUrl
        });

    } catch (error) {
        console.error('Detail Error Serverless:', error.message);
        return res.status(500).json({ error: 'Gagal memproses gambar melalui API Cloud.' });
    }
});

// Mengekspor aplikasi Express agar dikenali oleh sistem Serverless Handler Vercel
module.exports = app;
