import { db, garantirTabela } from "../lib/db.js";

// As opções vivem aqui E no formulário: o servidor nunca grava valor que a tela não oferece.
export const FAIXAS_ETARIAS = ["Menos de 18", "18 a 24", "25 a 34", "35 a 44", "45 a 54", "55 ou mais"];
export const FAIXAS = ["Não treino", "Branca", "Azul", "Roxa", "Marrom", "Preta", "Coral", "Vermelha"];
export const GRAUS = ["Sem grau", "1º grau", "2º grau", "3º grau", "4º grau", "5º grau", "6º grau", "7º grau", "8º grau", "9º grau"];

const texto = (v, max) => (typeof v === "string" ? v.trim().replace(/\s+/g, " ").slice(0, max) : "");

export function validar(b) {
  const erros = {};
  const nome = texto(b.nome, 120);
  const email = texto(b.email, 160).toLowerCase();
  const digitos = texto(b.celular, 40).replace(/\D/g, "");
  const celular = digitos.startsWith("55") && digitos.length > 11 ? digitos.slice(2) : digitos;
  const faixa_etaria = texto(b.faixa_etaria, 40);
  const faixa = texto(b.faixa, 40);
  let grau = texto(b.grau, 40) || null;
  const benef = b.beneficente;
  const projeto = texto(b.projeto, 200) || null;

  if (nome.length < 3 || !nome.includes(" ")) erros.nome = "Informe nome e sobrenome.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) erros.email = "E-mail inválido.";
  if (!/^\d{10,11}$/.test(celular)) erros.celular = "Celular com DDD, ex.: (11) 91234-5678.";
  if (!FAIXAS_ETARIAS.includes(faixa_etaria)) erros.faixa_etaria = "Escolha a faixa etária.";
  if (!FAIXAS.includes(faixa)) erros.faixa = "Escolha a faixa.";
  if (faixa === "Não treino") grau = null;
  else if (grau && !GRAUS.includes(grau)) erros.grau = "Grau inválido.";
  if (benef !== "sim" && benef !== "nao") erros.beneficente = "Responda sim ou não.";

  return {
    erros,
    dados: { nome, email, celular, faixa_etaria, faixa, grau,
             beneficente: benef === "sim", projeto: benef === "sim" ? projeto : null },
  };
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, erro: "Método não permitido." });
  }
  const b = typeof req.body === "string" ? safeJson(req.body) : req.body || {};
  if (b.site) return res.status(200).json({ ok: true }); // honeypot: robô preencheu o campo invisível

  const { erros, dados } = validar(b);
  if (Object.keys(erros).length) return res.status(400).json({ ok: false, erros });

  try {
    await garantirTabela();
    const [linha] = await db()`
      INSERT INTO inscricoes (nome, celular, email, faixa_etaria, faixa, grau, beneficente, projeto)
      VALUES (${dados.nome}, ${dados.celular}, ${dados.email}, ${dados.faixa_etaria},
              ${dados.faixa}, ${dados.grau}, ${dados.beneficente}, ${dados.projeto})
      ON CONFLICT (email) DO UPDATE SET
        nome = EXCLUDED.nome, celular = EXCLUDED.celular, faixa_etaria = EXCLUDED.faixa_etaria,
        faixa = EXCLUDED.faixa, grau = EXCLUDED.grau, beneficente = EXCLUDED.beneficente,
        projeto = EXCLUDED.projeto, atualizado_em = now()
      RETURNING (xmax = 0) AS nova`;
    return res.status(200).json({ ok: true, nova: linha.nova });
  } catch (e) {
    console.error("inscricao:", e);
    return res.status(500).json({ ok: false, erro: "Não conseguimos salvar agora. Tente de novo em instantes." });
  }
}

function safeJson(s) { try { return JSON.parse(s); } catch { return {}; } }
