import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface LeiConfig {
  url: string;
  nome: string;
  sigla: string;
  tipo: string;
  descricao: string;
  tabela_nome: string;
}

const LEIS: LeiConfig[] = [
  // Constituição
  { url: "https://www.planalto.gov.br/ccivil_03/constituicao/constituicao.htm", nome: "Constituição Federal de 1988", sigla: "CF/88", tipo: "constituicao", descricao: "Constituição da República Federativa do Brasil", tabela_nome: "CF88_CONSTITUICAO_FEDERAL" },

  // Códigos
  { url: "https://www.planalto.gov.br/ccivil_03/leis/2002/l10406compilada.htm", nome: "Código Civil", sigla: "CC/2002", tipo: "codigo", descricao: "Lei nº 10.406, de 10 de janeiro de 2002", tabela_nome: "CC_CODIGO_CIVIL" },
  { url: "https://www.planalto.gov.br/ccivil_03/decreto-lei/del2848compilado.htm", nome: "Código Penal", sigla: "CP", tipo: "codigo", descricao: "Decreto-Lei nº 2.848, de 7 de dezembro de 1940", tabela_nome: "CP_CODIGO_PENAL" },
  { url: "https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2015/lei/l13105.htm", nome: "Código de Processo Civil", sigla: "CPC/2015", tipo: "codigo", descricao: "Lei nº 13.105, de 16 de março de 2015", tabela_nome: "CPC_CODIGO_PROCESSO_CIVIL" },
  { url: "https://www.planalto.gov.br/ccivil_03/decreto-lei/del3689compilado.htm", nome: "Código de Processo Penal", sigla: "CPP", tipo: "codigo", descricao: "Decreto-Lei nº 3.689, de 3 de outubro de 1941", tabela_nome: "CPP_CODIGO_PROCESSO_PENAL" },
  { url: "https://www.planalto.gov.br/ccivil_03/leis/l8078compilado.htm", nome: "Código de Defesa do Consumidor", sigla: "CDC", tipo: "codigo", descricao: "Lei nº 8.078, de 11 de setembro de 1990", tabela_nome: "CDC_CODIGO_DEFESA_CONSUMIDOR" },
  { url: "https://www.planalto.gov.br/ccivil_03/leis/l5172compilado.htm", nome: "Código Tributário Nacional", sigla: "CTN", tipo: "codigo", descricao: "Lei nº 5.172, de 25 de outubro de 1966", tabela_nome: "CTN_CODIGO_TRIBUTARIO_NACIONAL" },
  { url: "https://www.planalto.gov.br/ccivil_03/leis/l9503compilado.htm", nome: "Código de Trânsito Brasileiro", sigla: "CTB", tipo: "codigo", descricao: "Lei nº 9.503, de 23 de setembro de 1997", tabela_nome: "CTB_CODIGO_TRANSITO_BRASILEIRO" },
  { url: "https://www.planalto.gov.br/ccivil_03/leis/l4737compilado.htm", nome: "Código Eleitoral", sigla: "CE", tipo: "codigo", descricao: "Lei nº 4.737, de 15 de julho de 1965", tabela_nome: "CE_CODIGO_ELEITORAL" },
  { url: "https://www.planalto.gov.br/ccivil_03/Decreto-Lei/Del1001Compilado.htm", nome: "Código Penal Militar", sigla: "CPM", tipo: "codigo", descricao: "Decreto-Lei nº 1.001, de 21 de outubro de 1969", tabela_nome: "CPM_CODIGO_PENAL_MILITAR" },
  { url: "https://www.planalto.gov.br/ccivil_03/decreto-lei/del1002.htm", nome: "Código de Processo Penal Militar", sigla: "CPPM", tipo: "codigo", descricao: "Decreto-Lei nº 1.002, de 21 de outubro de 1969", tabela_nome: "CPPM_CODIGO_PROCESSO_PENAL_MILITAR" },
  { url: "https://www.planalto.gov.br/ccivil_03/_ato2011-2014/2012/lei/l12651compilado.htm", nome: "Código Florestal", sigla: "CF/2012", tipo: "codigo", descricao: "Lei nº 12.651, de 25 de maio de 2012", tabela_nome: "CFLOR_CODIGO_FLORESTAL" },
  { url: "https://www.planalto.gov.br/ccivil_03/leis/lim/lim556compilado.htm", nome: "Código Comercial", sigla: "CCom", tipo: "codigo", descricao: "Lei nº 556, de 25 de junho de 1850", tabela_nome: "CCOM_CODIGO_COMERCIAL" },
  { url: "https://www.planalto.gov.br/ccivil_03/leis/l9279.htm", nome: "Código de Propriedade Industrial", sigla: "CPI", tipo: "codigo", descricao: "Lei nº 9.279, de 14 de maio de 1996", tabela_nome: "CPI_CODIGO_PROPRIEDADE_INDUSTRIAL" },
  { url: "https://www.planalto.gov.br/ccivil_03/leis/l7565compilado.htm", nome: "Código Brasileiro de Aeronáutica", sigla: "CBA", tipo: "codigo", descricao: "Lei nº 7.565, de 19 de dezembro de 1986", tabela_nome: "CBA_CODIGO_BRASILEIRO_AERONAUTICA" },
  { url: "https://www.planalto.gov.br/ccivil_03/decreto/d24643compilado.htm", nome: "Código de Águas", sigla: "CAgua", tipo: "codigo", descricao: "Decreto nº 24.643, de 10 de julho de 1934", tabela_nome: "CAGUA_CODIGO_AGUAS" },
  { url: "https://www.planalto.gov.br/ccivil_03/decreto-lei/del0227.htm", nome: "Código de Minas", sigla: "CMin", tipo: "codigo", descricao: "Decreto-Lei nº 227, de 28 de fevereiro de 1967", tabela_nome: "CMIN_CODIGO_MINAS" },
  { url: "https://www.planalto.gov.br/ccivil_03/leis/l4117compilada.htm", nome: "Código Brasileiro de Telecomunicações", sigla: "CTel", tipo: "codigo", descricao: "Lei nº 4.117, de 27 de agosto de 1962", tabela_nome: "CTEL_CODIGO_TELECOMUNICACOES" },

  // Estatutos
  { url: "https://www.planalto.gov.br/ccivil_03/leis/l8069.htm", nome: "Estatuto da Criança e do Adolescente", sigla: "ECA", tipo: "estatuto", descricao: "Lei nº 8.069, de 13 de julho de 1990", tabela_nome: "ECA_ESTATUTO_CRIANCA_ADOLESCENTE" },
  { url: "https://www.planalto.gov.br/ccivil_03/leis/2003/l10.741compilado.htm", nome: "Estatuto do Idoso", sigla: "EI", tipo: "estatuto", descricao: "Lei nº 10.741, de 1º de outubro de 2003", tabela_nome: "EI_ESTATUTO_IDOSO" },
  { url: "https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2015/lei/l13146.htm", nome: "Estatuto da Pessoa com Deficiência", sigla: "EPD", tipo: "estatuto", descricao: "Lei nº 13.146, de 6 de julho de 2015", tabela_nome: "EPD_ESTATUTO_PESSOA_DEFICIENCIA" },
  { url: "https://www.planalto.gov.br/ccivil_03/_ato2007-2010/2010/lei/l12288.htm", nome: "Estatuto da Igualdade Racial", sigla: "EIR", tipo: "estatuto", descricao: "Lei nº 12.288, de 20 de julho de 2010", tabela_nome: "EIR_ESTATUTO_IGUALDADE_RACIAL" },
  { url: "https://www.planalto.gov.br/ccivil_03/leis/leis_2001/l10257.htm", nome: "Estatuto da Cidade", sigla: "EC", tipo: "estatuto", descricao: "Lei nº 10.257, de 10 de julho de 2001", tabela_nome: "EC_ESTATUTO_CIDADE" },
  { url: "https://www.planalto.gov.br/ccivil_03/leis/2003/l10.826compilado.htm", nome: "Estatuto do Desarmamento", sigla: "ED", tipo: "estatuto", descricao: "Lei nº 10.826, de 22 de dezembro de 2003", tabela_nome: "ED_ESTATUTO_DESARMAMENTO" },
  { url: "https://www.planalto.gov.br/ccivil_03/leis/l8906.htm", nome: "Estatuto da OAB", sigla: "EOAB", tipo: "estatuto", descricao: "Lei nº 8.906, de 4 de julho de 1994", tabela_nome: "EOAB_ESTATUTO_OAB" },
  { url: "https://www.planalto.gov.br/ccivil_03/leis/2003/l10.671compilado.htm", nome: "Estatuto do Torcedor", sigla: "ET", tipo: "estatuto", descricao: "Lei nº 10.671, de 15 de maio de 2003", tabela_nome: "ET_ESTATUTO_TORCEDOR" },
  { url: "https://www.planalto.gov.br/ccivil_03/_ato2011-2014/2013/lei/l12852.htm", nome: "Estatuto da Juventude", sigla: "EJ", tipo: "estatuto", descricao: "Lei nº 12.852, de 5 de agosto de 2013", tabela_nome: "EJ_ESTATUTO_JUVENTUDE" },
  { url: "https://www.planalto.gov.br/ccivil_03/leis/l6880compilada.htm", nome: "Estatuto dos Militares", sigla: "EM", tipo: "estatuto", descricao: "Lei nº 6.880, de 9 de dezembro de 1980", tabela_nome: "EM_ESTATUTO_MILITARES" },
  { url: "https://www.planalto.gov.br/ccivil_03/leis/l6001.htm", nome: "Estatuto do Índio", sigla: "EInd", tipo: "estatuto", descricao: "Lei nº 6.001, de 19 de dezembro de 1973", tabela_nome: "EIND_ESTATUTO_INDIO" },
  { url: "https://www.planalto.gov.br/ccivil_03/leis/l4504compilada.htm", nome: "Estatuto da Terra", sigla: "ETerra", tipo: "estatuto", descricao: "Lei nº 4.504, de 30 de novembro de 1964", tabela_nome: "ETERRA_ESTATUTO_TERRA" },
  { url: "https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2017/lei/l13445.htm", nome: "Estatuto da Migração", sigla: "EMig", tipo: "estatuto", descricao: "Lei nº 13.445, de 24 de maio de 2017", tabela_nome: "EMIG_ESTATUTO_MIGRACAO" },
  { url: "https://www.planalto.gov.br/ccivil_03/leis/l9474.htm", nome: "Estatuto do Refugiado", sigla: "ERef", tipo: "estatuto", descricao: "Lei nº 9.474, de 22 de julho de 1997", tabela_nome: "EREF_ESTATUTO_REFUGIADO" },
  { url: "https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2015/lei/l13089.htm", nome: "Estatuto da Metrópole", sigla: "EMet", tipo: "estatuto", descricao: "Lei nº 13.089, de 12 de janeiro de 2015", tabela_nome: "EMET_ESTATUTO_METROPOLE" },
  { url: "https://www.planalto.gov.br/ccivil_03/_Ato2007-2010/2009/Lei/L11904.htm", nome: "Estatuto dos Museus", sigla: "EMus", tipo: "estatuto", descricao: "Lei nº 11.904, de 14 de janeiro de 2009", tabela_nome: "EMUS_ESTATUTO_MUSEUS" },
  { url: "https://www.planalto.gov.br/ccivil_03/Leis/LCP/Lcp123.htm", nome: "Estatuto Nacional da Microempresa", sigla: "EME", tipo: "estatuto", descricao: "LC nº 123, de 14 de dezembro de 2006", tabela_nome: "EME_ESTATUTO_MICROEMPRESA" },
  { url: "https://www.planalto.gov.br/ccivil_03/_ato2019-2022/2021/lei/L14238.htm", nome: "Estatuto da Pessoa com Câncer", sigla: "EPC", tipo: "estatuto", descricao: "Lei nº 14.238, de 19 de novembro de 2021", tabela_nome: "EPC_ESTATUTO_PESSOA_CANCER" },

  // Leis Ordinárias
  { url: "https://www.planalto.gov.br/ccivil_03/decreto-lei/del5452compilado.htm", nome: "Consolidação das Leis do Trabalho", sigla: "CLT", tipo: "lei-ordinaria", descricao: "Decreto-Lei nº 5.452, de 1º de maio de 1943", tabela_nome: "CLT_CONSOLIDACAO_LEIS_TRABALHO" },
  { url: "https://www.planalto.gov.br/ccivil_03/_ato2004-2006/2006/lei/l11340.htm", nome: "Lei Maria da Penha", sigla: "LMP", tipo: "lei-ordinaria", descricao: "Lei nº 11.340, de 7 de agosto de 2006", tabela_nome: "LMP_LEI_MARIA_PENHA" },
  { url: "https://www.planalto.gov.br/ccivil_03/_ato2004-2006/2006/lei/l11343.htm", nome: "Lei de Drogas", sigla: "LD", tipo: "lei-ordinaria", descricao: "Lei nº 11.343, de 23 de agosto de 2006", tabela_nome: "LD_LEI_DROGAS" },
  { url: "https://www.planalto.gov.br/ccivil_03/leis/l7210compilado.htm", nome: "Lei de Execução Penal", sigla: "LEP", tipo: "lei-ordinaria", descricao: "Lei nº 7.210, de 11 de julho de 1984", tabela_nome: "LEP_LEI_EXECUCAO_PENAL" },
  { url: "https://www.planalto.gov.br/ccivil_03/leis/l8072compilada.htm", nome: "Lei de Crimes Hediondos", sigla: "LCH", tipo: "lei-ordinaria", descricao: "Lei nº 8.072, de 25 de julho de 1990", tabela_nome: "LCH_LEI_CRIMES_HEDIONDOS" },
  { url: "https://www.planalto.gov.br/ccivil_03/leis/l8429.htm", nome: "Lei de Improbidade Administrativa", sigla: "LIA", tipo: "lei-ordinaria", descricao: "Lei nº 8.429, de 2 de junho de 1992", tabela_nome: "LIA_LEI_IMPROBIDADE_ADMINISTRATIVA" },
  { url: "https://www.planalto.gov.br/ccivil_03/_ato2019-2022/2021/lei/l14133.htm", nome: "Lei de Licitações", sigla: "LLic", tipo: "lei-ordinaria", descricao: "Lei nº 14.133, de 1º de abril de 2021", tabela_nome: "LLIC_LEI_LICITACOES" },
  { url: "https://www.planalto.gov.br/ccivil_03/leis/l8112compilado.htm", nome: "Lei do Servidor Público", sigla: "LSP", tipo: "lei-ordinaria", descricao: "Lei nº 8.112, de 11 de dezembro de 1990", tabela_nome: "LSP_LEI_SERVIDOR_PUBLICO" },
  { url: "https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm", nome: "Lei Geral de Proteção de Dados", sigla: "LGPD", tipo: "lei-ordinaria", descricao: "Lei nº 13.709, de 14 de agosto de 2018", tabela_nome: "LGPD_LEI_PROTECAO_DADOS" },
  { url: "https://www.planalto.gov.br/ccivil_03/_ato2011-2014/2014/lei/l12965.htm", nome: "Marco Civil da Internet", sigla: "MCI", tipo: "lei-ordinaria", descricao: "Lei nº 12.965, de 23 de abril de 2014", tabela_nome: "MCI_MARCO_CIVIL_INTERNET" },
  { url: "https://www.planalto.gov.br/ccivil_03/_ato2011-2014/2013/lei/l12850.htm", nome: "Lei de Organizações Criminosas", sigla: "LOC", tipo: "lei-ordinaria", descricao: "Lei nº 12.850, de 2 de agosto de 2013", tabela_nome: "LOC_LEI_ORG_CRIMINOSAS" },
  { url: "https://www.planalto.gov.br/ccivil_03/leis/l9455.htm", nome: "Lei de Tortura", sigla: "LT", tipo: "lei-ordinaria", descricao: "Lei nº 9.455, de 7 de abril de 1997", tabela_nome: "LT_LEI_TORTURA" },
  { url: "https://www.planalto.gov.br/ccivil_03/_ato2019-2022/2019/lei/l13869.htm", nome: "Lei de Abuso de Autoridade", sigla: "LAA", tipo: "lei-ordinaria", descricao: "Lei nº 13.869, de 5 de setembro de 2019", tabela_nome: "LAA_LEI_ABUSO_AUTORIDADE" },
  { url: "https://www.planalto.gov.br/ccivil_03/leis/l9784.htm", nome: "Lei do Processo Administrativo", sigla: "LPA", tipo: "lei-ordinaria", descricao: "Lei nº 9.784, de 29 de janeiro de 1999", tabela_nome: "LPA_LEI_PROCESSO_ADMINISTRATIVO" },
  { url: "https://www.planalto.gov.br/ccivil_03/leis/l9605compilado.htm", nome: "Lei de Crimes Ambientais", sigla: "LCA", tipo: "lei-ordinaria", descricao: "Lei nº 9.605, de 12 de fevereiro de 1998", tabela_nome: "LCA_LEI_CRIMES_AMBIENTAIS" },
  { url: "https://www.planalto.gov.br/ccivil_03/leis/l7347compilada.htm", nome: "Lei da Ação Civil Pública", sigla: "LACP", tipo: "lei-ordinaria", descricao: "Lei nº 7.347, de 24 de julho de 1985", tabela_nome: "LACP_LEI_ACAO_CIVIL_PUBLICA" },
  { url: "https://www.planalto.gov.br/ccivil_03/leis/l9099.htm", nome: "Lei dos Juizados Especiais", sigla: "LJE", tipo: "lei-ordinaria", descricao: "Lei nº 9.099, de 26 de setembro de 1995", tabela_nome: "LJE_LEI_JUIZADOS_ESPECIAIS" },
  { url: "https://www.planalto.gov.br/ccivil_03/_ato2011-2014/2011/lei/l12527.htm", nome: "Lei de Acesso à Informação", sigla: "LAI", tipo: "lei-ordinaria", descricao: "Lei nº 12.527, de 18 de novembro de 2011", tabela_nome: "LAI_LEI_ACESSO_INFORMACAO" },
  { url: "https://www.planalto.gov.br/ccivil_03/_ato2011-2014/2013/lei/l12846.htm", nome: "Lei Anticorrupção", sigla: "LAC", tipo: "lei-ordinaria", descricao: "Lei nº 12.846, de 1º de agosto de 2013", tabela_nome: "LAC_LEI_ANTICORRUPCAO" },
  { url: "https://www.planalto.gov.br/ccivil_03/_ato2019-2022/2019/lei/l13964.htm", nome: "Pacote Anticrime", sigla: "PAC", tipo: "lei-ordinaria", descricao: "Lei nº 13.964, de 24 de dezembro de 2019", tabela_nome: "PAC_PACOTE_ANTICRIME" },
  { url: "https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp101.htm", nome: "Lei de Responsabilidade Fiscal", sigla: "LRF", tipo: "lei-ordinaria", descricao: "LC nº 101, de 4 de maio de 2000", tabela_nome: "LRF_LEI_RESPONSABILIDADE_FISCAL" },
  { url: "https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp80.htm", nome: "Lei Orgânica da Defensoria Pública", sigla: "LODP", tipo: "lei-ordinaria", descricao: "LC nº 80, de 12 de janeiro de 1994", tabela_nome: "LODP_LEI_ORG_DEFENSORIA" },
  { url: "https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp75.htm", nome: "Lei Orgânica do Ministério Público da União", sigla: "LOMPU", tipo: "lei-ordinaria", descricao: "LC nº 75, de 20 de maio de 1993", tabela_nome: "LOMPU_LEI_ORG_MP_UNIAO" },

  // Decretos
  { url: "https://www.planalto.gov.br/ccivil_03/decreto/d1171.htm", nome: "Decreto de Ética do Servidor", sigla: "DE", tipo: "decreto", descricao: "Decreto nº 1.171, de 22 de junho de 1994", tabela_nome: "DE_DECRETO_ETICA_SERVIDOR" },
  { url: "https://www.planalto.gov.br/ccivil_03/decreto-lei/del3688.htm", nome: "Lei das Contravenções Penais", sigla: "LCP", tipo: "decreto", descricao: "Decreto-Lei nº 3.688, de 3 de outubro de 1941", tabela_nome: "LCP_LEI_CONTRAVENCOES_PENAIS" },
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { siglas, limit } = body as { siglas?: string[]; limit?: number };

    let leisToProcess = LEIS;
    if (siglas && siglas.length > 0) {
      leisToProcess = LEIS.filter((l) => siglas.includes(l.sigla));
    }
    if (limit) {
      leisToProcess = leisToProcess.slice(0, limit);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const results: any[] = [];
    const errors: any[] = [];

    for (const lei of leisToProcess) {
      try {
        console.log(`Processando: ${lei.nome} (${lei.sigla})`);

        const response = await fetch(`${supabaseUrl}/functions/v1/scrape-legislacao`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${supabaseKey}`,
          },
          body: JSON.stringify({
            url: lei.url,
            nome: lei.nome,
            sigla: lei.sigla,
            tipo: lei.tipo,
            descricao: lei.descricao,
            url_planalto: lei.url,
            tabela_nome: lei.tabela_nome,
          }),
        });

        const result = await response.json();

        if (response.ok) {
          results.push(result);
          console.log(`✅ ${lei.sigla}: ${result.totalArtigos} artigos`);
        } else {
          errors.push({ sigla: lei.sigla, error: result.error });
          console.error(`❌ ${lei.sigla}: ${result.error}`);
        }

        await new Promise((r) => setTimeout(r, 3000));
      } catch (err) {
        errors.push({ sigla: lei.sigla, error: err.message });
        console.error(`❌ ${lei.sigla}: ${err.message}`);
      }
    }

    return new Response(
      JSON.stringify({
        totalProcessadas: results.length,
        totalErros: errors.length,
        results,
        errors,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
