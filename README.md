"# hw13-login" 

## Cria a nova tabela com os campos conforme solicitado

CREATE TABLE usuarios (
  id TEXT PRIMARY KEY,            -- ID do tipo string (como o nanoid)
  nome TEXT NOT NULL,             -- Nome obrigatório
  email TEXT UNIQUE NOT NULL,     -- Email único e obrigatório
  senha TEXT NOT NULL,            -- Senha (criptografada), obrigatória
  file TEXT NOT NULL              -- Nome do arquivo (avatar), obrigatório
);