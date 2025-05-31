var express = require('express');
var router = express.Router();
const db = require('../db');
const { comparePasswords } = require('../bcrypt');

// Rota de exibição do usuário (GET)
router.get('/', function(req, res, next) {
    res.redirect('/');
});

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


module.exports = router;
