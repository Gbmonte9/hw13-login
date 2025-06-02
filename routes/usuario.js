var express = require('express');
var router = express.Router();
const db = require('../db');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const PDFDocument = require('pdfkit');
const { comparePasswords, hashPassword } = require('../bcrypt');

// Rota de exibição do usuário (GET)
router.get('/', function(req, res, next) {
    res.redirect('/');
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

const upload = multer({ storage: storage })

router.post('/', async function(req, res, next) {
  const { vemail, vsenha } = req.body;
  let verificacao = true;

  try {

    const user = await db.oneOrNone('SELECT * FROM usuarios WHERE email = $1', [vemail]);

    if (!user) {
      return res.render('index', { title: 'Index', message: 'Usuário não encontrado.', verificacao: false });
    }

    const acesso = await comparePasswords(vsenha, user.senha); 

    if (!acesso) {
      return res.render('index', { title: 'Index', message: 'Senha incorreta.', verificacao: false });
    }

    res.redirect(`/usuario/${user.id}`);


  } catch (err) {
    console.error(err);
    res.render('index', { title: 'Index', message: 'Erro no login.', verificacao: false });
  }
});

// Rota de exibição do usuário (GET)
router.get('/:id', async function(req, res, next) {
  const id = req.params.id;

  try {
    const user = await db.oneOrNone('SELECT * FROM usuarios WHERE id = $1', [id]);

    if (!user) {
      return res.render('index', { title: 'Index', message: 'Usuário não encontrado.', verificacao: false });
    }

    res.render('usuario', { title: 'Usuário', user });
  } catch (err) {
    console.error(err);
    res.render('index', { title: 'Index', message: 'Erro ao buscar usuário.', verificacao: false });
  }
});

router.get('/:id/download', async (req, res) => {
  const id = req.params.id;

  try {
    const user = await db.oneOrNone('SELECT * FROM usuarios WHERE id = $1', [id]);

    if (!user) {
      return res.render('usuario', {
        title: 'Usuário',
        message: 'Usuário não encontrado.',
        verificacao: false
      });
    }

    const doc = new PDFDocument();

    const pdfFileName = `usuario_${user.id}.pdf`;

    res.setHeader('Content-Disposition', `attachment; filename=${pdfFileName}`);
    res.setHeader('Content-Type', 'application/pdf');

    doc.pipe(res);

    doc.fontSize(20).text(`Usuário: ${user.nome}`, { underline: true });
    doc.moveDown();
    doc.fontSize(16).text(`Email: ${user.email}`);
    doc.moveDown();

    if (user.file) {
      let fileName = user.file;
      if (fileName.startsWith('uploads/')) {
        fileName = fileName.replace('uploads/', '');
      }
      const imagePath = path.join(__dirname, '..', 'public', 'uploads', fileName);

      if (fs.existsSync(imagePath)) {
        doc.image(imagePath, {
          fit: [150, 150],
          align: 'center',
          valign: 'center'
        });
      } else {
        doc.fontSize(12).fillColor('red').text('Imagem não encontrada.');
      }
    } else {
      doc.fontSize(12).text('Usuário não possui foto.');
    }

    doc.end();

  } catch (err) {
    console.error(err);
    res.render('index', {
      title: 'Index',
      message: 'Erro ao buscar usuário.',
      verificacao: false
    });
  }
});

router.get('/:id/deleta', async function(req, res, next) {
  const id = req.params.id;

  try {

    const user = await db.oneOrNone('SELECT * FROM usuarios WHERE id = $1', [id]);

    if (!user) {
      return res.render('index', { title: 'usuario', message: 'Usuário não encontrado.', verificacao: false });
    }

    await db.none('DELETE FROM usuarios WHERE id = $1', [id]);

    res.render('index', { title: 'usuario', message: 'Usuário deletado com sucesso.', verificacao: true });
  } catch (err) {
    console.error(err);
    res.render('index', { title: 'usuario', message: 'Erro ao deletar usuário.', verificacao: false });
  }
});

router.get('/:id/editar', async function(req, res, next) {
  const id = req.params.id;

  try {
    const user = await db.oneOrNone('SELECT * FROM usuarios WHERE id = $1', [id]);

    if (!user) {
      return res.render('usuario', { title: 'Index', message: 'Usuário não encontrado.', verificacao: false });
    }

    delete user.senha;

    res.render('usuarioeditar', { title: 'Usuário', user });
  } catch (err) {
    console.error(err);
    res.render('index', { title: 'Index', message: 'Erro ao buscar usuário.', verificacao: false });
  }
});

router.post('/:id/atualizar', upload.single('vavatar'), async (req, res) => {
  const id = req.params.id;
  const { vnome, vemail, vsenha } = req.body;  
  const file = req.file ? `uploads/${req.file.filename}` : null;

  try {
    let senhaHashed = null;
    if (vsenha && vsenha.trim() !== '') {
      senhaHashed = await hashPassword(vsenha);
    }

    if (file && senhaHashed) {
      await db.none(
        'UPDATE usuarios SET nome = $1, email = $2, senha = $3, file = $4 WHERE id = $5',
        [vnome.trim(), vemail, senhaHashed, file, id]
      );
    } else if (file) {
      await db.none(
        'UPDATE usuarios SET nome = $1, email = $2, file = $3 WHERE id = $4',
        [vnome.trim(), vemail, file, id]
      );
    } else if (senhaHashed) {
      await db.none(
        'UPDATE usuarios SET nome = $1, email = $2, senha = $3 WHERE id = $4',
        [vnome.trim(), vemail, senhaHashed, id]
      );
    } else {
      await db.none(
        'UPDATE usuarios SET nome = $1, email = $2 WHERE id = $3',
        [vnome.trim(), vemail, id]
      );
    }

    const user = await db.one('SELECT * FROM usuarios WHERE id = $1', [id]);

    res.render('usuario', {
      title: 'Usuário',
      user,
      message: 'Usuário atualizado com sucesso!',
      verificacao: true
    });
  } catch (err) {
    console.error(err);
    res.render('usuarioeditar', {
      title: 'Editar Usuário',
      user: { id, nome: vnome, email: vemail },
      message: 'Erro ao atualizar usuário.',
      verificacao: false
    });
  }
});


module.exports = router;
