import { neon } from "@neondatabase/serverless";

let sql = null;
let pronto = null;

// Conexão preguiçosa: a função não quebra no build se a env var faltar.
export function db() {
  if (!sql) sql = neon(process.env.DATABASE_URL);
  return sql;
}

// A tabela nasce na primeira chamada de cada instância (idempotente).
export function garantirTabela() {
  if (!pronto) {
    pronto = db()`
      CREATE TABLE IF NOT EXISTS inscricoes (
        id            serial PRIMARY KEY,
        nome          text NOT NULL,
        celular       text NOT NULL,
        email         text NOT NULL UNIQUE,
        faixa_etaria  text NOT NULL,
        faixa         text NOT NULL,
        grau          text,
        beneficente   boolean NOT NULL,
        projeto       text,
        criado_em     timestamptz NOT NULL DEFAULT now(),
        atualizado_em timestamptz NOT NULL DEFAULT now()
      )`.catch((e) => { pronto = null; throw e; });
  }
  return pronto;
}
