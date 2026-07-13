// 1. Tambahkan baris ini di PALING ATAS file (Baris nomor 1)
require('dotenv').config();

const express = require('express');
const multer = require('multer');
const axios = require('axios');
const FormData = require('form-data');
const path = require('path');
const fs = require('fs');

const app = express();
// 2. Ubah port agar fleksibel saat diunggah ke server hosting internet nanti
const port = process.env.PORT || 3000;



const upload = multer({ dest: 'uploads/' });

app.use(express.static(path.join(__dirname, 'public')));

app.post('/remove-bg', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Mohon unggah file gambar terlebih dahulu.' });
        }

        const inputPath = req.file.path;
        const outputFileName = `no-bg-${Date.now()}.png`;
        const outputPath = path.join(__dirname, 'public', outputFileName);

        const formData = new FormData();
        formData.append('size', 'auto');
        formData.append('image_file', fs.createReadStream(inputPath));

        const response = await axios({
            method: 'post',
            url: 'https://remove.bg', 
            data: formData,
            headers: {
                ...formData.getHeaders(),
                // 3. PERBAIKAN: Mengambil API Key dari file .env secara aman
                'X-Api-Key': process.env.REMOVE_BG_API_KEY, 
            },
            responseType: 'arraybuffer'
        });

        fs.writeFileSync(outputPath, response.data);
        fs.unlinkSync(inputPath); 

        res.json({
            message: 'Background berhasil dihapus!',
            imageUrl: `/${outputFileName}`
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

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
module.exports = app;
