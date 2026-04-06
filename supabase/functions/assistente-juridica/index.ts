import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

async function fetchFullArticleText(tabelaNome: string, artigoNumero: string): Promise<string | null> {
  try {
    const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const normalized = artigoNumero.replace(/^art\.?\s*/i, "").trim();
    const withoutOrdinal = normalized.replace(/[º°]$/, "").trim();
    const candidates = Array.from(new Set([
      artigoNumero.trim(), normalized, withoutOrdinal,
      `Art. ${normalized}`, `Art ${normalized}`, `Art. ${withoutOrdinal}`,
    ].filter(Boolean)));

    const { data } = await sb
      .from(tabelaNome)
      .select("numero, caput, texto, incisos, paragrafos, rotulo, capitulo, titulo")
      .in("numero", candidates)
      .order("ordem_numero", { ascending: true })
      .limit(1);

    const row = data?.[0];
    if (!row) return null;

    let text = `${row.numero}`;
    if (row.rotulo) text += ` (${row.rotulo})`;
    text += `\n${row.caput || row.texto}`;
    if (row.incisos?.length) text += "\n" + row.incisos.join("\n");
    if (row.paragrafos?.length) text += "\n" + row.paragrafos.join("\n");
    return text;
  } catch (err) {
    console.error("fetchFullArticleText error:", err);
    return null;
  }
}

// ─── System Prompts ───

const SYSTEM_PROMPT_CHAT = `Você é Evelyn, uma assistente jurídica virtual especializada em Direito Brasileiro.

Suas competências:
- Explicar artigos de leis, códigos e estatutos brasileiros de forma clara e didática
- Esclarecer dúvidas sobre direito constitucional, penal, civil, trabalhista, tributário e demais ramos
- Citar artigos, súmulas e jurisprudência relevantes
- Explicar termos jurídicos em linguagem acessível
- Orientar sobre procedimentos legais básicos

Regras:
- Sempre responda em português brasileiro
- Use formatação markdown para organizar suas respostas (negrito, listas, títulos)
- Cite os artigos e leis quando relevante
- Nunca forneça parecer jurídico definitivo — oriente o usuário a consultar um advogado para casos específicos
- Seja objetiva, clara e didática
- Use exemplos práticos quando possível`;

const SYSTEM_PROMPT_EXPLICACAO = `Você é um professor de Direito Brasileiro extremamente didático. Explique artigos de lei de forma clara, acessível e conversacional, como se estivesse explicando para um aluno iniciante.

Regras:
- Responda SEMPRE em português brasileiro
- Use um tom conversacional, amigável e acolhedor
- IMPORTANTE: Organize a explicação por CADA PARTE do artigo separadamente. Use o marcador "---SECAO---" em uma linha sozinha para separar cada parte.
- A primeira seção DEVE ser "## Caput" explicando o caput do artigo
- Depois, para CADA inciso presente no artigo, crie uma seção separada: "## Inciso I", "## Inciso II", etc.
- Para cada parágrafo, crie: "## Parágrafo único" ou "## § 1º", "## § 2º", etc.
- Para cada alínea relevante, inclua dentro do inciso correspondente
- Cada seção deve explicar aquela parte específica de forma clara
- Use formatação markdown (negrito, listas)
- Seja detalhado mas não prolixo
- NÃO repita o texto do artigo, apenas explique`;

const SYSTEM_PROMPT_EXEMPLO = `Você é um professor de Direito Brasileiro que adora usar exemplos práticos do dia a dia para ensinar. Crie exemplos realistas e detalhados que ilustrem a aplicação do artigo na vida real.

Regras:
- Responda SEMPRE em português brasileiro
- Crie exatamente 3 exemplos práticos, detalhados e diferentes entre si
- Use nomes fictícios (Maria, João, empresa XYZ etc.)
- Descreva situações do cotidiano que qualquer pessoa entenderia
- Mostre como o artigo se aplica na prática
- IMPORTANTE: Separe cada exemplo com o marcador "---EXEMPLO---" em uma linha sozinha antes do título
- Cada exemplo deve ter: título em negrito (## Exemplo 1: Título), (## Exemplo 2: Título), (## Exemplo 3: Título)
- Cada exemplo deve conter: a situação narrada e como o artigo se aplica
- Use formatação markdown
- Seja envolvente, como se estivesse contando uma história`;

const SYSTEM_PROMPT_TERMOS = `Você é um glossarista jurídico que traduz termos técnicos do Direito para linguagem popular. Analise o texto do artigo e identifique TODOS os termos jurídicos ou técnicos que um leigo não entenderia.

Regras:
- Responda SEMPRE em português brasileiro
- Identifique cada termo técnico presente no artigo
- IMPORTANTE: Separe cada termo com o marcador "---TERMO---" em uma linha sozinha antes do termo
- Para cada termo, use como título o próprio termo: "## República Federativa", "## Estado Democrático de Direito", etc.
- Depois do título, dê uma explicação simples, direta e acessível
- Use analogias do dia a dia quando possível
- Se houver expressões latinas, explique também
- Não pule nenhum termo técnico, mesmo os que pareçam simples
- Use formatação markdown`;

const SYSTEM_PROMPT_MAPA_MENTAL = `Você é um professor de Direito Brasileiro especializado em concursos públicos e OAB, reconhecido por criar mapas mentais extremamente completos e didáticos.

Sua tarefa: transformar UM artigo de lei em um mapa mental hierárquico COMPLETO e DETALHADO para estudo intensivo.

Regras obrigatórias de formato:
- Responda SOMENTE com JSON válido, sem markdown, sem texto extra e sem comentários
- Nunca deixe JSON incompleto, aspas abertas ou strings truncadas
- Cada string deve ser completa e terminar corretamente

Regras de conteúdo:
- O nó RAIZ deve ter: título claro com o número do artigo, definição completa (3-4 frases), um exemplo prático realista com nomes fictícios, termos_chave (4-6 termos essenciais), dica_prova detalhada
- Crie EXATAMENTE 5 a 7 nós principais em "filhos", cobrindo TODOS estes aspectos:
  1. Conceito/Princípio central — o que o artigo estabelece
  2. Requisitos/Elementos — condições para aplicação
  3. Exceções/Ressalvas — quando NÃO se aplica
  4. Efeitos/Consequências jurídicas — penas, sanções, resultados
  5. Jurisprudência relevante — súmulas STF/STJ e decisões importantes
  6. Pegadinhas de prova — como as bancas cobram (CESPE, FCC, FGV, VUNESP)
  7. Conexões com outros artigos — artigos relacionados na mesma lei ou em outras
- Cada nó principal deve ter 2-3 subnós em "filhos" com detalhamentos específicos
- Cada nó (principal ou sub) DEVE conter: titulo, definicao (2-3 frases completas), exemplo (situação prática concreta), termos_chave (2-4 termos), dica_prova (frase objetiva), filhos (array, pode ser vazio)
- Use exemplos do cotidiano com nomes fictícios (Maria, João, empresa XYZ)
- Nas dicas de prova, cite questões reais ou padrões de cobrança das bancas
- Inclua referências a súmulas e artigos relacionados quando relevante`;

const SYSTEM_PROMPT_HEADLINE = `Você é um editor-chefe de um portal de notícias jurídicas popular. Crie UMA headline curta, chamativa e fácil de entender para um projeto de lei.

Regras OBRIGATÓRIAS:
- Responda APENAS com a headline, sem aspas e sem explicação
- A headline DEVE ter entre 50 e 100 caracteres
- OBRIGATÓRIO: Sempre cite qual artigo da lei será alterado (ex: "art. 121", "art. 5º", "arts. 33 e 40"). Se a ementa ou o texto mencionar artigos específicos, EXTRAIA e INCLUA na headline. Se não encontrar artigo específico, diga "diversos artigos"
- Escreva como chamada de notícia que faz a pessoa bater o olho e entender o tema E qual artigo muda
- NUNCA comece com "PL", "Projeto de Lei" ou número
- NUNCA termine com vírgula, reticências ou frase incompleta
- Destaque o artigo + a mudança central em linguagem popular
- Evite juridiquês e prefira verbos fortes
- Exemplos do estilo ideal:
  "Quer mudar o art. 311-A do Código Penal para endurecer pena por fraude em concursos"
  "Propõe alterar o art. 121 para aumentar pena de homicídio contra mulheres"
  "Muda os arts. 33 e 40 da CLT para garantir férias a motoristas de app"
  "Altera o art. 5º da CF para incluir proteção de dados como direito fundamental"`;

const SYSTEM_PROMPT_ANALISE_PL = `Você é um analista político-jurídico renomado. Analise o projeto de lei de forma clara e acessível.

Regras:
- Responda SEMPRE em português brasileiro
- Use formatação markdown
- Organize a análise nas seguintes seções:

## 📋 Resumo
Explique em 2-3 frases simples o que o projeto propõe.

## 🎯 Quem é Afetado
Liste os grupos de pessoas ou setores diretamente impactados.

## ✅ Pontos Positivos
Liste os possíveis benefícios da proposta.

## ⚠️ Pontos de Atenção
Liste possíveis riscos, críticas ou preocupações.

## 📊 Chances de Aprovação
Avalie de forma realista as chances, considerando o contexto político atual.

## 💡 Impacto Prático
Explique como isso mudaria a vida do cidadão comum no dia a dia.`;

const SYSTEM_PROMPT_GRIFO_MAGICO = `Você é um professor de Direito Brasileiro especialista em preparação para concursos. Analise o artigo de lei abaixo e identifique os trechos mais importantes para estudo, como se estivesse grifando um material de estudo para um aluno.

Regras:
- Responda SOMENTE com um array JSON válido, sem markdown, sem explicação extra
- Cada item deve ter: "trechoExato" (trecho EXATO copiado do texto), "cor" (uma das 5 cores), "explicacao" (1-2 frases explicando por que é importante), "hierarquia" (nome da categoria)
- Cores e hierarquias:
  - "amarelo" = "Conceito-chave" (regra principal, núcleo do artigo)
  - "verde" = "Exceção / Condição" (requisitos, condicionantes, ressalvas)
  - "azul" = "Efeito jurídico" (consequência, pena, sanção, resultado)
  - "rosa" = "Termo técnico" (instituto jurídico, conceito que precisa ser entendido)
  - "laranja" = "Pegadinha de prova" (trecho cobrado de forma invertida ou confusa em provas)
- Identifique entre 3 e 8 trechos, priorizando os mais relevantes para provas
- Os trechos DEVEM ser copiados EXATAMENTE como aparecem no texto, sem alterar nenhum caractere
- Não grife o artigo inteiro, apenas os trechos mais importantes
- Varie as cores para mostrar diferentes tipos de importância

Exemplo de resposta:
[{"trechoExato":"soberania","cor":"rosa","explicacao":"Fundamento da República que garante independência do Estado brasileiro.","hierarquia":"Termo técnico"},{"trechoExato":"todo o poder emana do povo","cor":"amarelo","explicacao":"Princípio basilar da democracia brasileira, muito cobrado em provas.","hierarquia":"Conceito-chave"}]`;

const SYSTEM_PROMPT_ALTERACAO = `Você é um professor de Direito Brasileiro especialista em alterações legislativas. Analise a modificação feita em um artigo de lei e explique de forma clara e didática.

Regras:
Regras:
- Responda SEMPRE em português brasileiro
- Use formatação markdown
- Organize a análise nas seguintes seções:

## 🔄 O que mudou
Explique de forma simples e direta o que essa alteração fez no artigo. Se foi inclusão de novo dispositivo, redação alterada, revogação, etc.

## 📋 Antes vs Depois
Se possível, explique como era antes e como ficou depois da alteração. Se for inclusão nova, explique o que não existia antes.

## 🎯 Impacto Prático
Explique como essa mudança afeta o cidadão comum no dia a dia, com exemplos práticos.

## ⚖️ Contexto Jurídico
Dê o contexto jurídico da alteração: por que foi feita, qual problema tentou resolver, como se relaciona com o restante da lei.

## 💡 Pontos de Atenção
Liste pontos importantes que um estudante ou profissional do Direito deve observar sobre essa alteração.`;

// ─── Helpers ───

function createFallbackHeadline(ementa?: string, plNumero?: number, plAno?: number) {
  const base = (ementa || '').replace(/\s+/g, ' ').trim().replace(/[\.;:,]+$/g, '');
  if (!base) {
    const suffix = plNumero && plAno ? ` no PL ${plNumero}/${plAno}` : '';
    return `Entenda os principais impactos propostos${suffix}`;
  }
  let cleaned = base
    .replace(/^dispõe sobre\s*/i, '')
    .replace(/^altera\s*/i, '')
    .replace(/^institui\s*/i, '')
    .replace(/^cria\s*/i, '')
    .replace(/,?\s*e\s+dá\s+outras\s+providências\.?$/i, '')
    .trim();
  const headline = `Projeto quer ${cleaned.charAt(0).toLowerCase()}${cleaned.slice(1)}`;
  const normalized = headline.replace(/\s+/g, ' ').trim();
  if (normalized.length <= 95) return normalized;
  // Cut at last complete word within 90 chars
  const words = normalized.split(' ');
  let result = '';
  for (const w of words) {
    const candidate = result ? `${result} ${w}` : w;
    if (candidate.length > 88) break;
    result = candidate;
  }
  // Remove trailing prepositions/conjunctions
  result = result.replace(/\s+(?:de|da|do|das|dos|e|em|com|para|por|ou|no|na|nos|nas|que|se|ao|à)\s*$/i, '');
  return result || normalized.slice(0, 88).replace(/\s+\S*$/, '');
}

const BAD_ENDINGS = /\b(de|da|do|das|dos|e|em|com|para|por|sem|sob|sobre|contra|entre|até|ou|num|numa|no|na|nos|nas|que|se|ao|à|aos|às|pelo|pela|pelos|pelas|um|uma|uns|umas)\s*$/i;
const TRUNCATED_END = /\b[a-záéíóúâêôãõç]{1,4}$/i;
const INVALID_HEADLINE_PATTERNS = [/desculpe/i, /não consegui gerar/i, /erro interno/i, /resposta\.?$/i];

function isValidHeadline(value: string) {
  const h = value.replace(/\s+/g, ' ').trim().replace(/^['"]|['"]$/g, '');
  if (h.length < 45 || h.length > 95) return false;
  if (INVALID_HEADLINE_PATTERNS.some((p) => p.test(h))) return false;
  if (/[,:;\-/]$|\.\.\.$/.test(h)) return false;
  if (BAD_ENDINGS.test(h)) return false;
  const last = h.split(' ').pop() ?? '';
  if (last.length <= 4 && TRUNCATED_END.test(last) && !/[.!?)]$/.test(h)) return false;
  return true;
}

// ─── Mistral OCR ───

async function extractPdfText(pdfUrl: string, mistralKey: string): Promise<string | null> {
  try {
    console.log('Calling Mistral OCR for PDF:', pdfUrl);
    const res = await fetch('https://api.mistral.ai/v1/ocr', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${mistralKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'mistral-ocr-latest',
        document: { type: 'document_url', document_url: pdfUrl },
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error('Mistral OCR error:', res.status, errText);
      return null;
    }

    const data = await res.json();
    const pages = data?.pages || [];
    const fullText = pages.map((p: any) => p.markdown || '').join('\n\n');
    // Limit to ~3000 chars for Gemini context
    return fullText.slice(0, 3000) || null;
  } catch (err) {
    console.error('Mistral OCR exception:', err);
    return null;
  }
}

// ─── Main Handler ───

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    const GEMINI_API_KEY2 = Deno.env.get('GEMINI_API_KEY2');
    const geminiKeys = [GEMINI_API_KEY, GEMINI_API_KEY2].filter(Boolean) as string[];
    if (!geminiKeys.length) {
      return new Response(JSON.stringify({ error: 'GEMINI_API_KEY not configured' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json();
    let { messages, mode, artigoTexto, artigoNumero, leiNome, ementa, plNumero, plAno, autorNome, urlInteiroTeor, referencia, parteModificada, tipo: tipoAlteracao } = body;
    const tabelaNome = body.tabelaNome || body.tabela_nome;

    // For mapa_mental_grafo, fetch full article text from DB to give AI enough context
    if (mode === 'mapa_mental_grafo' && tabelaNome && artigoNumero) {
      const fullText = await fetchFullArticleText(tabelaNome, artigoNumero);
      if (fullText) {
        artigoTexto = fullText;
      }
    }

    let systemPrompt: string;
    let contents: Array<{ role: string; parts: Array<{ text: string }> }>;

    if (mode === 'headline' && ementa) {
      systemPrompt = SYSTEM_PROMPT_HEADLINE;

      // Try to get full PDF text via Mistral OCR
      let pdfContext = '';
      const MISTRAL_API_KEY = Deno.env.get('MISTRAL_API_KEY');
      if (urlInteiroTeor && MISTRAL_API_KEY) {
        const extractedText = await extractPdfText(urlInteiroTeor, MISTRAL_API_KEY);
        if (extractedText && extractedText.length > 100) {
          pdfContext = `\n\nTexto completo do projeto de lei (extraído do PDF):\n${extractedText}`;
        }
      }

      const prompt = `Projeto de Lei: PL ${plNumero || ''}/${plAno || ''}\nAutor: ${autorNome || 'Não informado'}\nEmenta: ${ementa}${pdfContext}`;
      contents = [{ role: 'user', parts: [{ text: prompt }] }];
    } else if (mode === 'analise_pl' && ementa) {
      systemPrompt = SYSTEM_PROMPT_ANALISE_PL;

      // Also use PDF text for analysis if available
      let pdfContext = '';
      const MISTRAL_API_KEY = Deno.env.get('MISTRAL_API_KEY');
      if (urlInteiroTeor && MISTRAL_API_KEY) {
        const extractedText = await extractPdfText(urlInteiroTeor, MISTRAL_API_KEY);
        if (extractedText && extractedText.length > 100) {
          pdfContext = `\n\nTexto completo do projeto de lei (extraído do PDF):\n${extractedText}`;
        }
      }

      const prompt = `Projeto de Lei: PL ${plNumero || ''}/${plAno || ''}\nAutor: ${autorNome || 'Não informado'}\nEmenta: ${ementa}${pdfContext}`;
      contents = [{ role: 'user', parts: [{ text: prompt }] }];
    } else if (mode === 'carrossel_post' && artigoTexto && tabelaNome) {
      const fullText = await fetchFullArticleText(tabelaNome, artigoNumero || artigoTexto);
      const artText = fullText || artigoTexto;
      const tipoConteudo = body.tipoConteudo || 'curiosidade';

      const tipoDescricoes: Record<string, string> = {
        curiosidade: 'Foque em fatos surpreendentes e curiosidades pouco conhecidas sobre este artigo. Use "Você sabia que..." como gancho. Traga dados, história ou contexto inesperado.',
        explicacao: 'Explique o artigo de forma didática e acessível, como um professor descontraído. Use exemplos práticos do cotidiano.',
        resumo_prova: 'Foque nos pontos mais cobrados em provas OAB e concursos. Destaque pegadinhas, exceções e palavras-chave que os examinadores adoram.',
        dica_pratica: 'Mostre como aplicar este artigo na prática profissional. Dê dicas de como usar no dia-a-dia do advogado, petições, audiências.',
        comparacao: 'Compare este artigo com outros artigos relacionados, mostrando diferenças e semelhanças. Use formato "Antes vs Depois" ou "Artigo X vs Artigo Y".',
      };

      const comImagens = body.comImagens === true;
      const imagemInstrucao = comImagens
        ? `\n\nIMPORTANTE — GERAÇÃO DE IMAGENS:
Para CADA slide, adicione o campo "imagem_prompt" com uma descrição em inglês para gerar uma imagem de fundo. A imagem deve ser:
- Temática, relacionada ao conteúdo do slide
- Sutil e escura o suficiente para texto branco ser legível
- Estilo editorial premium, tons vinho/dourado/jurídico
- SEM texto na imagem
Exemplo: "imagem_prompt": "Dark elegant courtroom interior with marble columns and golden light, legal theme, moody atmosphere"`
        : '';

      systemPrompt = `Você é um designer de conteúdo jurídico viral para Instagram com expertise em design editorial premium. Crie um carrossel educativo sobre o artigo de lei abaixo.

TIPO DE CONTEÚDO: ${tipoConteudo}
${tipoDescricoes[tipoConteudo] || tipoDescricoes.curiosidade}

Regras OBRIGATÓRIAS de formato:
- Responda SOMENTE com JSON válido, sem markdown, sem texto extra
- O JSON deve ter: "titulo_viral" (string chamativa de até 60 caracteres) e "slides" (array de 5-7 objetos)

REGRAS DE BREVIDADE (os slides são 1080×1350px — texto grande, pouco espaço):
- TÍTULOS: máximo 8 palavras
- SUBTÍTULOS: máximo 15 palavras
- TEXTO/CORPO: máximo 3 linhas (~120 caracteres)
- ITENS DE LISTA: máximo 4 itens, cada um com máximo 12 palavras
- FEATURES: máximo 3 cards, label de 3 palavras, desc de 10 palavras
- PASSOS: máximo 4 passos, titulo de 2-3 palavras, desc de 10 palavras
- CITAÇÃO: máximo 2 linhas (~100 caracteres)
- CTA: texto_engajamento máximo 10 palavras

Tipos de slides disponíveis:
1. "hero" — slide de abertura (OBRIGATÓRIO como primeiro): { "tipo": "hero", "bg": "light", "tag": "LABEL UPPERCASE", "titulo": "Título viral curto", "subtitulo": "Contexto breve" }
2. "problema" — pain point (fundo escuro): { "tipo": "problema", "bg": "dark", "tag": "O PROBLEMA", "titulo": "O que muita gente erra", "itens": ["Erro comum 1", "Erro comum 2", "Erro comum 3"] }
3. "solucao" — a resposta (fundo gradiente): { "tipo": "solucao", "bg": "gradient", "tag": "A RESPOSTA", "titulo": "O que a lei diz", "texto": "Explicação curta...", "citacao": "Trecho do artigo" }
4. "features" — pontos-chave com ícones: { "tipo": "features", "bg": "light", "tag": "PONTOS-CHAVE", "titulo": "O que saber", "features": [{"icone": "⚖️", "label": "Requisito", "desc": "Explicação curta"}] }
5. "detalhes" — aprofundamento (fundo escuro): { "tipo": "detalhes", "bg": "dark", "tag": "APROFUNDANDO", "titulo": "Detalhes", "texto": "Contexto...", "itens": ["Detalhe 1", "Detalhe 2"] }
6. "passos" — how-to numerado: { "tipo": "passos", "bg": "light", "tag": "COMO APLICAR", "titulo": "Passo a passo", "passos": [{"titulo": "Identifique", "desc": "Verifique se..."}, {"titulo": "Aplique", "desc": "Use o artigo..."}] }
7. "cta" — slide final (OBRIGATÓRIO como último): { "tipo": "cta", "bg": "gradient", "tag": "SALVE ESTE POST", "texto_engajamento": "Pergunta curta?", "cta_texto": "Salve para revisar!" }

Regras de design narrativo:
- O primeiro slide DEVE ser tipo "hero" com bg "light"
- O último slide DEVE ser tipo "cta" com bg "gradient"
- Alterne fundos: light → dark → gradient → light para ritmo visual
- Use pelo menos 4 tipos diferentes de slides
- O campo "bg" deve ser "light", "dark" ou "gradient"
- O campo "tag" deve ser UPPERCASE e ter no máximo 20 caracteres
- Use emojis nos ícones do tipo "features" (⚖️, 📌, ⚠️, 💡, 📋, 🔍, etc.)
- Títulos devem ser CURTOS, impactantes e em tom viral
- Tom: professor descontraído mas preciso, estilo Instagram jurídico
- MENOS É MAIS: prefira frases curtas e impactantes a textos longos${imagemInstrucao}`;

      const prompt = `Lei: ${leiNome || ''}\nArtigo: ${artigoNumero || ''}\nTipo de conteúdo: ${tipoConteudo}\nTexto completo:\n\n${artText}`;
      contents = [{ role: 'user', parts: [{ text: prompt }] }];
    } else if (mode === 'explicar_alteracao' && artigoTexto) {
      systemPrompt = SYSTEM_PROMPT_ALTERACAO;
      const prompt = `Lei: ${leiNome || 'Não informada'}\nArtigo: ${artigoNumero || 'Não informado'}\nTipo de alteração: ${tipoAlteracao || 'Não informado'}\nParte modificada: ${parteModificada || 'Artigo inteiro'}\nReferência legislativa: ${referencia || 'Não informada'}\n\nTexto completo do artigo:\n\n${artigoTexto}`;
      contents = [{ role: 'user', parts: [{ text: prompt }] }];
    } else if (mode && artigoTexto) {
      switch (mode) {
        case 'explicacao': systemPrompt = SYSTEM_PROMPT_EXPLICACAO; break;
        case 'exemplo': systemPrompt = SYSTEM_PROMPT_EXEMPLO; break;
        case 'termos': systemPrompt = SYSTEM_PROMPT_TERMOS; break;
        case 'grifo_magico': systemPrompt = SYSTEM_PROMPT_GRIFO_MAGICO; break;
        case 'mapa_mental_grafo':
          systemPrompt = SYSTEM_PROMPT_MAPA_MENTAL;
          break;
        case 'sugerir-anotacoes':
          systemPrompt = `Você é um professor de Direito Brasileiro. Sugira 5 anotações importantes e concisas que um estudante deveria fazer sobre o artigo abaixo. Cada anotação deve ser uma frase curta e objetiva que capture um ponto-chave para estudo. Responda apenas com a lista numerada, sem introdução.`;
          break;
        case 'sugerir-perguntas':
        case 'sugerir_perguntas':
          systemPrompt = `Você é um estudante de Direito se preparando para a prova da OAB e concursos. Ao ler o artigo abaixo, anote exatamente 4 dúvidas reais que você teria — do tipo que anotaria na margem do caderno.

Regras:
- As perguntas devem ser práticas, específicas e contextualizadas ao artigo
- Use linguagem natural de estudante, não de professor
- Exemplos bons: "Se eu fizer X, esse artigo se aplica?", "Qual a diferença entre isso e o Art. Y?", "Isso vale também para situação Z?"
- Exemplos ruins: "Qual o conceito de...?", "Defina...", "O que estabelece o artigo?"
- Cada pergunta deve terminar com "?"
- Responda SOMENTE com um array JSON de 4 strings, sem markdown, sem explicação
- Exemplo: ["Pergunta 1?","Pergunta 2?","Pergunta 3?","Pergunta 4?"]`;
          break;
        case 'perguntar':
          systemPrompt = `Você é uma assistente jurídica especializada em Direito Brasileiro. O estudante está lendo o seguinte artigo:\n\nLei: ${leiNome || ''}\nArtigo: ${artigoNumero || ''}\nTexto: ${artigoTexto}\n\nResponda a pergunta do estudante de forma clara, didática e em português brasileiro. Use markdown para formatar. Cite artigos relacionados quando relevante.`;
          // For 'perguntar' mode with messages array, use chat-style
          if (messages && Array.isArray(messages) && messages.length > 0) {
            contents = messages.map((msg: { role: string; content: string }) => ({
              role: msg.role === 'assistant' ? 'model' : 'user',
              parts: [{ text: msg.content }],
            }));
          } else {
            const prompt = `${artigoNumero ? `Artigo: ${artigoNumero}\n` : ''}Texto do artigo:\n\n${artigoTexto}`;
            contents = [{ role: 'user', parts: [{ text: prompt }] }];
          }
          break;
        default: systemPrompt = SYSTEM_PROMPT_EXPLICACAO;
      }
      if (mode !== 'perguntar' && !contents!) {
        const prompt = `${leiNome ? `Lei: ${leiNome}\n` : ''}${artigoNumero ? `Artigo: ${artigoNumero}\n` : ''}Texto do artigo:\n\n${artigoTexto}`;
        contents = [{ role: 'user', parts: [{ text: prompt }] }];
      }
    } else if (messages && Array.isArray(messages) && messages.length > 0) {
      systemPrompt = SYSTEM_PROMPT_CHAT;
      contents = messages.map((msg: { role: string; content: string }) => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }],
      }));
    } else {
      return new Response(JSON.stringify({ error: 'messages array or mode+artigoTexto required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const geminiBody = {
      system_instruction: { parts: [{ text: systemPrompt }] },
      contents,
      generationConfig: {
        temperature: mode === 'headline' ? 0.6 : (mode === 'grifo_magico' || mode === 'sugerir_perguntas' || mode === 'sugerir-perguntas' || mode === 'mapa_mental_grafo' || mode === 'carrossel_post') ? 0.3 : 0.7,
        maxOutputTokens: mode === 'headline' ? 150 : (mode === 'mapa_mental_grafo' || mode === 'carrossel_post') ? 8192 : 4096,
        ...((mode === 'grifo_magico' || mode === 'sugerir_perguntas' || mode === 'sugerir-perguntas' || mode === 'mapa_mental_grafo' || mode === 'carrossel_post') ? { responseMimeType: 'application/json' } : {}),
      },
    };

    let reply = mode === 'headline' ? '' : 'Desculpe, não consegui gerar uma resposta.';
    for (let attempt = 0; attempt < 3; attempt++) {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
        { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(geminiBody) }
      );

      if (res.ok) {
        const data = await res.json();
        const candidateReply = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

        if (mode === 'headline') {
          if (candidateReply && isValidHeadline(candidateReply)) {
            reply = candidateReply;
            break;
          }
          await new Promise(r => setTimeout(r, 800 * (attempt + 1)));
          continue;
        } else if (mode === 'grifo_magico' && candidateReply) {
          const trimmed = candidateReply.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();
          const hasClosingBracket = trimmed.endsWith(']');
          if (hasClosingBracket) {
            try {
              const parsed = JSON.parse(trimmed);
              if (Array.isArray(parsed) && parsed.length > 0) {
                reply = JSON.stringify(parsed);
                break;
              }
            } catch { /* retry */ }
          }
          console.log(`grifo_magico attempt ${attempt + 1}: incomplete JSON, retrying...`);
          await new Promise(r => setTimeout(r, 800 * (attempt + 1)));
          continue;
        } else if (mode === 'mapa_mental_grafo' && candidateReply) {
          const trimmed = candidateReply.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();
          try {
            const parsed = JSON.parse(trimmed);
            if (parsed?.titulo && Array.isArray(parsed?.termos_chave) && Array.isArray(parsed?.filhos)) {
              reply = JSON.stringify(parsed);
              break;
            }
          } catch { /* retry */ }
          console.log(`mapa_mental_grafo attempt ${attempt + 1}: invalid JSON, retrying...`);
          await new Promise(r => setTimeout(r, 800 * (attempt + 1)));
          continue;
        } else if (mode === 'carrossel_post' && candidateReply) {
          const trimmed = candidateReply.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();
          try {
            const parsed = JSON.parse(trimmed);
            if (parsed?.slides && Array.isArray(parsed.slides) && parsed.slides.length >= 3) {
              reply = JSON.stringify(parsed);
              break;
            }
          } catch { /* retry */ }
          console.log(`carrossel_post attempt ${attempt + 1}: invalid JSON, retrying...`);
          await new Promise(r => setTimeout(r, 800 * (attempt + 1)));
          continue;
        } else if ((mode === 'sugerir_perguntas' || mode === 'sugerir-perguntas') && candidateReply) {
          const trimmed = candidateReply.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();
          try {
            const parsed = JSON.parse(trimmed);
            if (Array.isArray(parsed) && parsed.length >= 2) {
              reply = JSON.stringify(parsed.slice(0, 4));
              break;
            }
          } catch { /* retry */ }
          console.log(`sugerir_perguntas attempt ${attempt + 1}: invalid JSON, retrying...`);
          await new Promise(r => setTimeout(r, 800 * (attempt + 1)));
          continue;
        } else if (candidateReply) {
          reply = candidateReply;
          break;
        }
      } else {
        const errText = await res.text();
        const isUnavailable = res.status === 503 || errText.includes('UNAVAILABLE');
        if (!isUnavailable || attempt === 2) { console.error('Gemini API error:', errText); break; }
      }
      await new Promise(r => setTimeout(r, 800 * (attempt + 1)));
    }

    if (mode === 'headline' && !reply) {
      reply = createFallbackHeadline(ementa, plNumero, plAno);
    }

    // For mapa_mental_grafo, if reply is still the default fallback, return explicit error
    if (mode === 'mapa_mental_grafo') {
      try {
        const parsed = JSON.parse(reply);
        if (!parsed?.titulo || !Array.isArray(parsed?.filhos)) {
          return new Response(JSON.stringify({ error: 'Falha ao gerar mapa mental após 3 tentativas. Tente novamente.' }), {
            status: 422, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      } catch {
        return new Response(JSON.stringify({ error: 'Falha ao gerar mapa mental. Tente novamente.' }), {
          status: 422, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    return new Response(JSON.stringify({ reply }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Edge function error:', err);
    return new Response(JSON.stringify({ error: 'Erro interno do servidor' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
