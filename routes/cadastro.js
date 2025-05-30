var express = require('express');
var router = express.Router();
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const db = require('../db');
const { hashPassword } = require('../bcrypt');
const { nanoid } = require('nanoid');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('cadastro', { title: 'Express' });
});

const uploadDir = path.join(__dirname, '..', 'public', 'uploads');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'public/uploads'),
    filename: (req, file, cb) => {
      const uniquePrefix = Date.now();
      cb(null, uniquePrefix + '-' + file.originalname);
    }
});

const upload = multer({ storage });

router.post('/', upload.single('vavatar'), async (req, res) => {
  const { vnome, vemail, vsenha, vsenha1 } = req.body;
  const avatarFile = req.file;
  const id = nanoid(); 

  if (!vnome || !vemail || !vsenha || !vsenha1) {
    return res.render('cadastro', { title: 'Cadastro', error: 'Preencha todos os campos.' });
  }

  if (vsenha !== vsenha1) {
    return res.render('cadastro', { title: 'Cadastro', error: 'Senhas não coincidem.' });
  }

  try {

    const avatarFilename = avatarFile ? `uploads/${avatarFile.filename}` : null;
    console.log('Salvando arquivo:', avatarFilename);
    const hashedPassword = await hashPassword(vsenha);

    await db.none(
      'INSERT INTO usuarios (id, nome, email, senha, file) VALUES ($1, $2, $3, $4, $5)',
      [id, vnome.trim(), vemail, hashedPassword, avatarFilename]
    );

    res.render('cadastro', { title: 'Cadastro', success: 'Usuário cadastrado com sucesso!' });
  } catch (err) {
    console.error(err);
    let errorMsg = 'Erro ao cadastrar usuário.';
    if (err.code === '23505') {
      errorMsg = 'Este e-mail já está cadastrado.';
    }
    res.render('cadastro', { title: 'Cadastro', error: errorMsg });
  }
});

module.exports = router;