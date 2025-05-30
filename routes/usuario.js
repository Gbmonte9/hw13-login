var express = require('express');
var router = express.Router();
const db = require('../db');
const { comparePasswords } = require('../bcrypt');

// Rota de exibição do usuário (GET)
router.get('/', async function(req, res, next) {
    return res.render('index', { title: 'Express'});
});

router.post('/', async function(req, res, next) {
  const { vemail, vsenha } = req.body;

  try {

    const user = await db.oneOrNone('SELECT * FROM usuarios WHERE email = $1', [vemail]);

    if (!user) {
      return res.render('index', { title: 'Express', error: 'Usuário não encontrado.' });
    }

    const acesso = await comparePasswords(vsenha, user.senha); 

    if (!acesso) {
      return res.render('index', { title: 'Express', error: 'Senha incorreta.' });
    }

    res.redirect(`/usuario/${user.id}`);

    router.get('/:id', function(req, res, next) {
      const id = req.params.id;
      res.render('usuario', { title: 'Usuario' });
    });

  } catch (err) {
    console.error(err);
    res.render('index', { title: 'Express', error: 'Erro no login.' });
  }
});

// Rota de exibição do usuário (GET)
router.get('/:id', async function(req, res, next) {
  const id = req.params.id;

  try {
    const user = await db.oneOrNone('SELECT * FROM usuarios WHERE id = $1', [id]);

    if (!user) {
      return res.render('index', { title: 'Express', error: 'Usuário não encontrado.' });
    }

    res.render('usuario', { title: 'Usuário', user });
  } catch (err) {
    console.error(err);
    res.render('index', { title: 'Express', error: 'Erro ao buscar usuário.' });
  }
});


module.exports = router;
