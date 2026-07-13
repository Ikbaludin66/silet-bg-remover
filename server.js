require('dotenv').config();
const express = require('express');
const multer = require('multer');
const axios = require('axios');
const FormData = require('form-data');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Menyajikan file statis dari folder public jika tersedia
app.use(express.static(path.join(__dirname, 'public')));

// PERBAIKAN: Menambahkan rute manual untuk membaca index.html jika folder public tidak terbaca otomatis

app.post('/remove-bg', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Mohon unggah file gambar terlebih dahulu.' });
        }

        const formData = new FormData();
        formData.append('size', 'auto');
        formData.append('image_file', req.file.buffer, {
            filename: req.file.originalname,
            contentType: req.file.mimetype
        });

        const response = await axios({
            method: 'post',
            url: 'https://remove.bg', 
            data: formData,
            headers: {
                ...formData.getHeaders(),
                'X-Api-Key': process.env.REMOVE_BG_API_KEY, 
            },
            responseType: 'arraybuffer'
        });

        const base64Image = Buffer.from(response.data).toString('base64');
        const imageUrl = `data:${req.file.mimetype};base64,${base64Image}`;

        res.json({
            message: 'Background berhasil dihapus!',
            imageUrl: imageUrl
        });

    } catch (error) {
        if (error.response && error.response.data) {
            try {
                const errorText = Buffer.from(error.response.data).toString();
                console.error('Pesan Kegagalan API:', error.response.status, errorText);
            } catch (e) {
                console.error('Terjadi kesalahan API:', error.message);
            }
        } else {
            console.error('Terjadi kesalahan Lokal:', error.message);
        }
        res.status(500).json({ error: 'Gagal memproses gambar melalui API.' });
    }
});

module.exports = app;

if (process.env.NODE_ENV !== 'production') {
    app.listen(port, () => {
        console.log(`Server running at http://localhost:${port}`);
    });
}
