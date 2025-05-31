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
  let verificacao = true;
  const id = nanoid(); 

  if (!vnome || !vemail || !vsenha || !vsenha1) {
    return res.render('cadastro', { title: 'Cadastro', message: 'Preencha todos os campos.', verificacao: false });
  }

  if (vsenha !== vsenha1) {
    verificacao = false;
    return res.render('cadastro', { title: 'Cadastro', message: 'Senhas não coincidem.', verificacao: false });
  }

  try {

    const avatarFilename = avatarFile ? `uploads/${avatarFile.filename}` : null;
    console.log('Salvando arquivo:', avatarFilename);
    const hashedPassword = await hashPassword(vsenha);

    await db.none(
      'INSERT INTO usuarios (id, nome, email, senha, file) VALUES ($1, $2, $3, $4, $5)',
      [id, vnome.trim(), vemail, hashedPassword, avatarFilename]
    );

    res.render('cadastro', { title: 'Cadastro', message: 'Usuário cadastrado com sucesso!', verificacao: true });
  } catch (err) {
    console.error(err);
    let errorMsg = 'Erro ao cadastrar usuário.';
    if (err.code === '23505') {
      errorMsg = 'Este e-mail já está cadastrado.';
    }
    res.render('cadastro', { title: 'Cadastro', message: errorMsg, verificacao: false });
  }
});

module.exports = router;