
require('dotenv').config();
const express = require('express');
const multer = require('multer');
const axios = require('axios');
const FormData = require('form-data');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

app.use(express.static('public'));

// Rute API pemrosesan gambar
app.post('/api/remove-bg', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Mohon unggah file gambar terlebih dahulu.' });
        }

        const formData = new FormData();
        formData.append('size', 'auto');
        formData.append('image_file', req.file.buffer, {
            filename: req.file.originalname || 'image.jpg',
            contentType: req.file.mimetype
        });

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

        const base64Image = Buffer.from(response.data).toString('base64');
        const imageUrl = `data:${req.file.mimetype};base64,${base64Image}`;

        return res.status(200).json({
            message: 'Background berhasil dihapus!',
            imageUrl: imageUrl
        });

    } catch (error) {
        console.error('Error info:', error.message);
        return res.status(500).json({ error: 'Gagal memproses gambar melalui API Cloud.' });
    }
});

// Mengekspor aplikasi murni tanpa app.listen lokal agar tidak crash di Vercel
module.exports = app;
