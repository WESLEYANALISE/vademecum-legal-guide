/**
 * Catálogo centralizado de leis — fonte única de verdade.
 * Importar daqui em vez de duplicar a lista em cada arquivo.
 */

export interface LeiCatalogItem {
  id: string;
  nome: string;
  sigla: string;
  descricao: string;
  tipo: string;
  tabela_nome: string;
  iconColor?: string;
  url_planalto?: string;
}

/** Versão compacta usada em Estudar, Gamificação, etc. */
export interface LeiCompacta {
  id: string;
  nome: string;
  sigla: string;
  tabela: string;
}

export const LEIS_CATALOG: LeiCatalogItem[] = [
  // Constituição
  { id: 'cf88', nome: 'Constituição Federal', sigla: 'CF/88', descricao: 'Constituição da República Federativa do Brasil de 1988', tipo: 'constituicao', tabela_nome: 'CF88_CONSTITUICAO_FEDERAL', iconColor: '#16a34a', url_planalto: 'https://www.planalto.gov.br/ccivil_03/constituicao/constituicao.htm' },
  // Códigos
  { id: 'cp', nome: 'Código Penal', sigla: 'CP', descricao: 'Decreto-Lei nº 2.848/1940', tipo: 'codigo', tabela_nome: 'CP_CODIGO_PENAL', iconColor: '#ef4444', url_planalto: 'https://www.planalto.gov.br/ccivil_03/decreto-lei/del2848compilado.htm' },
  { id: 'cc', nome: 'Código Civil', sigla: 'CC', descricao: 'Lei nº 10.406/2002', tipo: 'codigo', tabela_nome: 'CC_CODIGO_CIVIL', iconColor: '#f59e0b', url_planalto: 'https://www.planalto.gov.br/ccivil_03/leis/2002/l10406compilada.htm' },
  { id: 'cpc', nome: 'Código de Processo Civil', sigla: 'CPC', descricao: 'Lei nº 13.105/2015', tipo: 'codigo', tabela_nome: 'CPC_CODIGO_PROCESSO_CIVIL', iconColor: '#3b82f6', url_planalto: 'https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2015/lei/l13105.htm' },
  { id: 'cpp', nome: 'Código de Processo Penal', sigla: 'CPP', descricao: 'Decreto-Lei nº 3.689/1941', tipo: 'codigo', tabela_nome: 'CPP_CODIGO_PROCESSO_PENAL', iconColor: '#ec4899', url_planalto: 'https://www.planalto.gov.br/ccivil_03/decreto-lei/del3689compilado.htm' },
  { id: 'ctn', nome: 'Código Tributário Nacional', sigla: 'CTN', descricao: 'Lei nº 5.172/1966', tipo: 'codigo', tabela_nome: 'CTN_CODIGO_TRIBUTARIO_NACIONAL', iconColor: '#10b981', url_planalto: 'https://www.planalto.gov.br/ccivil_03/leis/l5172compilado.htm' },
  { id: 'cdc', nome: 'Código de Defesa do Consumidor', sigla: 'CDC', descricao: 'Lei nº 8.078/1990', tipo: 'codigo', tabela_nome: 'CDC_CODIGO_DEFESA_CONSUMIDOR', iconColor: '#f97316', url_planalto: 'https://www.planalto.gov.br/ccivil_03/leis/l8078compilado.htm' },
  { id: 'clt', nome: 'Consolidação das Leis do Trabalho', sigla: 'CLT', descricao: 'Decreto-Lei nº 5.452/1943', tipo: 'codigo', tabela_nome: 'CLT_CONSOLIDACAO_LEIS_TRABALHO', iconColor: '#8b5cf6', url_planalto: 'https://www.planalto.gov.br/ccivil_03/decreto-lei/del5452compilado.htm' },
  { id: 'ctb', nome: 'Código de Trânsito Brasileiro', sigla: 'CTB', descricao: 'Lei nº 9.503/1997', tipo: 'codigo', tabela_nome: 'CTB_CODIGO_TRANSITO_BRASILEIRO', iconColor: '#0ea5e9', url_planalto: 'https://www.planalto.gov.br/ccivil_03/leis/l9503compilado.htm' },
  { id: 'ce', nome: 'Código Eleitoral', sigla: 'CE', descricao: 'Lei nº 4.737/1965', tipo: 'codigo', tabela_nome: 'CE_CODIGO_ELEITORAL', iconColor: '#6366f1', url_planalto: 'https://www.planalto.gov.br/ccivil_03/leis/l4737compilado.htm' },
  { id: 'cpm', nome: 'Código Penal Militar', sigla: 'CPM', descricao: 'Decreto-Lei nº 1.001/1969', tipo: 'codigo', tabela_nome: 'CPM_CODIGO_PENAL_MILITAR', iconColor: '#dc2626', url_planalto: 'https://www.planalto.gov.br/ccivil_03/decreto-lei/del1001compilado.htm' },
  { id: 'cppm', nome: 'Código de Processo Penal Militar', sigla: 'CPPM', descricao: 'Decreto-Lei nº 1.002/1969', tipo: 'codigo', tabela_nome: 'CPPM_CODIGO_PROCESSO_PENAL_MILITAR', iconColor: '#b91c1c', url_planalto: 'https://www.planalto.gov.br/ccivil_03/decreto-lei/del1002compilado.htm' },
  { id: 'cflor', nome: 'Código Florestal', sigla: 'CF/2012', descricao: 'Lei nº 12.651/2012', tipo: 'codigo', tabela_nome: 'CFLOR_CODIGO_FLORESTAL', iconColor: '#16a34a', url_planalto: 'https://www.planalto.gov.br/ccivil_03/_ato2011-2014/2012/lei/l12651compilado.htm' },
  { id: 'ccom', nome: 'Código Comercial', sigla: 'CCom', descricao: 'Lei nº 556/1850', tipo: 'codigo', tabela_nome: 'CCOM_CODIGO_COMERCIAL', iconColor: '#a16207', url_planalto: 'https://www.planalto.gov.br/ccivil_03/leis/lim/lim556compilado.htm' },
  { id: 'cba', nome: 'Código Brasileiro de Aeronáutica', sigla: 'CBA', descricao: 'Lei nº 7.565/1986', tipo: 'codigo', tabela_nome: 'CBA_CODIGO_BRASILEIRO_AERONAUTICA', iconColor: '#0284c7', url_planalto: 'https://www.planalto.gov.br/ccivil_03/leis/l7565compilado.htm' },
  { id: 'cagua', nome: 'Código de Águas', sigla: 'CAgua', descricao: 'Decreto nº 24.643/1934', tipo: 'codigo', tabela_nome: 'CAGUA_CODIGO_AGUAS', iconColor: '#0891b2', url_planalto: 'https://www.planalto.gov.br/ccivil_03/decreto/d24643compilado.htm' },
  { id: 'cmin', nome: 'Código de Minas', sigla: 'CMin', descricao: 'Decreto-Lei nº 227/1967', tipo: 'codigo', tabela_nome: 'CMIN_CODIGO_MINAS', iconColor: '#78716c', url_planalto: 'https://www.planalto.gov.br/ccivil_03/decreto-lei/del0227compilado.htm' },
  { id: 'ctel', nome: 'Código Brasileiro de Telecomunicações', sigla: 'CTel', descricao: 'Lei nº 4.117/1962', tipo: 'codigo', tabela_nome: 'CTEL_CODIGO_TELECOMUNICACOES', iconColor: '#7c3aed', url_planalto: 'https://www.planalto.gov.br/ccivil_03/leis/l4117compilado.htm' },
  // Estatutos
  { id: 'eca', nome: 'Estatuto da Criança e do Adolescente', sigla: 'ECA', descricao: 'Lei nº 8.069/1990', tipo: 'estatuto', tabela_nome: 'ECA_ESTATUTO_CRIANCA_ADOLESCENTE', iconColor: '#f43f5e', url_planalto: 'https://www.planalto.gov.br/ccivil_03/leis/l8069compilado.htm' },
  { id: 'ei', nome: 'Estatuto do Idoso', sigla: 'EI', descricao: 'Lei nº 10.741/2003', tipo: 'estatuto', tabela_nome: 'EI_ESTATUTO_IDOSO', iconColor: '#8b5cf6', url_planalto: 'https://www.planalto.gov.br/ccivil_03/leis/2003/l10.741compilado.htm' },
  { id: 'epd', nome: 'Estatuto da Pessoa com Deficiência', sigla: 'EPD', descricao: 'Lei nº 13.146/2015', tipo: 'estatuto', tabela_nome: 'EPD_ESTATUTO_PESSOA_DEFICIENCIA', iconColor: '#06b6d4', url_planalto: 'https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2015/lei/l13146.htm' },
  { id: 'eir', nome: 'Estatuto da Igualdade Racial', sigla: 'EIR', descricao: 'Lei nº 12.288/2010', tipo: 'estatuto', tabela_nome: 'EIR_ESTATUTO_IGUALDADE_RACIAL', iconColor: '#f59e0b', url_planalto: 'https://www.planalto.gov.br/ccivil_03/_ato2007-2010/2010/lei/l12288.htm' },
  { id: 'ec', nome: 'Estatuto da Cidade', sigla: 'EC', descricao: 'Lei nº 10.257/2001', tipo: 'estatuto', tabela_nome: 'EC_ESTATUTO_CIDADE', iconColor: '#10b981', url_planalto: 'https://www.planalto.gov.br/ccivil_03/leis/leis_2001/l10257.htm' },
  { id: 'ed', nome: 'Estatuto do Desarmamento', sigla: 'ED', descricao: 'Lei nº 10.826/2003', tipo: 'estatuto', tabela_nome: 'ED_ESTATUTO_DESARMAMENTO', iconColor: '#ef4444', url_planalto: 'https://www.planalto.gov.br/ccivil_03/leis/2003/l10.826compilado.htm' },
  { id: 'eoab', nome: 'Estatuto da OAB', sigla: 'EOAB', descricao: 'Lei nº 8.906/1994', tipo: 'estatuto', tabela_nome: 'EOAB_ESTATUTO_OAB', iconColor: '#1d4ed8', url_planalto: 'https://www.planalto.gov.br/ccivil_03/leis/l8906compilada.htm' },
  { id: 'et', nome: 'Estatuto do Torcedor', sigla: 'ET', descricao: 'Lei nº 10.671/2003', tipo: 'estatuto', tabela_nome: 'ET_ESTATUTO_TORCEDOR', iconColor: '#16a34a', url_planalto: 'https://www.planalto.gov.br/ccivil_03/leis/2003/l10.671compilado.htm' },
  { id: 'ej', nome: 'Estatuto da Juventude', sigla: 'EJ', descricao: 'Lei nº 12.852/2013', tipo: 'estatuto', tabela_nome: 'EJ_ESTATUTO_JUVENTUDE', iconColor: '#d946ef', url_planalto: 'https://www.planalto.gov.br/ccivil_03/_ato2011-2014/2013/lei/l12852.htm' },
  { id: 'em', nome: 'Estatuto dos Militares', sigla: 'EM', descricao: 'Lei nº 6.880/1980', tipo: 'estatuto', tabela_nome: 'EM_ESTATUTO_MILITARES', iconColor: '#475569', url_planalto: 'https://www.planalto.gov.br/ccivil_03/leis/l6880compilada.htm' },
  { id: 'eind', nome: 'Estatuto do Índio', sigla: 'EInd', descricao: 'Lei nº 6.001/1973', tipo: 'estatuto', tabela_nome: 'EIND_ESTATUTO_INDIO', iconColor: '#b45309', url_planalto: 'https://www.planalto.gov.br/ccivil_03/leis/l6001.htm' },
  { id: 'eterra', nome: 'Estatuto da Terra', sigla: 'ETerra', descricao: 'Lei nº 4.504/1964', tipo: 'estatuto', tabela_nome: 'ETERRA_ESTATUTO_TERRA', iconColor: '#65a30d', url_planalto: 'https://www.planalto.gov.br/ccivil_03/leis/l4504compilada.htm' },
  { id: 'emig', nome: 'Estatuto da Migração', sigla: 'EMig', descricao: 'Lei nº 13.445/2017', tipo: 'estatuto', tabela_nome: 'EMIG_ESTATUTO_MIGRACAO', iconColor: '#0891b2', url_planalto: 'https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2017/lei/l13445.htm' },
  { id: 'eref', nome: 'Estatuto do Refugiado', sigla: 'ERef', descricao: 'Lei nº 9.474/1997', tipo: 'estatuto', tabela_nome: 'EREF_ESTATUTO_REFUGIADO', iconColor: '#7c3aed', url_planalto: 'https://www.planalto.gov.br/ccivil_03/leis/l9474.htm' },
  { id: 'emet', nome: 'Estatuto da Metrópole', sigla: 'EMet', descricao: 'Lei nº 13.089/2015', tipo: 'estatuto', tabela_nome: 'EMET_ESTATUTO_METROPOLE', iconColor: '#64748b', url_planalto: 'https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2015/lei/l13089.htm' },
  { id: 'emus', nome: 'Estatuto dos Museus', sigla: 'EMus', descricao: 'Lei nº 11.904/2009', tipo: 'estatuto', tabela_nome: 'EMUS_ESTATUTO_MUSEUS', iconColor: '#a855f7', url_planalto: 'https://www.planalto.gov.br/ccivil_03/_ato2007-2010/2009/lei/l11904.htm' },
  { id: 'eme', nome: 'Estatuto Nacional da Microempresa', sigla: 'EME', descricao: 'LC nº 123/2006', tipo: 'estatuto', tabela_nome: 'EME_ESTATUTO_MICROEMPRESA', iconColor: '#ea580c', url_planalto: 'https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp123compilado.htm' },
  { id: 'epc', nome: 'Estatuto da Pessoa com Câncer', sigla: 'EPC', descricao: 'Lei nº 14.238/2021', tipo: 'estatuto', tabela_nome: 'EPC_ESTATUTO_PESSOA_CANCER', iconColor: '#e11d48', url_planalto: 'https://www.planalto.gov.br/ccivil_03/_ato2019-2022/2021/lei/l14238.htm' },
  // Leis Especiais
  { id: 'lep', nome: 'Lei de Execução Penal', sigla: 'LEP', descricao: 'Lei nº 7.210/1984', tipo: 'lei-especial', tabela_nome: 'LEP_EXECUCAO_PENAL', iconColor: '#dc2626', url_planalto: 'https://www.planalto.gov.br/ccivil_03/leis/l7210compilado.htm' },
  { id: 'lmp', nome: 'Lei Maria da Penha', sigla: 'LMP', descricao: 'Lei nº 11.340/2006', tipo: 'lei-especial', tabela_nome: 'LMP_MARIA_PENHA', iconColor: '#e11d48', url_planalto: 'https://www.planalto.gov.br/ccivil_03/_ato2004-2006/2006/lei/l11340.htm' },
  { id: 'ld', nome: 'Lei de Drogas', sigla: 'LD', descricao: 'Lei nº 11.343/2006', tipo: 'lei-especial', tabela_nome: 'LD_LEI_DROGAS', iconColor: '#b91c1c', url_planalto: 'https://www.planalto.gov.br/ccivil_03/_ato2004-2006/2006/lei/l11343.htm' },
  { id: 'loc', nome: 'Lei de Organização Criminosa', sigla: 'LOC', descricao: 'Lei nº 12.850/2013', tipo: 'lei-especial', tabela_nome: 'LOC_ORGANIZACAO_CRIMINOSA', iconColor: '#991b1b', url_planalto: 'https://www.planalto.gov.br/ccivil_03/_ato2011-2014/2013/lei/l12850.htm' },
  { id: 'laa', nome: 'Lei de Abuso de Autoridade', sigla: 'LAA', descricao: 'Lei nº 13.869/2019', tipo: 'lei-especial', tabela_nome: 'LAA_ABUSO_AUTORIDADE', iconColor: '#9f1239', url_planalto: 'https://www.planalto.gov.br/ccivil_03/_ato2019-2022/2019/lei/L13869.htm' },
  { id: 'lit', nome: 'Lei de Interceptação Telefônica', sigla: 'LIT', descricao: 'Lei nº 9.296/1996', tipo: 'lei-especial', tabela_nome: 'LIT_INTERCEPTACAO_TELEFONICA', iconColor: '#7c3aed', url_planalto: 'https://www.planalto.gov.br/ccivil_03/leis/l9296.htm' },
  { id: 'l8112', nome: 'Estatuto dos Servidores Federais', sigla: 'L8112', descricao: 'Lei nº 8.112/1990', tipo: 'lei-especial', tabela_nome: 'L8112_SERVIDORES_FEDERAIS', iconColor: '#2563eb', url_planalto: 'https://www.planalto.gov.br/ccivil_03/leis/l8112compilado.htm' },
  { id: 'lia', nome: 'Lei de Improbidade Administrativa', sigla: 'LIA', descricao: 'Lei nº 8.429/1992', tipo: 'lei-especial', tabela_nome: 'LIA_IMPROBIDADE_ADMINISTRATIVA', iconColor: '#1d4ed8', url_planalto: 'https://www.planalto.gov.br/ccivil_03/leis/l8429compilado.htm' },
  { id: 'nll', nome: 'Nova Lei de Licitações', sigla: 'NLL', descricao: 'Lei nº 14.133/2021', tipo: 'lei-especial', tabela_nome: 'NLL_LICITACOES', iconColor: '#0369a1', url_planalto: 'https://www.planalto.gov.br/ccivil_03/_ato2019-2022/2021/lei/L14133.htm' },
  { id: 'lms', nome: 'Lei do Mandado de Segurança', sigla: 'LMS', descricao: 'Lei nº 12.016/2009', tipo: 'lei-especial', tabela_nome: 'LMS_MANDADO_SEGURANCA', iconColor: '#4338ca', url_planalto: 'https://www.planalto.gov.br/ccivil_03/_ato2007-2010/2009/lei/l12016.htm' },
  { id: 'lacp', nome: 'Lei da Ação Civil Pública', sigla: 'LACP', descricao: 'Lei nº 7.347/1985', tipo: 'lei-especial', tabela_nome: 'LACP_ACAO_CIVIL_PUBLICA', iconColor: '#6d28d9', url_planalto: 'https://www.planalto.gov.br/ccivil_03/leis/l7347compilada.htm' },
  { id: 'lje', nome: 'Lei dos Juizados Especiais', sigla: 'LJE', descricao: 'Lei nº 9.099/1995', tipo: 'lei-especial', tabela_nome: 'LJE_JUIZADOS_ESPECIAIS', iconColor: '#059669', url_planalto: 'https://www.planalto.gov.br/ccivil_03/leis/l9099compilado.htm' },
  { id: 'lgpd', nome: 'Lei Geral de Proteção de Dados', sigla: 'LGPD', descricao: 'Lei nº 13.709/2018', tipo: 'lei-especial', tabela_nome: 'LGPD_PROTECAO_DADOS', iconColor: '#0891b2', url_planalto: 'https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm' },
  { id: 'mci', nome: 'Marco Civil da Internet', sigla: 'MCI', descricao: 'Lei nº 12.965/2014', tipo: 'lei-especial', tabela_nome: 'MCI_MARCO_CIVIL_INTERNET', iconColor: '#0e7490', url_planalto: 'https://www.planalto.gov.br/ccivil_03/_ato2011-2014/2014/lei/l12965.htm' },
  { id: 'lf', nome: 'Lei de Falências e Recuperação', sigla: 'LF', descricao: 'Lei nº 11.101/2005', tipo: 'lei-especial', tabela_nome: 'LF_FALENCIAS', iconColor: '#a16207', url_planalto: 'https://www.planalto.gov.br/ccivil_03/_ato2004-2006/2005/lei/l11101compilado.htm' },
  { id: 'la', nome: 'Lei de Arbitragem', sigla: 'LA', descricao: 'Lei nº 9.307/1996', tipo: 'lei-especial', tabela_nome: 'LA_ARBITRAGEM', iconColor: '#ca8a04', url_planalto: 'https://www.planalto.gov.br/ccivil_03/leis/l9307.htm' },
  { id: 'li', nome: 'Lei do Inquilinato', sigla: 'LI', descricao: 'Lei nº 8.245/1991', tipo: 'lei-especial', tabela_nome: 'LI_INQUILINATO', iconColor: '#ea580c', url_planalto: 'https://www.planalto.gov.br/ccivil_03/leis/l8245compilado.htm' },
  { id: 'lrp', nome: 'Lei de Registros Públicos', sigla: 'LRP', descricao: 'Lei nº 6.015/1973', tipo: 'lei-especial', tabela_nome: 'LRP_REGISTROS_PUBLICOS', iconColor: '#78716c', url_planalto: 'https://www.planalto.gov.br/ccivil_03/leis/l6015compilada.htm' },
  { id: 'loman', nome: 'Lei Orgânica da Magistratura', sigla: 'LOMAN', descricao: 'LC nº 35/1979', tipo: 'lei-especial', tabela_nome: 'LOMAN_LEI_ORGANICA_MAGISTRATURA', iconColor: '#475569', url_planalto: 'https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp35.htm' },
  { id: 'lat', nome: 'Lei Antiterrorismo', sigla: 'LAT', descricao: 'Lei nº 13.260/2016', tipo: 'lei-especial', tabela_nome: 'LAT_ANTITERRORISMO', iconColor: '#be123c', url_planalto: 'https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2016/lei/l13260.htm' },
  // Previdenciário
  { id: 'lbps', nome: 'Lei de Benefícios da Previdência', sigla: 'LBPS', descricao: 'Lei nº 8.213/1991', tipo: 'previdenciario', tabela_nome: 'LBPS_BENEFICIOS_PREVIDENCIA', iconColor: '#0d9488', url_planalto: 'https://www.planalto.gov.br/ccivil_03/leis/l8213compilado.htm' },
  { id: 'lcss', nome: 'Lei do Custeio da Seguridade Social', sigla: 'LCSS', descricao: 'Lei nº 8.212/1991', tipo: 'previdenciario', tabela_nome: 'LCSS_CUSTEIO_SEGURIDADE', iconColor: '#14b8a6', url_planalto: 'https://www.planalto.gov.br/ccivil_03/leis/l8212compilado.htm' },
  { id: 'lpc', nome: 'Lei da Previdência Complementar', sigla: 'LPC', descricao: 'LC nº 109/2001', tipo: 'previdenciario', tabela_nome: 'LPC_PREVIDENCIA_COMPLEMENTAR', iconColor: '#2dd4bf', url_planalto: 'https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp109.htm' },
];

/** Versão compacta para telas de seleção de lei (Estudar, Gamificação) */
export const LEIS_COMPACTAS: LeiCompacta[] = LEIS_CATALOG.map(l => ({
  id: l.id,
  nome: l.nome,
  sigla: l.sigla,
  tabela: l.tabela_nome,
}));

/** Busca uma lei pelo id */
export function getLeiById(id: string): LeiCatalogItem | undefined {
  return LEIS_CATALOG.find(l => l.id === id);
}

/** Busca uma lei pela tabela_nome */
export function getLeiByTabela(tabela: string): LeiCatalogItem | undefined {
  return LEIS_CATALOG.find(l => l.tabela_nome === tabela);
}

/** Filtra leis por tipo */
export function getLeisPorTipo(tipo: string): LeiCatalogItem[] {
  return LEIS_CATALOG.filter(l => l.tipo === tipo);
}
