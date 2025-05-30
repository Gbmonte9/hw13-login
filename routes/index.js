var express = require('express');
var router = express.Router();
const db = require('../db');
const { comparePasswords } = require('../bcrypt');

router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
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

    res.render('usuario', { title: 'Usuário', user });

  } catch (err) {
    console.error(err);
    res.render('index', { title: 'Express', error: 'Erro no login.' });
  }
});


module.exports = router;
