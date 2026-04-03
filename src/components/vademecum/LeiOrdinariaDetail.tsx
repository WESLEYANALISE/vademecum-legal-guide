import { useState, useMemo } from 'react';
import { ArrowLeft, ExternalLink, FileText, ChevronRight, Scale } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { motion } from 'framer-motion';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import brasaoImg from '@/assets/brasao-republica.png';
import ArtigoBottomSheet from './ArtigoBottomSheet';
import type { LeiOrdinaria } from '@/services/legislacaoService';

interface ParsedLei {
  titulo: string;
  ementa: string;
  preambulo: string;
  artigos: { numero: string; texto: string }[];
  assinatura: string;
}

function normalizeOrdinals(text: string): string {
  return text
    .replace(/(\d+)o\b/g, '$1º')
    .replace(/(\d+)a\b(?=\s+da\b)/g, '$1ª');
}

function normalizeLegislativeText(text: string): string {
  return normalizeOrdinals(
    text
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n')
      .replace(/<[^>]+>/g, '')
      .replace(/\u00A0/g, ' ')
      .replace(/\r/g, '')
      .trim()
  );
}

/**
 * Inject line breaks before structural legal markers that may be
 * glued together on a single line after scraping.
 * Only breaks when the marker appears in a normative-structure context
 * (preceded by sentence-ending punctuation, start of line, or another marker).
 */
function injectStructuralBreaks(text: string): string {
  // Insert \n before § markers (§ 1º, § 2º …) when not at line start
  // Negative lookbehind: don't break if preceded by "art." or "inciso" references
  let result = text.replace(/(?<=[.;:,\s])(?=§\s*\d)/g, '\n');

  // Insert \n before "Parágrafo único" / "Paragrafo unico"
  result = result.replace(/(?<=[.;:,\s])(?=Par[aá]grafo\s+[uú]nico)/gi, '\n');

  // Insert \n before Roman-numeral incisos: "I - ", "II - ", "III – ", …
  // Only when preceded by punctuation/space and followed by dash patterns
  result = result.replace(/(?<=[.;:,\s])(?=(?:XC|XL|L?X{0,3})(?:IX|IV|V?I{1,3})\s*[–—-]\s)/g, '\n');
  // Also handle single-char numerals I, V, X, L, C, D, M at boundary
  result = result.replace(/(?<=[.;:,\s])(?=[IVXLCDM]{1,4}\s*[–—-]\s)/g, '\n');

  // Insert \n before lowercase letter alíneas: "a) ", "b) "
  result = result.replace(/(?<=[.;:,\s])(?=[a-z]\)\s)/g, '\n');

  // Clean up any double newlines we may have introduced
  result = result.replace(/\n{2,}/g, '\n');

  return result;
}

function normalizeArticleText(text: string): string {
  // First inject structural breaks for compacted text
  const expanded = injectStructuralBreaks(text);

  const lines = expanded.split('\n');
  if (lines.length <= 1) return expanded;
  
  const structuralPattern = /^(§\s*\d|Par[aá]grafo\s+[uú]nico|[IVXLCDM]+\s*[–—-]\s|[a-z]\)\s|Art\.\s|\.{3,}|…)/i;
  
  const result: string[] = [lines[0]];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    if (structuralPattern.test(line)) {
      result.push(line);
    } else {
      result[result.length - 1] += ' ' + line;
    }
  }
  return result.join('\n');
}

function parseTextoCompleto(texto: string): ParsedLei {
  let clean = normalizeLegislativeText(texto);
  
  const leiTitleMatch = clean.match(/(?:LEI|DECRETO)\s*\n*\s*N[ºo°]\s*[\d.]+[^\n]*/i);
  let titulo = '';
  
  if (leiTitleMatch) {
    const idx = clean.indexOf(leiTitleMatch[0]);
    titulo = leiTitleMatch[0].replace(/\s+/g, ' ').trim();
    clean = clean.substring(idx + leiTitleMatch[0].length);
  }

  let ementa = '';
  let preambulo = '';
  const presidenteMatch = clean.match(/O\s*PRESIDENTE\s*DA\s*REP(?:Ú|U)BLICA/i);
  
  if (presidenteMatch) {
    const presIdx = clean.indexOf(presidenteMatch[0]);
    ementa = clean.substring(0, presIdx).replace(/\s+/g, ' ').trim();
    
    const afterPresidente = clean.substring(presIdx);
    const artMatch = afterPresidente.match(/Art\.\s*1[ºo°]?\s/);
    if (artMatch) {
      const artIdx = afterPresidente.indexOf(artMatch[0]);
      preambulo = afterPresidente.substring(0, artIdx).replace(/\s+/g, ' ').trim();
      clean = afterPresidente.substring(artIdx);
    } else {
      preambulo = afterPresidente.replace(/\s+/g, ' ').trim();
      clean = '';
    }
  }

  const artigos: { numero: string; texto: string }[] = [];
  const artPattern = /(?=Art\.\s*\d+[ºo°]?(?:-[A-Z])?\s+(?![\.…]{3}))/;
  const artParts = clean.split(artPattern).filter(s => s.trim());

  let assinatura = '';
  
  for (const part of artParts) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    
    if (/^Bras[ií]lia/.test(trimmed) || /^LUIZ\s+IN[ÁA]CIO/.test(trimmed)) {
      assinatura += (assinatura ? '\n' : '') + trimmed;
      continue;
    }
    
    const numMatch = trimmed.match(/^(Art\.\s*\d+[ºo°]?(?:-[A-Z])?)/);
    if (numMatch) {
      const numero = numMatch[1];
      let textoArt = trimmed.substring(numMatch[0].length).trim();
      
      if (/^[\s\.…]{5,}/.test(textoArt) || /^\.{3,}/.test(textoArt.replace(/\s/g, ''))) {
        if (artigos.length > 0) {
          artigos[artigos.length - 1].texto += '\n' + trimmed;
        }
        continue;
      }
      
      const sigMatch = textoArt.match(/\n\s*(Bras[ií]lia,[\s\S]*)$/i);
      if (sigMatch) {
        assinatura = sigMatch[1].trim();
        textoArt = textoArt.substring(0, sigMatch.index).trim();
      }
      
      const dontSubMatch = textoArt.match(/\n?\s*Este texto n(?:ã|a)o substitui[\s\S]*/i);
      if (dontSubMatch) {
        textoArt = textoArt.substring(0, dontSubMatch.index).trim();
      }
      
      artigos.push({ numero, texto: normalizeArticleText(textoArt) });
    }
  }
  
  assinatura = assinatura.replace(/Este texto n(?:ã|a)o substitui[\s\S]*/i, '').replace(/\*+\s*$/, '').trim();

  // Normalize signature: join broken name lines (e.g. "LUIZ" + "INÁCIO LULA DA SILVA" → single line)
  const sigLines = assinatura.split('\n').filter(l => l.trim());
  const mergedSigLines: string[] = [];
  for (let i = 0; i < sigLines.length; i++) {
    const trimmed = sigLines[i].trim();
    const isName = /^[A-ZÁÀÂÃÉÈÊÍÏÓÔÕÚÜÇ\s]+$/.test(trimmed) && trimmed.length > 3;
    const startsWithBrasilia = /^Bras[ií]lia/i.test(trimmed);
    
    // Check if next line is also an ALL-CAPS name — merge them
    const nextTrimmed = i + 1 < sigLines.length ? sigLines[i + 1].trim() : '';
    const nextIsName = /^[A-ZÁÀÂÃÉÈÊÍÏÓÔÕÚÜÇ\s]+$/.test(nextTrimmed) && nextTrimmed.length > 3;
    
    if (isName && nextIsName && !startsWithBrasilia) {
      // Merge current + next as one name line
      mergedSigLines.push(trimmed + ' ' + nextTrimmed);
      i++; // skip next
    } else if (isName || startsWithBrasilia) {
      mergedSigLines.push(trimmed);
    } else if (mergedSigLines.length > 0) {
      mergedSigLines[mergedSigLines.length - 1] += ' ' + trimmed;
    } else {
      mergedSigLines.push(trimmed);
    }
  }
  assinatura = mergedSigLines.join('\n');

  return { titulo, ementa, preambulo, artigos, assinatura };
}

interface LeiOrdinariaDetailProps {
  lei: LeiOrdinaria;
  onBack: () => void;
}

const LeiOrdinariaDetail = ({ lei, onBack }: LeiOrdinariaDetailProps) => {
  const [openArtigo, setOpenArtigo] = useState<{ numero: string; texto: string } | null>(null);
  
  const parsed = useMemo(() => {
    if (!lei.texto_completo) return null;
    return parseTextoCompleto(lei.texto_completo);
  }, [lei.texto_completo]);

  const fullUrl = lei.url?.startsWith('http') ? lei.url : 
    lei.url?.startsWith('/') ? `https://www.planalto.gov.br${lei.url}` : 
    lei.url ? `https://www.planalto.gov.br/${lei.url}` : null;

  return (
    <div className="min-h-screen bg-background pb-20 lg:pb-0">
      {/* Header */}
      <div className="bg-gradient-to-br from-primary/90 to-copper-dark px-4 pt-10 pb-6 sm:px-6 md:px-8">
        <div className="max-w-5xl mx-auto">
          <button
            onClick={onBack}
            className="flex items-center gap-2 bg-white/15 hover:bg-white/25 backdrop-blur-sm text-white font-medium transition-all text-sm px-3 py-1.5 rounded-lg mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-display text-xl text-white font-bold">{lei.numero_lei}</h1>
              {lei.data_publicacao && (
                <p className="text-white/70 text-sm">{lei.data_publicacao}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 md:px-8 py-6">
        {/* Brasão */}
        <div className="flex flex-col items-center text-center mb-6">
          <img src={brasaoImg} alt="Brasão da República" loading="eager" decoding="sync" fetchPriority="high" className="w-16 h-16 mb-3" />
          <p className="text-[var(--copper-light)] font-display text-sm font-bold">Presidência da República</p>
          <p className="text-[var(--copper-light)] font-display text-xs">Casa Civil</p>
          <p className="text-muted-foreground font-display text-[11px]">Subchefia para Assuntos Jurídicos</p>
        </div>

        <Tabs defaultValue="lei" className="w-full">
          <TabsList className="bg-secondary/60 rounded-xl h-11 grid grid-cols-2 w-full mb-6">
            <TabsTrigger value="lei" className="rounded-lg text-sm font-semibold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-4 py-2">Lei</TabsTrigger>
            <TabsTrigger value="explicacao" className="rounded-lg text-sm font-semibold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-4 py-2">Explicação</TabsTrigger>
          </TabsList>

          <TabsContent value="lei" className="space-y-6">
            {parsed ? (
              <>
                {/* Title */}
                {parsed.titulo && (
                  <h2 className="text-primary-light font-display text-lg font-bold text-center">
                    {parsed.titulo}
                  </h2>
                )}

                {/* Ementa */}
                {parsed.ementa && (
                  <div className="bg-card rounded-2xl p-4">
                    <p className="text-foreground/80 font-body italic text-base leading-relaxed">
                      {parsed.ementa}
                    </p>
                  </div>
                )}

                {/* Preâmbulo */}
                {parsed.preambulo && (
                  <p className="text-foreground/70 font-body text-base leading-relaxed">
                    {parsed.preambulo}
                  </p>
                )}

                {/* Artigos */}
                {parsed.artigos.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">
                      📋 Artigos ({parsed.artigos.length})
                    </p>
                    {parsed.artigos.map((art, i) => (
                      <motion.button
                        key={i}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.02 }}
                        onClick={() => setOpenArtigo(art)}
                        className="w-full text-left rounded-2xl bg-card hover:bg-secondary/60 transition-all group flex overflow-hidden min-h-[68px]"
                      >
                        <div className="w-1.5 bg-primary rounded-l-2xl shrink-0" />
                        <div className="flex items-center gap-3 p-4 flex-1 min-w-0">
                          <div className="w-9 h-9 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
                            <Scale className="w-4 h-4 text-primary-light" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-display text-[15px] font-bold text-primary-light mb-0.5">
                              {art.numero}
                            </h4>
                            <p className="text-[13px] leading-relaxed line-clamp-2 text-foreground/80 font-body">
                              {art.texto.substring(0, 150)}{art.texto.length > 150 ? '...' : ''}
                            </p>
                          </div>
                          <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary shrink-0 transition-colors" />
                        </div>
                      </motion.button>
                    ))}
                  </div>
                )}

                {/* Assinatura */}
                {parsed.assinatura && (
                  <div className="text-center mt-8 space-y-2">
                    {parsed.assinatura.split('\n').filter(l => l.trim()).map((line, i) => {
                      const trimmed = line.trim();
                      // Names in ALL CAPS get their own line; other text flows naturally
                      const isName = /^[A-ZÁÀÂÃÉÈÊÍÏÓÔÕÚÜÇ\s]+$/.test(trimmed) && trimmed.length > 3;
                      return (
                        <p key={i} className={`font-body text-sm text-signature ${isName ? 'font-semibold mt-1' : ''}`}>
                          {trimmed}
                        </p>
                      );
                    })}
                  </div>
                )}
              </>
            ) : (
              /* Fallback: show ementa only */
              <p className="text-foreground font-body text-sm leading-relaxed">
                {lei.ementa}
              </p>
            )}

            {/* Ver texto oficial */}
            {fullUrl && (
              <a
                href={fullUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-4 rounded-2xl bg-card hover:bg-secondary/60 transition-all group mt-6"
              >
                <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
                  <ExternalLink className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-foreground font-display text-sm font-semibold">Ver texto oficial</p>
                  <p className="text-muted-foreground text-xs">Planalto.gov.br</p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </a>
            )}
          </TabsContent>

          <TabsContent value="explicacao" className="py-6">
            {lei.explicacao ? (
              <div className="prose prose-sm dark:prose-invert max-w-none font-body text-sm [&_p]:my-2 [&_ul]:my-2 [&_ol]:my-2 [&_li]:my-1 [&_h2]:text-primary-light [&_h3]:text-primary-light [&_h2]:font-display [&_h3]:font-display [&_strong]:text-foreground">
                <ReactMarkdown>{lei.explicacao}</ReactMarkdown>
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-12">
                <p className="text-sm">Explicação em breve...</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Bottom sheet for individual article */}
      {openArtigo && (
        <ArtigoBottomSheet
          artigo={{
            id: `${lei.id}-${openArtigo.numero}`,
            numero: openArtigo.numero,
            caput: openArtigo.texto,
          }}
          tabelaNome={`resenha_${lei.id}`}
          onClose={() => setOpenArtigo(null)}
        />
      )}
    </div>
  );
};

export default LeiOrdinariaDetail;
