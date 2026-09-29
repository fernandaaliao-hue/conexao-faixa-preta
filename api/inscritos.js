import { timingSafeEqual } from "node:crypto";
import { db, garantirTabela } from "../lib/db.js";

function autorizado(req) {
  const esperado = process.env.ADMIN_KEY || "";
  const veio = (req.headers.authorization || "").replace(/^Bearer\s+/i, "");
  if (!esperado || !veio) return false; // sem chave configurada, ninguém entra
  const a = Buffer.from(veio), b = Buffer.from(esperado);
  return a.length === b.length && timingSafeEqual(a, b);
}

const csvCel = (v) => {
  const s = v == null ? "" : String(v);
  return /[;"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (!autorizado(req)) return res.status(401).json({ ok: false, erro: "Chave inválida." });
  try {
    await garantirTabela();
    const linhas = await db()`
      SELECT nome, celular, email, faixa_etaria, faixa, grau, beneficente, projeto, criado_em
      FROM inscricoes ORDER BY criado_em DESC`;
    if (req.query.formato === "csv") {
      const cab = ["Nome", "Celular", "E-mail", "Faixa etária", "Faixa", "Grau", "Projeto beneficente", "Qual projeto", "Inscrito em"];
      const corpo = linhas.map((l) => [
        l.nome, l.celular, l.email, l.faixa_etaria, l.faixa, l.grau ?? "",
        l.beneficente ? "Sim" : "Não", l.projeto ?? "",
        new Date(l.criado_em).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" }),
      ].map(csvCel).join(";"));
      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader("Content-Disposition", 'attachment; filename="inscritos-conexao-faixa-preta.csv"');
      return res.status(200).send("﻿" + [cab.join(";"), ...corpo].join("\r\n"));
    }
    return res.status(200).json({ ok: true, total: linhas.length, inscritos: linhas });
  } catch (e) {
    console.error("inscritos:", e);
    return res.status(500).json({ ok: false, erro: "Falha ao ler o banco." });
  }
}
