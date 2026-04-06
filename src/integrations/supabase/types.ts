export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      anotacoes_artigo: {
        Row: {
          artigo_numero: string
          created_at: string
          id: string
          sugerida: boolean
          tabela_nome: string
          texto: string
          user_id: string | null
        }
        Insert: {
          artigo_numero: string
          created_at?: string
          id?: string
          sugerida?: boolean
          tabela_nome: string
          texto?: string
          user_id?: string | null
        }
        Update: {
          artigo_numero?: string
          created_at?: string
          id?: string
          sugerida?: boolean
          tabela_nome?: string
          texto?: string
          user_id?: string | null
        }
        Relationships: []
      }
      artigo_ai_cache: {
        Row: {
          artigo_numero: string
          conteudo: string
          created_at: string | null
          id: string
          modo: string
          tabela_nome: string
        }
        Insert: {
          artigo_numero: string
          conteudo: string
          created_at?: string | null
          id?: string
          modo: string
          tabela_nome: string
        }
        Update: {
          artigo_numero?: string
          conteudo?: string
          created_at?: string | null
          id?: string
          modo?: string
          tabela_nome?: string
        }
        Relationships: []
      }
      artigo_educacional_cache: {
        Row: {
          categoria: string
          conteudo_md: string
          created_at: string | null
          fontes: Json | null
          id: string
          slug: string
          titulo: string
        }
        Insert: {
          categoria: string
          conteudo_md?: string
          created_at?: string | null
          fontes?: Json | null
          id?: string
          slug: string
          titulo: string
        }
        Update: {
          categoria?: string
          conteudo_md?: string
          created_at?: string | null
          fontes?: Json | null
          id?: string
          slug?: string
          titulo?: string
        }
        Relationships: []
      }
      assinaturas: {
        Row: {
          asaas_customer_id: string | null
          asaas_subscription_id: string | null
          created_at: string
          id: string
          payment_link: string | null
          plano: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          asaas_customer_id?: string | null
          asaas_subscription_id?: string | null
          created_at?: string
          id?: string
          payment_link?: string | null
          plano: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          asaas_customer_id?: string | null
          asaas_subscription_id?: string | null
          created_at?: string
          id?: string
          payment_link?: string | null
          plano?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      biblioteca_classicos: {
        Row: {
          analise_status: string | null
          area: string | null
          aula: string | null
          autor: string | null
          beneficios: string | null
          capa_area: string | null
          capitulos_gerados: number | null
          download: string | null
          id: number
          imagem: string | null
          link: string | null
          livro: string | null
          questoes_resumo: Json | null
          resumo_capitulos: Json | null
          resumo_gerado_em: string | null
          sobre: string | null
          total_capitulos: number | null
          total_paginas: number | null
          total_temas: number | null
          url_capa_gerada: string | null
          url_videoaula: string | null
        }
        Insert: {
          analise_status?: string | null
          area?: string | null
          aula?: string | null
          autor?: string | null
          beneficios?: string | null
          capa_area?: string | null
          capitulos_gerados?: number | null
          download?: string | null
          id: number
          imagem?: string | null
          link?: string | null
          livro?: string | null
          questoes_resumo?: Json | null
          resumo_capitulos?: Json | null
          resumo_gerado_em?: string | null
          sobre?: string | null
          total_capitulos?: number | null
          total_paginas?: number | null
          total_temas?: number | null
          url_capa_gerada?: string | null
          url_videoaula?: string | null
        }
        Update: {
          analise_status?: string | null
          area?: string | null
          aula?: string | null
          autor?: string | null
          beneficios?: string | null
          capa_area?: string | null
          capitulos_gerados?: number | null
          download?: string | null
          id?: number
          imagem?: string | null
          link?: string | null
          livro?: string | null
          questoes_resumo?: Json | null
          resumo_capitulos?: Json | null
          resumo_gerado_em?: string | null
          sobre?: string | null
          total_capitulos?: number | null
          total_paginas?: number | null
          total_temas?: number | null
          url_capa_gerada?: string | null
          url_videoaula?: string | null
        }
        Relationships: []
      }
      biblioteca_contribuicoes: {
        Row: {
          aprovado: boolean | null
          area: string | null
          autor: string | null
          contribuidor_id: string | null
          created_at: string | null
          download: string | null
          formato: string | null
          id: number
          idioma: string | null
          imagem: string | null
          livro: string
          md5: string | null
          sobre: string | null
          tamanho: string | null
          updated_at: string | null
        }
        Insert: {
          aprovado?: boolean | null
          area?: string | null
          autor?: string | null
          contribuidor_id?: string | null
          created_at?: string | null
          download?: string | null
          formato?: string | null
          id?: number
          idioma?: string | null
          imagem?: string | null
          livro: string
          md5?: string | null
          sobre?: string | null
          tamanho?: string | null
          updated_at?: string | null
        }
        Update: {
          aprovado?: boolean | null
          area?: string | null
          autor?: string | null
          contribuidor_id?: string | null
          created_at?: string | null
          download?: string | null
          formato?: string | null
          id?: number
          idioma?: string | null
          imagem?: string | null
          livro?: string
          md5?: string | null
          sobre?: string | null
          tamanho?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      biblioteca_estudos: {
        Row: {
          area: string | null
          aula: string | null
          capa_area: string | null
          capa_livro: string | null
          download: string | null
          id: number
          link: string | null
          ordem: number | null
          sobre: string | null
          tema: string | null
          url_capa_gerada: string | null
        }
        Insert: {
          area?: string | null
          aula?: string | null
          capa_area?: string | null
          capa_livro?: string | null
          download?: string | null
          id: number
          link?: string | null
          ordem?: number | null
          sobre?: string | null
          tema?: string | null
          url_capa_gerada?: string | null
        }
        Update: {
          area?: string | null
          aula?: string | null
          capa_area?: string | null
          capa_livro?: string | null
          download?: string | null
          id?: number
          link?: string | null
          ordem?: number | null
          sobre?: string | null
          tema?: string | null
          url_capa_gerada?: string | null
        }
        Relationships: []
      }
      biblioteca_favoritos: {
        Row: {
          categoria: string
          created_at: string
          id: string
          livro_key: string
          user_id: string
        }
        Insert: {
          categoria?: string
          created_at?: string
          id?: string
          livro_key: string
          user_id: string
        }
        Update: {
          categoria?: string
          created_at?: string
          id?: string
          livro_key?: string
          user_id?: string
        }
        Relationships: []
      }
      biblioteca_fora_da_toga: {
        Row: {
          area: string | null
          aula: string | null
          autor: string | null
          capa_area: string | null
          capa_livro: string | null
          download: string | null
          id: number
          link: string | null
          livro: string | null
          sobre: string | null
        }
        Insert: {
          area?: string | null
          aula?: string | null
          autor?: string | null
          capa_area?: string | null
          capa_livro?: string | null
          download?: string | null
          id: number
          link?: string | null
          livro?: string | null
          sobre?: string | null
        }
        Update: {
          area?: string | null
          aula?: string | null
          autor?: string | null
          capa_area?: string | null
          capa_livro?: string | null
          download?: string | null
          id?: number
          link?: string | null
          livro?: string | null
          sobre?: string | null
        }
        Relationships: []
      }
      biblioteca_imagens: {
        Row: {
          alt_text: string | null
          created_at: string
          id: string
          livro_id: string
          pagina: number
          url: string
        }
        Insert: {
          alt_text?: string | null
          created_at?: string
          id?: string
          livro_id: string
          pagina?: number
          url: string
        }
        Update: {
          alt_text?: string | null
          created_at?: string
          id?: string
          livro_id?: string
          pagina?: number
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "biblioteca_imagens_livro_id_fkey"
            columns: ["livro_id"]
            isOneToOne: false
            referencedRelation: "biblioteca_livros"
            referencedColumns: ["id"]
          },
        ]
      }
      biblioteca_leitura_dinamica: {
        Row: {
          conteudo: string | null
          id: number
          pagina: number | null
          titulo_capitulo: string | null
          titulo_obra: string | null
        }
        Insert: {
          conteudo?: string | null
          id?: number
          pagina?: number | null
          titulo_capitulo?: string | null
          titulo_obra?: string | null
        }
        Update: {
          conteudo?: string | null
          id?: number
          pagina?: number | null
          titulo_capitulo?: string | null
          titulo_obra?: string | null
        }
        Relationships: []
      }
      biblioteca_lideranca: {
        Row: {
          area: string | null
          aula: string | null
          autor: string | null
          beneficios: string | null
          capa_area: string | null
          download: string | null
          id: number
          imagem: string | null
          link: string | null
          livro: string | null
          questoes_resumo: Json | null
          resumo_capitulos: Json | null
          resumo_gerado_em: string | null
          sobre: string | null
        }
        Insert: {
          area?: string | null
          aula?: string | null
          autor?: string | null
          beneficios?: string | null
          capa_area?: string | null
          download?: string | null
          id: number
          imagem?: string | null
          link?: string | null
          livro?: string | null
          questoes_resumo?: Json | null
          resumo_capitulos?: Json | null
          resumo_gerado_em?: string | null
          sobre?: string | null
        }
        Update: {
          area?: string | null
          aula?: string | null
          autor?: string | null
          beneficios?: string | null
          capa_area?: string | null
          download?: string | null
          id?: number
          imagem?: string | null
          link?: string | null
          livro?: string | null
          questoes_resumo?: Json | null
          resumo_capitulos?: Json | null
          resumo_gerado_em?: string | null
          sobre?: string | null
        }
        Relationships: []
      }
      biblioteca_livros: {
        Row: {
          autor: string | null
          capa_url: string | null
          conteudo: Json
          created_at: string
          erro_detalhe: string | null
          estrutura_leitura: Json | null
          id: string
          status: string
          tamanho_bytes: number | null
          titulo: string
          total_paginas: number
          ultima_pagina: number
          user_id: string
          versao_processamento: number
        }
        Insert: {
          autor?: string | null
          capa_url?: string | null
          conteudo?: Json
          created_at?: string
          erro_detalhe?: string | null
          estrutura_leitura?: Json | null
          id?: string
          status?: string
          tamanho_bytes?: number | null
          titulo?: string
          total_paginas?: number
          ultima_pagina?: number
          user_id: string
          versao_processamento?: number
        }
        Update: {
          autor?: string | null
          capa_url?: string | null
          conteudo?: Json
          created_at?: string
          erro_detalhe?: string | null
          estrutura_leitura?: Json | null
          id?: string
          status?: string
          tamanho_bytes?: number | null
          titulo?: string
          total_paginas?: number
          ultima_pagina?: number
          user_id?: string
          versao_processamento?: number
        }
        Relationships: []
      }
      CAGUA_CODIGO_AGUAS: {
        Row: {
          capitulo: string | null
          caput: string
          id: string
          incisos: string[] | null
          numero: string
          ordem: number
          ordem_numero: number
          paragrafos: string[] | null
          rotulo: string | null
          texto: string
          titulo: string | null
        }
        Insert: {
          capitulo?: string | null
          caput?: string
          id?: string
          incisos?: string[] | null
          numero: string
          ordem?: number
          ordem_numero?: number
          paragrafos?: string[] | null
          rotulo?: string | null
          texto?: string
          titulo?: string | null
        }
        Update: {
          capitulo?: string | null
          caput?: string
          id?: string
          incisos?: string[] | null
          numero?: string
          ordem?: number
          ordem_numero?: number
          paragrafos?: string[] | null
          rotulo?: string | null
          texto?: string
          titulo?: string | null
        }
        Relationships: []
      }
      CBA_CODIGO_BRASILEIRO_AERONAUTICA: {
        Row: {
          capitulo: string | null
          caput: string
          id: string
          incisos: string[] | null
          numero: string
          ordem: number
          ordem_numero: number
          paragrafos: string[] | null
          rotulo: string | null
          texto: string
          titulo: string | null
        }
        Insert: {
          capitulo?: string | null
          caput?: string
          id?: string
          incisos?: string[] | null
          numero: string
          ordem?: number
          ordem_numero?: number
          paragrafos?: string[] | null
          rotulo?: string | null
          texto?: string
          titulo?: string | null
        }
        Update: {
          capitulo?: string | null
          caput?: string
          id?: string
          incisos?: string[] | null
          numero?: string
          ordem?: number
          ordem_numero?: number
          paragrafos?: string[] | null
          rotulo?: string | null
          texto?: string
          titulo?: string | null
        }
        Relationships: []
      }
      CC_CODIGO_CIVIL: {
        Row: {
          capitulo: string | null
          caput: string
          id: string
          incisos: string[] | null
          numero: string
          ordem: number
          ordem_numero: number
          paragrafos: string[] | null
          rotulo: string | null
          texto: string
          titulo: string | null
        }
        Insert: {
          capitulo?: string | null
          caput?: string
          id?: string
          incisos?: string[] | null
          numero: string
          ordem?: number
          ordem_numero?: number
          paragrafos?: string[] | null
          rotulo?: string | null
          texto?: string
          titulo?: string | null
        }
        Update: {
          capitulo?: string | null
          caput?: string
          id?: string
          incisos?: string[] | null
          numero?: string
          ordem?: number
          ordem_numero?: number
          paragrafos?: string[] | null
          rotulo?: string | null
          texto?: string
          titulo?: string | null
        }
        Relationships: []
      }
      CCOM_CODIGO_COMERCIAL: {
        Row: {
          capitulo: string | null
          caput: string
          id: string
          incisos: string[] | null
          numero: string
          ordem: number
          ordem_numero: number
          paragrafos: string[] | null
          rotulo: string | null
          texto: string
          titulo: string | null
        }
        Insert: {
          capitulo?: string | null
          caput?: string
          id?: string
          incisos?: string[] | null
          numero: string
          ordem?: number
          ordem_numero?: number
          paragrafos?: string[] | null
          rotulo?: string | null
          texto?: string
          titulo?: string | null
        }
        Update: {
          capitulo?: string | null
          caput?: string
          id?: string
          incisos?: string[] | null
          numero?: string
          ordem?: number
          ordem_numero?: number
          paragrafos?: string[] | null
          rotulo?: string | null
          texto?: string
          titulo?: string | null
        }
        Relationships: []
      }
      CDC_CODIGO_DEFESA_CONSUMIDOR: {
        Row: {
          capitulo: string | null
          caput: string
          id: string
          incisos: string[] | null
          numero: string
          ordem: number
          ordem_numero: number
          paragrafos: string[] | null
          rotulo: string | null
          texto: string
          titulo: string | null
        }
        Insert: {
          capitulo?: string | null
          caput?: string
          id?: string
          incisos?: string[] | null
          numero: string
          ordem?: number
          ordem_numero?: number
          paragrafos?: string[] | null
          rotulo?: string | null
          texto?: string
          titulo?: string | null
        }
        Update: {
          capitulo?: string | null
          caput?: string
          id?: string
          incisos?: string[] | null
          numero?: string
          ordem?: number
          ordem_numero?: number
          paragrafos?: string[] | null
          rotulo?: string | null
          texto?: string
          titulo?: string | null
        }
        Relationships: []
      }
      CE_CODIGO_ELEITORAL: {
        Row: {
          capitulo: string | null
          caput: string
          id: string
          incisos: string[] | null
          numero: string
          ordem: number
          ordem_numero: number
          paragrafos: string[] | null
          rotulo: string | null
          texto: string
          titulo: string | null
        }
        Insert: {
          capitulo?: string | null
          caput?: string
          id?: string
          incisos?: string[] | null
          numero: string
          ordem?: number
          ordem_numero?: number
          paragrafos?: string[] | null
          rotulo?: string | null
          texto?: string
          titulo?: string | null
        }
        Update: {
          capitulo?: string | null
          caput?: string
          id?: string
          incisos?: string[] | null
          numero?: string
          ordem?: number
          ordem_numero?: number
          paragrafos?: string[] | null
          rotulo?: string | null
          texto?: string
          titulo?: string | null
        }
        Relationships: []
      }
      CES_CODIGO_ETICA_SERVIDOR: {
        Row: {
          capitulo: string | null
          caput: string
          id: string
          incisos: string[] | null
          numero: string
          ordem: number | null
          ordem_numero: number | null
          paragrafos: string[] | null
          rotulo: string | null
          texto: string
          titulo: string | null
        }
        Insert: {
          capitulo?: string | null
          caput?: string
          id?: string
          incisos?: string[] | null
          numero: string
          ordem?: number | null
          ordem_numero?: number | null
          paragrafos?: string[] | null
          rotulo?: string | null
          texto?: string
          titulo?: string | null
        }
        Update: {
          capitulo?: string | null
          caput?: string
          id?: string
          incisos?: string[] | null
          numero?: string
          ordem?: number | null
          ordem_numero?: number | null
          paragrafos?: string[] | null
          rotulo?: string | null
          texto?: string
          titulo?: string | null
        }
        Relationships: []
      }
      CF88_CONSTITUICAO_FEDERAL: {
        Row: {
          capitulo: string | null
          caput: string
          id: string
          incisos: string[] | null
          numero: string
          ordem: number
          ordem_numero: number
          paragrafos: string[] | null
          rotulo: string | null
          texto: string
          titulo: string | null
        }
        Insert: {
          capitulo?: string | null
          caput?: string
          id?: string
          incisos?: string[] | null
          numero: string
          ordem?: number
          ordem_numero?: number
          paragrafos?: string[] | null
          rotulo?: string | null
          texto?: string
          titulo?: string | null
        }
        Update: {
          capitulo?: string | null
          caput?: string
          id?: string
          incisos?: string[] | null
          numero?: string
          ordem?: number
          ordem_numero?: number
          paragrafos?: string[] | null
          rotulo?: string | null
          texto?: string
          titulo?: string | null
        }
        Relationships: []
      }
      CFLOR_CODIGO_FLORESTAL: {
        Row: {
          capitulo: string | null
          caput: string
          id: string
          incisos: string[] | null
          numero: string
          ordem: number
          ordem_numero: number
          paragrafos: string[] | null
          rotulo: string | null
          texto: string
          titulo: string | null
        }
        Insert: {
          capitulo?: string | null
          caput?: string
          id?: string
          incisos?: string[] | null
          numero: string
          ordem?: number
          ordem_numero?: number
          paragrafos?: string[] | null
          rotulo?: string | null
          texto?: string
          titulo?: string | null
        }
        Update: {
          capitulo?: string | null
          caput?: string
          id?: string
          incisos?: string[] | null
          numero?: string
          ordem?: number
          ordem_numero?: number
          paragrafos?: string[] | null
          rotulo?: string | null
          texto?: string
          titulo?: string | null
        }
        Relationships: []
      }
      CLT_CONSOLIDACAO_LEIS_TRABALHO: {
        Row: {
          capitulo: string | null
          caput: string
          id: string
          incisos: string[] | null
          numero: string
          ordem: number
          ordem_numero: number
          paragrafos: string[] | null
          rotulo: string | null
          texto: string
          titulo: string | null
        }
        Insert: {
          capitulo?: string | null
          caput?: string
          id?: string
          incisos?: string[] | null
          numero: string
          ordem?: number
          ordem_numero?: number
          paragrafos?: string[] | null
          rotulo?: string | null
          texto?: string
          titulo?: string | null
        }
        Update: {
          capitulo?: string | null
          caput?: string
          id?: string
          incisos?: string[] | null
          numero?: string
          ordem?: number
          ordem_numero?: number
          paragrafos?: string[] | null
          rotulo?: string | null
          texto?: string
          titulo?: string | null
        }
        Relationships: []
      }
      CMIN_CODIGO_MINAS: {
        Row: {
          capitulo: string | null
          caput: string
          id: string
          incisos: string[] | null
          numero: string
          ordem: number
          ordem_numero: number
          paragrafos: string[] | null
          rotulo: string | null
          texto: string
          titulo: string | null
        }
        Insert: {
          capitulo?: string | null
          caput?: string
          id?: string
          incisos?: string[] | null
          numero: string
          ordem?: number
          ordem_numero?: number
          paragrafos?: string[] | null
          rotulo?: string | null
          texto?: string
          titulo?: string | null
        }
        Update: {
          capitulo?: string | null
          caput?: string
          id?: string
          incisos?: string[] | null
          numero?: string
          ordem?: number
          ordem_numero?: number
          paragrafos?: string[] | null
          rotulo?: string | null
          texto?: string
          titulo?: string | null
        }
        Relationships: []
      }
      constituicoes_estaduais: {
        Row: {
          capitulo: string | null
          caput: string
          created_at: string | null
          id: string
          incisos: string[] | null
          numero: string
          ordem: number
          ordem_numero: number
          paragrafos: string[] | null
          rotulo: string | null
          texto: string
          titulo: string | null
          uf: string
        }
        Insert: {
          capitulo?: string | null
          caput?: string
          created_at?: string | null
          id?: string
          incisos?: string[] | null
          numero: string
          ordem?: number
          ordem_numero?: number
          paragrafos?: string[] | null
          rotulo?: string | null
          texto?: string
          titulo?: string | null
          uf: string
        }
        Update: {
          capitulo?: string | null
          caput?: string
          created_at?: string | null
          id?: string
          incisos?: string[] | null
          numero?: string
          ordem?: number
          ordem_numero?: number
          paragrafos?: string[] | null
          rotulo?: string | null
          texto?: string
          titulo?: string | null
          uf?: string
        }
        Relationships: []
      }
      CP_CODIGO_PENAL: {
        Row: {
          capitulo: string | null
          caput: string
          id: string
          incisos: string[] | null
          numero: string
          ordem: number
          ordem_numero: number
          paragrafos: string[] | null
          rotulo: string | null
          texto: string
          titulo: string | null
        }
        Insert: {
          capitulo?: string | null
          caput?: string
          id?: string
          incisos?: string[] | null
          numero: string
          ordem?: number
          ordem_numero?: number
          paragrafos?: string[] | null
          rotulo?: string | null
          texto?: string
          titulo?: string | null
        }
        Update: {
          capitulo?: string | null
          caput?: string
          id?: string
          incisos?: string[] | null
          numero?: string
          ordem?: number
          ordem_numero?: number
          paragrafos?: string[] | null
          rotulo?: string | null
          texto?: string
          titulo?: string | null
        }
        Relationships: []
      }
      CPC_CODIGO_PROCESSO_CIVIL: {
        Row: {
          capitulo: string | null
          caput: string
          id: string
          incisos: string[] | null
          numero: string
          ordem: number
          ordem_numero: number
          paragrafos: string[] | null
          rotulo: string | null
          texto: string
          titulo: string | null
        }
        Insert: {
          capitulo?: string | null
          caput?: string
          id?: string
          incisos?: string[] | null
          numero: string
          ordem?: number
          ordem_numero?: number
          paragrafos?: string[] | null
          rotulo?: string | null
          texto?: string
          titulo?: string | null
        }
        Update: {
          capitulo?: string | null
          caput?: string
          id?: string
          incisos?: string[] | null
          numero?: string
          ordem?: number
          ordem_numero?: number
          paragrafos?: string[] | null
          rotulo?: string | null
          texto?: string
          titulo?: string | null
        }
        Relationships: []
      }
      CPM_CODIGO_PENAL_MILITAR: {
        Row: {
          capitulo: string | null
          caput: string
          id: string
          incisos: string[] | null
          numero: string
          ordem: number
          ordem_numero: number
          paragrafos: string[] | null
          rotulo: string | null
          texto: string
          titulo: string | null
        }
        Insert: {
          capitulo?: string | null
          caput?: string
          id?: string
          incisos?: string[] | null
          numero: string
          ordem?: number
          ordem_numero?: number
          paragrafos?: string[] | null
          rotulo?: string | null
          texto?: string
          titulo?: string | null
        }
        Update: {
          capitulo?: string | null
          caput?: string
          id?: string
          incisos?: string[] | null
          numero?: string
          ordem?: number
          ordem_numero?: number
          paragrafos?: string[] | null
          rotulo?: string | null
          texto?: string
          titulo?: string | null
        }
        Relationships: []
      }
      CPP_CODIGO_PROCESSO_PENAL: {
        Row: {
          capitulo: string | null
          caput: string
          id: string
          incisos: string[] | null
          numero: string
          ordem: number
          ordem_numero: number
          paragrafos: string[] | null
          rotulo: string | null
          texto: string
          titulo: string | null
        }
        Insert: {
          capitulo?: string | null
          caput?: string
          id?: string
          incisos?: string[] | null
          numero: string
          ordem?: number
          ordem_numero?: number
          paragrafos?: string[] | null
          rotulo?: string | null
          texto?: string
          titulo?: string | null
        }
        Update: {
          capitulo?: string | null
          caput?: string
          id?: string
          incisos?: string[] | null
          numero?: string
          ordem?: number
          ordem_numero?: number
          paragrafos?: string[] | null
          rotulo?: string | null
          texto?: string
          titulo?: string | null
        }
        Relationships: []
      }
      CPPM_CODIGO_PROCESSO_PENAL_MILITAR: {
        Row: {
          capitulo: string | null
          caput: string
          id: string
          incisos: string[] | null
          numero: string
          ordem: number
          ordem_numero: number
          paragrafos: string[] | null
          rotulo: string | null
          texto: string
          titulo: string | null
        }
        Insert: {
          capitulo?: string | null
          caput?: string
          id?: string
          incisos?: string[] | null
          numero: string
          ordem?: number
          ordem_numero?: number
          paragrafos?: string[] | null
          rotulo?: string | null
          texto?: string
          titulo?: string | null
        }
        Update: {
          capitulo?: string | null
          caput?: string
          id?: string
          incisos?: string[] | null
          numero?: string
          ordem?: number
          ordem_numero?: number
          paragrafos?: string[] | null
          rotulo?: string | null
          texto?: string
          titulo?: string | null
        }
        Relationships: []
      }
      CTB_CODIGO_TRANSITO_BRASILEIRO: {
        Row: {
          capitulo: string | null
          caput: string
          id: string
          incisos: string[] | null
          numero: string
          ordem: number
          ordem_numero: number
          paragrafos: string[] | null
          rotulo: string | null
          texto: string
          titulo: string | null
        }
        Insert: {
          capitulo?: string | null
          caput?: string
          id?: string
          incisos?: string[] | null
          numero: string
          ordem?: number
          ordem_numero?: number
          paragrafos?: string[] | null
          rotulo?: string | null
          texto?: string
          titulo?: string | null
        }
        Update: {
          capitulo?: string | null
          caput?: string
          id?: string
          incisos?: string[] | null
          numero?: string
          ordem?: number
          ordem_numero?: number
          paragrafos?: string[] | null
          rotulo?: string | null
          texto?: string
          titulo?: string | null
        }
        Relationships: []
      }
      CTEL_CODIGO_TELECOMUNICACOES: {
        Row: {
          capitulo: string | null
          caput: string
          id: string
          incisos: string[] | null
          numero: string
          ordem: number
          ordem_numero: number
          paragrafos: string[] | null
          rotulo: string | null
          texto: string
          titulo: string | null
        }
        Insert: {
          capitulo?: string | null
          caput?: string
          id?: string
          incisos?: string[] | null
          numero: string
          ordem?: number
          ordem_numero?: number
          paragrafos?: string[] | null
          rotulo?: string | null
          texto?: string
          titulo?: string | null
        }
        Update: {
          capitulo?: string | null
          caput?: string
          id?: string
          incisos?: string[] | null
          numero?: string
          ordem?: number
          ordem_numero?: number
          paragrafos?: string[] | null
          rotulo?: string | null
          texto?: string
          titulo?: string | null
        }
        Relationships: []
      }
      CTN_CODIGO_TRIBUTARIO_NACIONAL: {
        Row: {
          capitulo: string | null
          caput: string
          id: string
          incisos: string[] | null
          numero: string
          ordem: number
          ordem_numero: number
          paragrafos: string[] | null
          rotulo: string | null
          texto: string
          titulo: string | null
        }
        Insert: {
          capitulo?: string | null
          caput?: string
          id?: string
          incisos?: string[] | null
          numero: string
          ordem?: number
          ordem_numero?: number
          paragrafos?: string[] | null
          rotulo?: string | null
          texto?: string
          titulo?: string | null
        }
        Update: {
          capitulo?: string | null
          caput?: string
          id?: string
          incisos?: string[] | null
          numero?: string
          ordem?: number
          ordem_numero?: number
          paragrafos?: string[] | null
          rotulo?: string | null
          texto?: string
          titulo?: string | null
        }
        Relationships: []
      }
      decretos: {
        Row: {
          ano: number
          data_publicacao: string | null
          ementa: string
          id: string
          numero_lei: string
          ordem: number
          texto_completo: string | null
          url: string | null
        }
        Insert: {
          ano: number
          data_publicacao?: string | null
          ementa?: string
          id?: string
          numero_lei: string
          ordem?: number
          texto_completo?: string | null
          url?: string | null
        }
        Update: {
          ano?: number
          data_publicacao?: string | null
          ementa?: string
          id?: string
          numero_lei?: string
          ordem?: number
          texto_completo?: string | null
          url?: string | null
        }
        Relationships: []
      }
      EC_ESTATUTO_CIDADE: {
        Row: {
          capitulo: string | null
          caput: string
          id: string
          incisos: string[] | null
          numero: string
          ordem: number
          ordem_numero: number
          paragrafos: string[] | null
          rotulo: string | null
          texto: string
          titulo: string | null
        }
        Insert: {
          capitulo?: string | null
          caput?: string
          id?: string
          incisos?: string[] | null
          numero: string
          ordem?: number
          ordem_numero?: number
          paragrafos?: string[] | null
          rotulo?: string | null
          texto?: string
          titulo?: string | null
        }
        Update: {
          capitulo?: string | null
          caput?: string
          id?: string
          incisos?: string[] | null
          numero?: string
          ordem?: number
          ordem_numero?: number
          paragrafos?: string[] | null
          rotulo?: string | null
          texto?: string
          titulo?: string | null
        }
        Relationships: []
      }
      ECA_ESTATUTO_CRIANCA_ADOLESCENTE: {
        Row: {
          capitulo: string | null
          caput: string
          id: string
          incisos: string[] | null
          numero: string
          ordem: number
          ordem_numero: number
          paragrafos: string[] | null
          rotulo: string | null
          texto: string
          titulo: string | null
        }
        Insert: {
          capitulo?: string | null
          caput?: string
          id?: string
          incisos?: string[] | null
          numero: string
          ordem?: number
          ordem_numero?: number
          paragrafos?: string[] | null
          rotulo?: string | null
          texto?: string
          titulo?: string | null
        }
        Update: {
          capitulo?: string | null
          caput?: string
          id?: string
          incisos?: string[] | null
          numero?: string
          ordem?: number
          ordem_numero?: number
          paragrafos?: string[] | null
          rotulo?: string | null
          texto?: string
          titulo?: string | null
        }
        Relationships: []
      }
      ED_ESTATUTO_DESARMAMENTO: {
        Row: {
          capitulo: string | null
          caput: string
          id: string
          incisos: string[] | null
          numero: string
          ordem: number
          ordem_numero: number
          paragrafos: string[] | null
          rotulo: string | null
          texto: string
          titulo: string | null
        }
        Insert: {
          capitulo?: string | null
          caput?: string
          id?: string
          incisos?: string[] | null
          numero: string
          ordem?: number
          ordem_numero?: number
          paragrafos?: string[] | null
          rotulo?: string | null
          texto?: string
          titulo?: string | null
        }
        Update: {
          capitulo?: string | null
          caput?: string
          id?: string
          incisos?: string[] | null
          numero?: string
          ordem?: number
          ordem_numero?: number
          paragrafos?: string[] | null
          rotulo?: string | null
          texto?: string
          titulo?: string | null
        }
        Relationships: []
      }
      EI_ESTATUTO_IDOSO: {
        Row: {
          capitulo: string | null
          caput: string
          id: string
          incisos: string[] | null
          numero: string
          ordem: number
          ordem_numero: number
          paragrafos: string[] | null
          rotulo: string | null
          texto: string
          titulo: string | null
        }
        Insert: {
          capitulo?: string | null
          caput?: string
          id?: string
          incisos?: string[] | null
          numero: string
          ordem?: number
          ordem_numero?: number
          paragrafos?: string[] | null
          rotulo?: string | null
          texto?: string
          titulo?: string | null
        }
        Update: {
          capitulo?: string | null
          caput?: string
          id?: string
          incisos?: string[] | null
          numero?: string
          ordem?: number
          ordem_numero?: number
          paragrafos?: string[] | null
          rotulo?: string | null
          texto?: string
          titulo?: string | null
        }
        Relationships: []
      }
      EIND_ESTATUTO_INDIO: {
        Row: {
          capitulo: string | null
          caput: string
          id: string
          incisos: string[] | null
          numero: string
          ordem: number
          ordem_numero: number
          paragrafos: string[] | null
          rotulo: string | null
          texto: string
          titulo: string | null
        }
        Insert: {
          capitulo?: string | null
          caput?: string
          id?: string
          incisos?: string[] | null
          numero: string
          ordem?: number
          ordem_numero?: number
          paragrafos?: string[] | null
          rotulo?: string | null
          texto?: string
          titulo?: string | null
        }
        Update: {
          capitulo?: string | null
          caput?: string
          id?: string
          incisos?: string[] | null
          numero?: string
          ordem?: number
          ordem_numero?: number
          paragrafos?: string[] | null
          rotulo?: string | null
          texto?: string
          titulo?: string | null
        }
        Relationships: []
      }
      EIR_ESTATUTO_IGUALDADE_RACIAL: {
        Row: {
          capitulo: string | null
          caput: string
          id: string
          incisos: string[] | null
          numero: string
          ordem: number
          ordem_numero: number
          paragrafos: string[] | null
          rotulo: string | null
          texto: string
          titulo: string | null
        }
        Insert: {
          capitulo?: string | null
          caput?: string
          id?: string
          incisos?: string[] | null
          numero: string
          ordem?: number
          ordem_numero?: number
          paragrafos?: string[] | null
          rotulo?: string | null
          texto?: string
          titulo?: string | null
        }
        Update: {
          capitulo?: string | null
          caput?: string
          id?: string
          incisos?: string[] | null
          numero?: string
          ordem?: number
          ordem_numero?: number
          paragrafos?: string[] | null
          rotulo?: string | null
          texto?: string
          titulo?: string | null
        }
        Relationships: []
      }
      EJ_ESTATUTO_JUVENTUDE: {
        Row: {
          capitulo: string | null
          caput: string
          id: string
          incisos: string[] | null
          numero: string
          ordem: number
          ordem_numero: number
          paragrafos: string[] | null
          rotulo: string | null
          texto: string
          titulo: string | null
        }
        Insert: {
          capitulo?: string | null
          caput?: string
          id?: string
          incisos?: string[] | null
          numero: string
          ordem?: number
          ordem_numero?: number
          paragrafos?: string[] | null
          rotulo?: string | null
          texto?: string
          titulo?: string | null
        }
        Update: {
          capitulo?: string | null
          caput?: string
          id?: string
          incisos?: string[] | null
          numero?: string
          ordem?: number
          ordem_numero?: number
          paragrafos?: string[] | null
          rotulo?: string | null
          texto?: string
          titulo?: string | null
        }
        Relationships: []
      }
      EM_ESTATUTO_MILITARES: {
        Row: {
          capitulo: string | null
          caput: string
          id: string
          incisos: string[] | null
          numero: string
          ordem: number
          ordem_numero: number
          paragrafos: string[] | null
          rotulo: string | null
          texto: string
          titulo: string | null
        }
        Insert: {
          capitulo?: string | null
          caput?: string
          id?: string
          incisos?: string[] | null
          numero: string
          ordem?: number
          ordem_numero?: number
          paragrafos?: string[] | null
          rotulo?: string | null
          texto?: string
          titulo?: string | null
        }
        Update: {
          capitulo?: string | null
          caput?: string
          id?: string
          incisos?: string[] | null
          numero?: string
          ordem?: number
          ordem_numero?: number
          paragrafos?: string[] | null
          rotulo?: string | null
          texto?: string
          titulo?: string | null
        }
        Relationships: []
      }
      EME_ESTATUTO_MICROEMPRESA: {
        Row: {
          capitulo: string | null
          caput: string
          id: string
          incisos: string[] | null
          numero: string
          ordem: number
          ordem_numero: number
          paragrafos: string[] | null
          rotulo: string | null
          texto: string
          titulo: string | null
        }
        Insert: {
          capitulo?: string | null
          caput?: string
          id?: string
          incisos?: string[] | null
          numero: string
          ordem?: number
          ordem_numero?: number
          paragrafos?: string[] | null
          rotulo?: string | null
          texto?: string
          titulo?: string | null
        }
        Update: {
          capitulo?: string | null
          caput?: string
          id?: string
          incisos?: string[] | null
          numero?: string
          ordem?: number
          ordem_numero?: number
          paragrafos?: string[] | null
          rotulo?: string | null
          texto?: string
          titulo?: string | null
        }
        Relationships: []
      }
      EMET_ESTATUTO_METROPOLE: {
        Row: {
          capitulo: string | null
          caput: string
          id: string
          incisos: string[] | null
          numero: string
          ordem: number
          ordem_numero: number
          paragrafos: string[] | null
          rotulo: string | null
          texto: string
          titulo: string | null
        }
        Insert: {
          capitulo?: string | null
          caput?: string
          id?: string
          incisos?: string[] | null
          numero: string
          ordem?: number
          ordem_numero?: number
          paragrafos?: string[] | null
          rotulo?: string | null
          texto?: string
          titulo?: string | null
        }
        Update: {
          capitulo?: string | null
          caput?: string
          id?: string
          incisos?: string[] | null
          numero?: string
          ordem?: number
          ordem_numero?: number
          paragrafos?: string[] | null
          rotulo?: string | null
          texto?: string
          titulo?: string | null
        }
        Relationships: []
      }
      EMIG_ESTATUTO_MIGRACAO: {
        Row: {
          capitulo: string | null
          caput: string
          id: string
          incisos: string[] | null
          numero: string
          ordem: number
          ordem_numero: number
          paragrafos: string[] | null
          rotulo: string | null
          texto: string
          titulo: string | null
        }
        Insert: {
          capitulo?: string | null
          caput?: string
          id?: string
          incisos?: string[] | null
          numero: string
          ordem?: number
          ordem_numero?: number
          paragrafos?: string[] | null
          rotulo?: string | null
          texto?: string
          titulo?: string | null
        }
        Update: {
          capitulo?: string | null
          caput?: string
          id?: string
          incisos?: string[] | null
          numero?: string
          ordem?: number
          ordem_numero?: number
          paragrafos?: string[] | null
          rotulo?: string | null
          texto?: string
          titulo?: string | null
        }
        Relationships: []
      }
      EMUS_ESTATUTO_MUSEUS: {
        Row: {
          capitulo: string | null
          caput: string
          id: string
          incisos: string[] | null
          numero: string
          ordem: number
          ordem_numero: number
          paragrafos: string[] | null
          rotulo: string | null
          texto: string
          titulo: string | null
        }
        Insert: {
          capitulo?: string | null
          caput?: string
          id?: string
          incisos?: string[] | null
          numero: string
          ordem?: number
          ordem_numero?: number
          paragrafos?: string[] | null
          rotulo?: string | null
          texto?: string
          titulo?: string | null
        }
        Update: {
          capitulo?: string | null
          caput?: string
          id?: string
          incisos?: string[] | null
          numero?: string
          ordem?: number
          ordem_numero?: number
          paragrafos?: string[] | null
          rotulo?: string | null
          texto?: string
          titulo?: string | null
        }
        Relationships: []
      }
      EOAB_ESTATUTO_OAB: {
        Row: {
          capitulo: string | null
          caput: string
          id: string
          incisos: string[] | null
          numero: string
          ordem: number
          ordem_numero: number
          paragrafos: string[] | null
          rotulo: string | null
          texto: string
          titulo: string | null
        }
        Insert: {
          capitulo?: string | null
          caput?: string
          id?: string
          incisos?: string[] | null
          numero: string
          ordem?: number
          ordem_numero?: number
          paragrafos?: string[] | null
          rotulo?: string | null
          texto?: string
          titulo?: string | null
        }
        Update: {
          capitulo?: string | null
          caput?: string
          id?: string
          incisos?: string[] | null
          numero?: string
          ordem?: number
          ordem_numero?: number
          paragrafos?: string[] | null
          rotulo?: string | null
          texto?: string
          titulo?: string | null
        }
        Relationships: []
      }
      EPC_ESTATUTO_PESSOA_CANCER: {
        Row: {
          capitulo: string | null
          caput: string
          id: string
          incisos: string[] | null
          numero: string
          ordem: number
          ordem_numero: number
          paragrafos: string[] | null
          rotulo: string | null
          texto: string
          titulo: string | null
        }
        Insert: {
          capitulo?: string | null
          caput?: string
          id?: string
          incisos?: string[] | null
          numero: string
          ordem?: number
          ordem_numero?: number
          paragrafos?: string[] | null
          rotulo?: string | null
          texto?: string
          titulo?: string | null
        }
        Update: {
          capitulo?: string | null
          caput?: string
          id?: string
          incisos?: string[] | null
          numero?: string
          ordem?: number
          ordem_numero?: number
          paragrafos?: string[] | null
          rotulo?: string | null
          texto?: string
          titulo?: string | null
        }
        Relationships: []
      }
      EPD_ESTATUTO_PESSOA_DEFICIENCIA: {
        Row: {
          capitulo: string | null
          caput: string
          id: string
          incisos: string[] | null
          numero: string
          ordem: number
          ordem_numero: number
          paragrafos: string[] | null
          rotulo: string | null
          texto: string
          titulo: string | null
        }
        Insert: {
          capitulo?: string | null
          caput?: string
          id?: string
          incisos?: string[] | null
          numero: string
          ordem?: number
          ordem_numero?: number
          paragrafos?: string[] | null
          rotulo?: string | null
          texto?: string
          titulo?: string | null
        }
        Update: {
          capitulo?: string | null
          caput?: string
          id?: string
          incisos?: string[] | null
          numero?: string
          ordem?: number
          ordem_numero?: number
          paragrafos?: string[] | null
          rotulo?: string | null
          texto?: string
          titulo?: string | null
        }
        Relationships: []
      }
      EREF_ESTATUTO_REFUGIADO: {
        Row: {
          capitulo: string | null
          caput: string
          id: string
          incisos: string[] | null
          numero: string
          ordem: number
          ordem_numero: number
          paragrafos: string[] | null
          rotulo: string | null
          texto: string
          titulo: string | null
        }
        Insert: {
          capitulo?: string | null
          caput?: string
          id?: string
          incisos?: string[] | null
          numero: string
          ordem?: number
          ordem_numero?: number
          paragrafos?: string[] | null
          rotulo?: string | null
          texto?: string
          titulo?: string | null
        }
        Update: {
          capitulo?: string | null
          caput?: string
          id?: string
          incisos?: string[] | null
          numero?: string
          ordem?: number
          ordem_numero?: number
          paragrafos?: string[] | null
          rotulo?: string | null
          texto?: string
          titulo?: string | null
        }
        Relationships: []
      }
      ET_ESTATUTO_TORCEDOR: {
        Row: {
          capitulo: string | null
          caput: string
          id: string
          incisos: string[] | null
          numero: string
          ordem: number
          ordem_numero: number
          paragrafos: string[] | null
          rotulo: string | null
          texto: string
          titulo: string | null
        }
        Insert: {
          capitulo?: string | null
          caput?: string
          id?: string
          incisos?: string[] | null
          numero: string
          ordem?: number
          ordem_numero?: number
          paragrafos?: string[] | null
          rotulo?: string | null
          texto?: string
          titulo?: string | null
        }
        Update: {
          capitulo?: string | null
          caput?: string
          id?: string
          incisos?: string[] | null
          numero?: string
          ordem?: number
          ordem_numero?: number
          paragrafos?: string[] | null
          rotulo?: string | null
          texto?: string
          titulo?: string | null
        }
        Relationships: []
      }
      ETERRA_ESTATUTO_TERRA: {
        Row: {
          capitulo: string | null
          caput: string
          id: string
          incisos: string[] | null
          numero: string
          ordem: number
          ordem_numero: number
          paragrafos: string[] | null
          rotulo: string | null
          texto: string
          titulo: string | null
        }
        Insert: {
          capitulo?: string | null
          caput?: string
          id?: string
          incisos?: string[] | null
          numero: string
          ordem?: number
          ordem_numero?: number
          paragrafos?: string[] | null
          rotulo?: string | null
          texto?: string
          titulo?: string | null
        }
        Update: {
          capitulo?: string | null
          caput?: string
          id?: string
          incisos?: string[] | null
          numero?: string
          ordem?: number
          ordem_numero?: number
          paragrafos?: string[] | null
          rotulo?: string | null
          texto?: string
          titulo?: string | null
        }
        Relationships: []
      }
      ext_atualizacao_biblioteca: {
        Row: {
          ativo: boolean | null
          autor: string
          biblioteca: string
          capa_url: string | null
          created_at: string | null
          id: number
          nome_livro: string
          vezes: number | null
        }
        Insert: {
          ativo?: boolean | null
          autor: string
          biblioteca: string
          capa_url?: string | null
          created_at?: string | null
          id?: number
          nome_livro: string
          vezes?: number | null
        }
        Update: {
          ativo?: boolean | null
          autor?: string
          biblioteca?: string
          capa_url?: string | null
          created_at?: string | null
          id?: number
          nome_livro?: string
          vezes?: number | null
        }
        Relationships: []
      }
      ext_biblioteca_classicos_paginas: {
        Row: {
          conteudo: string | null
          created_at: string | null
          id: string
          livro_id: number
          pagina: number
        }
        Insert: {
          conteudo?: string | null
          created_at?: string | null
          id?: string
          livro_id: number
          pagina: number
        }
        Update: {
          conteudo?: string | null
          created_at?: string | null
          id?: string
          livro_id?: number
          pagina?: number
        }
        Relationships: []
      }
      ext_biblioteca_classicos_temas: {
        Row: {
          audio_url: string | null
          capa_url: string | null
          conteudo_markdown: string | null
          correspondencias: Json | null
          created_at: string | null
          id: string
          livro_id: number
          titulo_tema: string | null
        }
        Insert: {
          audio_url?: string | null
          capa_url?: string | null
          conteudo_markdown?: string | null
          correspondencias?: Json | null
          created_at?: string | null
          id?: string
          livro_id: number
          titulo_tema?: string | null
        }
        Update: {
          audio_url?: string | null
          capa_url?: string | null
          conteudo_markdown?: string | null
          correspondencias?: Json | null
          created_at?: string | null
          id?: string
          livro_id?: number
          titulo_tema?: string | null
        }
        Relationships: []
      }
      geracao_global: {
        Row: {
          cooldown_until: string | null
          created_at: string | null
          current_artigo: string | null
          current_modo: string | null
          current_tabela: string | null
          cursor_modo_idx: number
          cursor_tabela_idx: number
          id: string
          last_error: string | null
          last_success_at: string | null
          modos: string[]
          retry_count: number
          started_at: string | null
          status: string
          total_erros: number
          total_pendentes: number
          total_processadas: number
          updated_at: string | null
        }
        Insert: {
          cooldown_until?: string | null
          created_at?: string | null
          current_artigo?: string | null
          current_modo?: string | null
          current_tabela?: string | null
          cursor_modo_idx?: number
          cursor_tabela_idx?: number
          id?: string
          last_error?: string | null
          last_success_at?: string | null
          modos?: string[]
          retry_count?: number
          started_at?: string | null
          status?: string
          total_erros?: number
          total_pendentes?: number
          total_processadas?: number
          updated_at?: string | null
        }
        Update: {
          cooldown_until?: string | null
          created_at?: string | null
          current_artigo?: string | null
          current_modo?: string | null
          current_tabela?: string | null
          cursor_modo_idx?: number
          cursor_tabela_idx?: number
          id?: string
          last_error?: string | null
          last_success_at?: string | null
          modos?: string[]
          retry_count?: number
          started_at?: string | null
          status?: string
          total_erros?: number
          total_pendentes?: number
          total_processadas?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      instagram_posts: {
        Row: {
          created_at: string
          descricao: string
          hashtags: string[] | null
          headline: string
          id: string
          imagem_url: string | null
          titulo_artigo: string
          updated_at: string
          url_artigo: string
          user_id: string
        }
        Insert: {
          created_at?: string
          descricao?: string
          hashtags?: string[] | null
          headline?: string
          id?: string
          imagem_url?: string | null
          titulo_artigo?: string
          updated_at?: string
          url_artigo: string
          user_id: string
        }
        Update: {
          created_at?: string
          descricao?: string
          hashtags?: string[] | null
          headline?: string
          id?: string
          imagem_url?: string | null
          titulo_artigo?: string
          updated_at?: string
          url_artigo?: string
          user_id?: string
        }
        Relationships: []
      }
      kanban_proposicoes: {
        Row: {
          ano: number
          atualizado_em: string | null
          autor: string | null
          dados_json: Json | null
          data_publicacao: string | null
          data_ultima_acao: string | null
          data_votacao: string | null
          ementa: string | null
          id: string
          id_externo: string
          lei_afetada: string | null
          numero: number
          numero_lei_publicada: string | null
          resultado_votacao: string | null
          sigla_tipo: string
          situacao_camara: string | null
          status_kanban: string
        }
        Insert: {
          ano: number
          atualizado_em?: string | null
          autor?: string | null
          dados_json?: Json | null
          data_publicacao?: string | null
          data_ultima_acao?: string | null
          data_votacao?: string | null
          ementa?: string | null
          id?: string
          id_externo: string
          lei_afetada?: string | null
          numero: number
          numero_lei_publicada?: string | null
          resultado_votacao?: string | null
          sigla_tipo: string
          situacao_camara?: string | null
          status_kanban?: string
        }
        Update: {
          ano?: number
          atualizado_em?: string | null
          autor?: string | null
          dados_json?: Json | null
          data_publicacao?: string | null
          data_ultima_acao?: string | null
          data_votacao?: string | null
          ementa?: string | null
          id?: string
          id_externo?: string
          lei_afetada?: string | null
          numero?: number
          numero_lei_publicada?: string | null
          resultado_votacao?: string | null
          sigla_tipo?: string
          situacao_camara?: string | null
          status_kanban?: string
        }
        Relationships: []
      }
      L8112_SERVIDORES_FEDERAIS: {
        Row: {
          capitulo: string | null
          caput: string
          id: string
          incisos: string[] | null
          numero: string
          ordem: number
          ordem_numero: number
          paragrafos: string[] | null
          rotulo: string | null
          texto: string
          titulo: string | null
        }
        Insert: {
          capitulo?: string | null
          caput?: string
          id?: string
          incisos?: string[] | null
          numero: string
          ordem?: number
          ordem_numero?: number
          paragrafos?: string[] | null
          rotulo?: string | null
          texto?: string
          titulo?: string | null
        }
        Update: {
          capitulo?: string | null
          caput?: string
          id?: string
          incisos?: string[] | null
          numero?: string
          ordem?: number
          ordem_numero?: number
          paragrafos?: string[] | null
          rotulo?: string | null
          texto?: string
          titulo?: string | null
        }
        Relationships: []
      }
      LA_ARBITRAGEM: {
        Row: {
          capitulo: string | null
          caput: string
          id: string
          incisos: string[] | null
          numero: string
          ordem: number
          ordem_numero: number
          paragrafos: string[] | null
          rotulo: string | null
          texto: string
          titulo: string | null
        }
        Insert: {
          capitulo?: string | null
          caput?: string
          id?: string
          incisos?: string[] | null
          numero: string
          ordem?: number
          ordem_numero?: number
          paragrafos?: string[] | null
          rotulo?: string | null
          texto?: string
          titulo?: string | null
        }
        Update: {
          capitulo?: string | null
          caput?: string
          id?: string
          incisos?: string[] | null
          numero?: string
          ordem?: number
          ordem_numero?: number
          paragrafos?: string[] | null
          rotulo?: string | null
          texto?: string
          titulo?: string | null
        }
        Relationships: []
      }
      LAA_ABUSO_AUTORIDADE: {
        Row: {
          capitulo: string | null
          caput: string
          id: string
          incisos: string[] | null
          numero: string
          ordem: number
          ordem_numero: number
          paragrafos: string[] | null
          rotulo: string | null
          texto: string
          titulo: string | null
        }
        Insert: {
          capitulo?: string | null
          caput?: string
          id?: string
          incisos?: string[] | null
          numero: string
          ordem?: number
          ordem_numero?: number
          paragrafos?: string[] | null
          rotulo?: string | null
          texto?: string
          titulo?: string | null
        }
        Update: {
          capitulo?: string | null
          caput?: string
          id?: string
          incisos?: string[] | null
          numero?: string
          ordem?: number
          ordem_numero?: number
          paragrafos?: string[] | null
          rotulo?: string | null
          texto?: string
          titulo?: string | null
        }
        Relationships: []
      }
      LACE_ANTICORRUPCAO: {
        Row: {
          capitulo: string | null
          caput: string
          id: string
          incisos: string[] | null
          numero: string
          ordem: number | null
          ordem_numero: number | null
          paragrafos: string[] | null
          rotulo: string | null
          texto: string
          titulo: string | null
        }
        Insert: {
          capitulo?: string | null
          caput?: string
          id?: string
          incisos?: string[] | null
          numero: string
          ordem?: number | null
          ordem_numero?: number | null
          paragrafos?: string[] | null
          rotulo?: string | null
          texto?: string
          titulo?: string | null
        }
        Update: {
          capitulo?: string | null
          caput?: string
          id?: string
          incisos?: string[] | null
          numero?: string
          ordem?: number | null
          ordem_numero?: number | null
          paragrafos?: string[] | null
          rotulo?: string | null
          texto?: string
          titulo?: string | null
        }
        Relationships: []
      }
      LACP_ACAO_CIVIL_PUBLICA: {
        Row: {
          capitulo: string | null
          caput: string
          id: string
          incisos: string[] | null
          numero: string
          ordem: number
          ordem_numero: number
          paragrafos: string[] | null
          rotulo: string | null
          texto: string
          titulo: string | null
        }
        Insert: {
          capitulo?: string | null
          caput?: string
          id?: string
          incisos?: string[] | null
          numero: string
          ordem?: number
          ordem_numero?: number
          paragrafos?: string[] | null
          rotulo?: string | null
          texto?: string
          titulo?: string | null
        }
        Update: {
          capitulo?: string | null
          caput?: string
          id?: string
          incisos?: string[] | null
          numero?: string
          ordem?: number
          ordem_numero?: number
          paragrafos?: string[] | null
          rotulo?: string | null
          texto?: string
          titulo?: string | null
        }
        Relationships: []
      }
      LAI_ACESSO_INFORMACAO: {
        Row: {
          capitulo: string | null
          caput: string
          id: string
          incisos: string[] | null
          numero: string
          ordem: number | null
          ordem_numero: number | null
          paragrafos: string[] | null
          rotulo: string | null
          texto: string
          titulo: string | null
        }
        Insert: {
          capitulo?: string | null
          caput?: string
          id?: string
          incisos?: string[] | null
          numero: string
          ordem?: number | null
          ordem_numero?: number | null
          paragrafos?: string[] | null
          rotulo?: string | null
          texto?: string
          titulo?: string | null
        }
        Update: {
          capitulo?: string | null
          caput?: string
          id?: string
          incisos?: string[] | null
          numero?: string
          ordem?: number | null
          ordem_numero?: number | null
          paragrafos?: string[] | null
          rotulo?: string | null
          texto?: string
          titulo?: string | null
        }
        Relationships: []
      }
      LALIM_ALIMENTOS: {
        Row: {
          capitulo: string | null
          caput: string
          id: string
          incisos: string[] | null
          numero: string
          ordem: number | null
          ordem_numero: number | null
          paragrafos: string[] | null
          rotulo: string | null
          texto: string
          titulo: string | null
        }
        Insert: {
          capitulo?: string | null
          caput?: string
          id?: string
          incisos?: string[] | null
          numero: string
          ordem?: number | null
          ordem_numero?: number | null
          paragrafos?: string[] | null
          rotulo?: string | null
          texto?: string
          titulo?: string | null
        }
        Update: {
          capitulo?: string | null
          caput?: string
          id?: string
          incisos?: string[] | null
          numero?: string
          ordem?: number | null
          ordem_numero?: number | null
          paragrafos?: string[] | null
          rotulo?: string | null
          texto?: string
          titulo?: string | null
        }
        Relationships: []
      }
      LALP_ALIENACAO_PARENTAL: {
        Row: {
          capitulo: string | null
          caput: string
          id: string
          incisos: string[] | null
          numero: string
          ordem: number | null
          ordem_numero: number | null
          paragrafos: string[] | null
          rotulo: string | null
          texto: string
          titulo: string | null
        }
        Insert: {
          capitulo?: string | null
          caput?: string
          id?: string
          incisos?: string[] | null
          numero: string
          ordem?: number | null
          ordem_numero?: number | null
          paragrafos?: string[] | null
          rotulo?: string | null
          texto?: string
          titulo?: string | null
        }
        Update: {
          capitulo?: string | null
          caput?: string
          id?: string
          incisos?: string[] | null
          numero?: string
          ordem?: number | null
          ordem_numero?: number | null
          paragrafos?: string[] | null
          rotulo?: string | null
          texto?: string
          titulo?: string | null
        }
        Relationships: []
      }
      LAP_ACAO_POPULAR: {
        Row: {
          capitulo: string | null
          caput: string
          id: string
          incisos: string[] | null
          numero: string
          ordem: number | null
          ordem_numero: number | null
          paragrafos: string[] | null
          rotulo: string | null
          texto: string
          titulo: string | null
        }
        Insert: {
          capitulo?: string | null
          caput?: string
          id?: string
          incisos?: string[] | null
          numero: string
          ordem?: number | null
          ordem_numero?: number | null
          paragrafos?: string[] | null
          rotulo?: string | null
          texto?: string
          titulo?: string | null
        }
        Update: {
          capitulo?: string | null
          caput?: string
          id?: string
          incisos?: string[] | null
          numero?: string
          ordem?: number | null
          ordem_numero?: number | null
          paragrafos?: string[] | null
          rotulo?: string | null
          texto?: string
          titulo?: string | null
        }
        Relationships: []
      }
      LAT_ANTITERRORISMO: {
        Row: {
          capitulo: string | null
          caput: string
          id: string
          incisos: string[] | null
          numero: string
          ordem: number
          ordem_numero: number
          paragrafos: string[] | null
          rotulo: string | null
          texto: string
          titulo: string | null
        }
        Insert: {
          capitulo?: string | null
          caput?: string
          id?: string
          incisos?: string[] | null
          numero: string
          ordem?: number
          ordem_numero?: number
          paragrafos?: string[] | null
          rotulo?: string | null
          texto?: string
          titulo?: string | null
        }
        Update: {
          capitulo?: string | null
          caput?: string
          id?: string
          incisos?: string[] | null
          numero?: string
          ordem?: number
          ordem_numero?: number
          paragrafos?: string[] | null
          rotulo?: string | null
          texto?: string
          titulo?: string | null
        }
        Relationships: []
      }
      LBIO_BIOSSEGURANCA: {
        Row: {
          capitulo: string | null
          caput: string
          id: string
          incisos: string[] | null
          numero: string
          ordem: number | null
          ordem_numero: number | null
          paragrafos: string[] | null
          rotulo: string | null
          texto: string
          titulo: string | null
        }
        Insert: {
          capitulo?: string | null
          caput?: string
          id?: string
          incisos?: string[] | null
          numero: string
          ordem?: number | null
          ordem_numero?: number | null
          paragrafos?: string[] | null
          rotulo?: string | null
          texto?: string
          titulo?: string | null
        }
        Update: {
          capitulo?: string | null
          caput?: string
          id?: string
          incisos?: string[] | null
          numero?: string
          ordem?: number | null
          ordem_numero?: number | null
          paragrafos?: string[] | null
          rotulo?: string | null
          texto?: string
          titulo?: string | null
        }
        Relationships: []
      }
      LBPS_BENEFICIOS_PREVIDENCIA: {
        Row: {
          capitulo: string | null
          caput: string
          id: string
          incisos: string[] | null
          numero: string
          ordem: number
          ordem_numero: number
          paragrafos: string[] | null
          rotulo: string | null
          texto: string
          titulo: string | null
        }
        Insert: {
          capitulo?: string | null
          caput?: string
          id?: string
          incisos?: string[] | null
          numero: string
          ordem?: number
          ordem_numero?: number
          paragrafos?: string[] | null
          rotulo?: string | null
          texto?: string
          titulo?: string | null
        }
        Update: {
          capitulo?: string | null
          caput?: string
          id?: string
          incisos?: string[] | null
          numero?: string
          ordem?: number
          ordem_numero?: number
          paragrafos?: string[] | null
          rotulo?: string | null
          texto?: string
          titulo?: string | null
        }
        Relationships: []
      }
      LCA_CRIMES_AMBIENTAIS: {
        Row: {
          capitulo: string | null
          caput: string
          id: string
          incisos: string[] | null
          numero: string
          ordem: number | null
          ordem_numero: number | null
          paragrafos: string[] | null
          rotulo: string | null
          texto: string
          titulo: string | null
        }
        Insert: {
          capitulo?: string | null
          caput?: string
          id?: string
          incisos?: string[] | null
          numero: string
          ordem?: number | null
          ordem_numero?: number | null
          paragrafos?: string[] | null
          rotulo?: string | null
          texto?: string
          titulo?: string | null
        }
        Update: {
          capitulo?: string | null
          caput?: string
          id?: string
          incisos?: string[] | null
          numero?: string
          ordem?: number | null
          ordem_numero?: number | null
          paragrafos?: string[] | null
          rotulo?: string | null
          texto?: string
          titulo?: string | null
        }
        Relationships: []
      }
      LCADE_ANTITRUSTE: {
        Row: {
          capitulo: string | null
          caput: string
          id: string
          incisos: string[] | null
          numero: string
          ordem: number | null
          ordem_numero: number | null
          paragrafos: string[] | null
          rotulo: string | null
          texto: string
          titulo: string | null
        }
        Insert: {
          capitulo?: string | null
          caput?: string
          id?: string
          incisos?: string[] | null
          numero: string
          ordem?: number | null
          ordem_numero?: number | null
          paragrafos?: string[] | null
          rotulo?: string | null
          texto?: string
          titulo?: string | null
        }
        Update: {
          capitulo?: string | null
          caput?: string
          id?: string
          incisos?: string[] | null
          numero?: string
          ordem?: number | null
          ordem_numero?: number | null
          paragrafos?: string[] | null
          rotulo?: string | null
          texto?: string
          titulo?: string | null
        }
        Relationships: []
      }
      LCH_CRIMES_HEDIONDOS: {
        Row: {
          capitulo: string | null
          caput: string
          id: string
          incisos: string[] | null
          numero: string
          ordem: number | null
          ordem_numero: number | null
          paragrafos: string[] | null
          rotulo: string | null
          texto: string
          titulo: string | null
        }
        Insert: {
          capitulo?: string | null
          caput?: string
          id?: string
          incisos?: string[] | null
          numero: string
          ordem?: number | null
          ordem_numero?: number | null
          paragrafos?: string[] | null
          rotulo?: string | null
          texto?: string
          titulo?: string | null
        }
        Update: {
          capitulo?: string | null
          caput?: string
          id?: string
          incisos?: string[] | null
          numero?: string
          ordem?: number | null
          ordem_numero?: number | null
          paragrafos?: string[] | null
          rotulo?: string | null
          texto?: string
          titulo?: string | null
        }
        Relationships: []
      }
      LCI_CRIMES_INFORMATICOS: {
        Row: {
          capitulo: string | null
          caput: string
          id: string
          incisos: string[] | null
          numero: string
          ordem: number | null
          ordem_numero: number | null
          paragrafos: string[] | null
          rotulo: string | null
          texto: string
          titulo: string | null
        }
        Insert: {
          capitulo?: string | null
          caput?: string
          id?: string
          incisos?: string[] | null
          numero: string
          ordem?: number | null
          ordem_numero?: number | null
          paragrafos?: string[] | null
          rotulo?: string | null
          texto?: string
          titulo?: string | null
        }
        Update: {
          capitulo?: string | null
          caput?: string
          id?: string
          incisos?: string[] | null
          numero?: string
          ordem?: number | null
          ordem_numero?: number | null
          paragrafos?: string[] | null
          rotulo?: string | null
          texto?: string
          titulo?: string | null
        }
        Relationships: []
      }
      LCON_CONCESSOES: {
        Row: {
          capitulo: string | null
          caput: string
          id: string
          incisos: string[] | null
          numero: string
          ordem: number | null
          ordem_numero: number | null
          paragrafos: string[] | null
          rotulo: string | null
          texto: string
          titulo: string | null
        }
        Insert: {
          capitulo?: string | null
          caput?: string
          id?: string
          incisos?: string[] | null
          numero: string
          ordem?: number | null
          ordem_numero?: number | null
          paragrafos?: string[] | null
          rotulo?: string | null
          texto?: string
          titulo?: string | null
        }
        Update: {
          capitulo?: string | null
          caput?: string
          id?: string
          incisos?: string[] | null
          numero?: string
          ordem?: number | null
          ordem_numero?: number | null
          paragrafos?: string[] | null
          rotulo?: string | null
          texto?: string
          titulo?: string | null
        }
        Relationships: []
      }
      LCP_CONTRAVENCOES_PENAIS: {
        Row: {
          capitulo: string | null
          caput: string
          id: string
          incisos: string[] | null
          numero: string
          ordem: number | null
          ordem_numero: number | null
          paragrafos: string[] | null
          rotulo: string | null
          texto: string
          titulo: string | null
        }
        Insert: {
          capitulo?: string | null
          caput?: string
          id?: string
          incisos?: string[] | null
          numero: string
          ordem?: number | null
          ordem_numero?: number | null
          paragrafos?: string[] | null
          rotulo?: string | null
          texto?: string
          titulo?: string | null
        }
        Update: {
          capitulo?: string | null
          caput?: string
          id?: string
          incisos?: string[] | null
          numero?: string
          ordem?: number | null
          ordem_numero?: number | null
          paragrafos?: string[] | null
          rotulo?: string | null
          texto?: string
          titulo?: string | null
        }
        Relationships: []
      }
      LCSF_CRIMES_SISTEMA_FINANCEIRO: {
        Row: {
          capitulo: string | null
          caput: string
          id: string
          incisos: string[] | null
          numero: string
          ordem: number | null
          ordem_numero: number | null
          paragrafos: string[] | null
          rotulo: string | null
          texto: string
          titulo: string | null
        }
        Insert: {
          capitulo?: string | null
          caput?: string
          id?: string
          incisos?: string[] | null
          numero: string
          ordem?: number | null
          ordem_numero?: number | null
          paragrafos?: string[] | null
          rotulo?: string | null
          texto?: string
          titulo?: string | null
        }
        Update: {
          capitulo?: string | null
          caput?: string
          id?: string
          incisos?: string[] | null
          numero?: string
          ordem?: number | null
          ordem_numero?: number | null
          paragrafos?: string[] | null
          rotulo?: string | null
          texto?: string
          titulo?: string | null
        }
        Relationships: []
      }
      LCSS_CUSTEIO_SEGURIDADE: {
        Row: {
          capitulo: string | null
          caput: string
          id: string
          incisos: string[] | null
          numero: string
          ordem: number
          ordem_numero: number
          paragrafos: string[] | null
          rotulo: string | null
          texto: string
          titulo: string | null
        }
        Insert: {
          capitulo?: string | null
          caput?: string
          id?: string
          incisos?: string[] | null
          numero: string
          ordem?: number
          ordem_numero?: number
          paragrafos?: string[] | null
          rotulo?: string | null
          texto?: string
          titulo?: string | null
        }
        Update: {
          capitulo?: string | null
          caput?: string
          id?: string
          incisos?: string[] | null
          numero?: string
          ordem?: number
          ordem_numero?: number
          paragrafos?: string[] | null
          rotulo?: string | null
          texto?: string
          titulo?: string | null
        }
        Relationships: []
      }
      LD_LEI_DROGAS: {
        Row: {
          capitulo: string | null
          caput: string
          id: string
          incisos: string[] | null
          numero: string
          ordem: number
          ordem_numero: number
          paragrafos: string[] | null
          rotulo: string | null
          texto: string
          titulo: string | null
        }
        Insert: {
          capitulo?: string | null
          caput?: string
          id?: string
          incisos?: string[] | null
          numero: string
          ordem?: number
          ordem_numero?: number
          paragrafos?: string[] | null
          rotulo?: string | null
          texto?: string
          titulo?: string | null
        }
        Update: {
          capitulo?: string | null
          caput?: string
          id?: string
          incisos?: string[] | null
          numero?: string
          ordem?: number
          ordem_numero?: number
          paragrafos?: string[] | null
          rotulo?: string | null
          texto?: string
          titulo?: string | null
        }
        Relationships: []
      }
      LDA_DIREITOS_AUTORAIS: {
        Row: {
          capitulo: string | null
          caput: string
          id: string
          incisos: string[] | null
          numero: string
          ordem: number | null
          ordem_numero: number | null
          paragrafos: string[] | null
          rotulo: string | null
          texto: string
          titulo: string | null
        }
        Insert: {
          capitulo?: string | null
          caput?: string
          id?: string
          incisos?: string[] | null
          numero: string
          ordem?: number | null
          ordem_numero?: number | null
          paragrafos?: string[] | null
          rotulo?: string | null
          texto?: string
          titulo?: string | null
        }
        Update: {
          capitulo?: string | null
          caput?: string
          id?: string
          incisos?: string[] | null
          numero?: string
          ordem?: number | null
          ordem_numero?: number | null
          paragrafos?: string[] | null
          rotulo?: string | null
          texto?: string
          titulo?: string | null
        }
        Relationships: []
      }
      LDB_DIRETRIZES_EDUCACAO: {
        Row: {
          capitulo: string | null
          caput: string
          id: string
          incisos: string[] | null
          numero: string
          ordem: number | null
          ordem_numero: number | null
          paragrafos: string[] | null
          rotulo: string | null
          texto: string
          titulo: string | null
        }
        Insert: {
          capitulo?: string | null
          caput?: string
          id?: string
          incisos?: string[] | null
          numero: string
          ordem?: number | null
          ordem_numero?: number | null
          paragrafos?: string[] | null
          rotulo?: string | null
          texto?: string
          titulo?: string | null
        }
        Update: {
          capitulo?: string | null
          caput?: string
          id?: string
          incisos?: string[] | null
          numero?: string
          ordem?: number | null
          ordem_numero?: number | null
          paragrafos?: string[] | null
          rotulo?: string | null
          texto?: string
          titulo?: string | null
        }
        Relationships: []
      }
      legislacao_alteracoes: {
        Row: {
          artigo_numero: string | null
          detectado_em: string
          id: string
          revisado: boolean
          tabela_nome: string
          texto_anterior: string | null
          texto_atual: string | null
          tipo_alteracao: string
        }
        Insert: {
          artigo_numero?: string | null
          detectado_em?: string
          id?: string
          revisado?: boolean
          tabela_nome: string
          texto_anterior?: string | null
          texto_atual?: string | null
          tipo_alteracao: string
        }
        Update: {
          artigo_numero?: string | null
          detectado_em?: string
          id?: string
          revisado?: boolean
          tabela_nome?: string
          texto_anterior?: string | null
          texto_atual?: string | null
          tipo_alteracao?: string
        }
        Relationships: []
      }
      leis_ordinarias: {
        Row: {
          ano: number
          data_publicacao: string | null
          ementa: string
          id: string
          numero_lei: string
          ordem: number
          texto_completo: string | null
          url: string | null
        }
        Insert: {
          ano: number
          data_publicacao?: string | null
          ementa?: string
          id?: string
          numero_lei: string
          ordem?: number
          texto_completo?: string | null
          url?: string | null
        }
        Update: {
          ano?: number
          data_publicacao?: string | null
          ementa?: string
          id?: string
          numero_lei?: string
          ordem?: number
          texto_completo?: string | null
          url?: string | null
        }
        Relationships: []
      }
      LELE_ELEICOES: {
        Row: {
          capitulo: string | null
          caput: string
          id: string
          incisos: string[] | null
          numero: string
          ordem: number | null
          ordem_numero: number | null
          paragrafos: string[] | null
          rotulo: string | null
          texto: string
          titulo: string | null
        }
        Insert: {
          capitulo?: string | null
          caput?: string
          id?: string
          incisos?: string[] | null
          numero: string
          ordem?: number | null
          ordem_numero?: number | null
          paragrafos?: string[] | null
          rotulo?: string | null
          texto?: string
          titulo?: string | null
        }
        Update: {
          capitulo?: string | null
          caput?: string
          id?: string
          incisos?: string[] | null
          numero?: string
          ordem?: number | null
          ordem_numero?: number | null
          paragrafos?: string[] | null
          rotulo?: string | null
          texto?: string
          titulo?: string | null
        }
        Relationships: []
      }
      LEP_EXECUCAO_PENAL: {
        Row: {
          capitulo: string | null
          caput: string
          id: string
          incisos: string[] | null
          numero: string
          ordem: number
          ordem_numero: number
          paragrafos: string[] | null
          rotulo: string | null
          texto: string
          titulo: string | null
        }
        Insert: {
          capitulo?: string | null
          caput?: string
          id?: string
          incisos?: string[] | null
          numero: string
          ordem?: number
          ordem_numero?: number
          paragrafos?: string[] | null
          rotulo?: string | null
          texto?: string
          titulo?: string | null
        }
        Update: {
          capitulo?: string | null
          caput?: string
          id?: string
          incisos?: string[] | null
          numero?: string
          ordem?: number
          ordem_numero?: number
          paragrafos?: string[] | null
          rotulo?: string | null
          texto?: string
          titulo?: string | null
        }
        Relationships: []
      }
      LF_FALENCIAS: {
        Row: {
          capitulo: string | null
          caput: string
          id: string
          incisos: string[] | null
          numero: string
          ordem: number
          ordem_numero: number
          paragrafos: string[] | null
          rotulo: string | null
          texto: string
          titulo: string | null
        }
        Insert: {
          capitulo?: string | null
          caput?: string
          id?: string
          incisos?: string[] | null
          numero: string
          ordem?: number
          ordem_numero?: number
          paragrafos?: string[] | null
          rotulo?: string | null
          texto?: string
          titulo?: string | null
        }
        Update: {
          capitulo?: string | null
          caput?: string
          id?: string
          incisos?: string[] | null
          numero?: string
          ordem?: number
          ordem_numero?: number
          paragrafos?: string[] | null
          rotulo?: string | null
          texto?: string
          titulo?: string | null
        }
        Relationships: []
      }
      LFL_FICHA_LIMPA: {
        Row: {
          capitulo: string | null
          caput: string
          id: string
          incisos: string[] | null
          numero: string
          ordem: number | null
          ordem_numero: number | null
          paragrafos: string[] | null
          rotulo: string | null
          texto: string
          titulo: string | null
        }
        Insert: {
          capitulo?: string | null
          caput?: string
          id?: string
          incisos?: string[] | null
          numero: string
          ordem?: number | null
          ordem_numero?: number | null
          paragrafos?: string[] | null
          rotulo?: string | null
          texto?: string
          titulo?: string | null
        }
        Update: {
          capitulo?: string | null
          caput?: string
          id?: string
          incisos?: string[] | null
          numero?: string
          ordem?: number | null
          ordem_numero?: number | null
          paragrafos?: string[] | null
          rotulo?: string | null
          texto?: string
          titulo?: string | null
        }
        Relationships: []
      }
      LGPD_PROTECAO_DADOS: {
        Row: {
          capitulo: string | null
          caput: string
          id: string
          incisos: string[] | null
          numero: string
          ordem: number
          ordem_numero: number
          paragrafos: string[] | null
          rotulo: string | null
          texto: string
          titulo: string | null
        }
        Insert: {
          capitulo?: string | null
          caput?: string
          id?: string
          incisos?: string[] | null
          numero: string
          ordem?: number
          ordem_numero?: number
          paragrafos?: string[] | null
          rotulo?: string | null
          texto?: string
          titulo?: string | null
        }
        Update: {
          capitulo?: string | null
          caput?: string
          id?: string
          incisos?: string[] | null
          numero?: string
          ordem?: number
          ordem_numero?: number
          paragrafos?: string[] | null
          rotulo?: string | null
          texto?: string
          titulo?: string | null
        }
        Relationships: []
      }
      LHD_HABEAS_DATA: {
        Row: {
          capitulo: string | null
          caput: string
          id: string
          incisos: string[] | null
          numero: string
          ordem: number | null
          ordem_numero: number | null
          paragrafos: string[] | null
          rotulo: string | null
          texto: string
          titulo: string | null
        }
        Insert: {
          capitulo?: string | null
          caput?: string
          id?: string
          incisos?: string[] | null
          numero: string
          ordem?: number | null
          ordem_numero?: number | null
          paragrafos?: string[] | null
          rotulo?: string | null
          texto?: string
          titulo?: string | null
        }
        Update: {
          capitulo?: string | null
          caput?: string
          id?: string
          incisos?: string[] | null
          numero?: string
          ordem?: number | null
          ordem_numero?: number | null
          paragrafos?: string[] | null
          rotulo?: string | null
          texto?: string
          titulo?: string | null
        }
        Relationships: []
      }
      LI_INQUILINATO: {
        Row: {
          capitulo: string | null
          caput: string
          id: string
          incisos: string[] | null
          numero: string
          ordem: number
          ordem_numero: number
          paragrafos: string[] | null
          rotulo: string | null
          texto: string
          titulo: string | null
        }
        Insert: {
          capitulo?: string | null
          caput?: string
          id?: string
          incisos?: string[] | null
          numero: string
          ordem?: number
          ordem_numero?: number
          paragrafos?: string[] | null
          rotulo?: string | null
          texto?: string
          titulo?: string | null
        }
        Update: {
          capitulo?: string | null
          caput?: string
          id?: string
          incisos?: string[] | null
          numero?: string
          ordem?: number
          ordem_numero?: number
          paragrafos?: string[] | null
          rotulo?: string | null
          texto?: string
          titulo?: string | null
        }
        Relationships: []
      }
      LIA_IMPROBIDADE_ADMINISTRATIVA: {
        Row: {
          capitulo: string | null
          caput: string
          id: string
          incisos: string[] | null
          numero: string
          ordem: number
          ordem_numero: number
          paragrafos: string[] | null
          rotulo: string | null
          texto: string
          titulo: string | null
        }
        Insert: {
          capitulo?: string | null
          caput?: string
          id?: string
          incisos?: string[] | null
          numero: string
          ordem?: number
          ordem_numero?: number
          paragrafos?: string[] | null
          rotulo?: string | null
          texto?: string
          titulo?: string | null
        }
        Update: {
          capitulo?: string | null
          caput?: string
          id?: string
          incisos?: string[] | null
          numero?: string
          ordem?: number
          ordem_numero?: number
          paragrafos?: string[] | null
          rotulo?: string | null
          texto?: string
          titulo?: string | null
        }
        Relationships: []
      }
      LINDB_INTRODUCAO_NORMAS: {
        Row: {
          capitulo: string | null
          caput: string
          id: string
          incisos: string[] | null
          numero: string
          ordem: number | null
          ordem_numero: number | null
          paragrafos: string[] | null
          rotulo: string | null
          texto: string
          titulo: string | null
        }
        Insert: {
          capitulo?: string | null
          caput?: string
          id?: string
          incisos?: string[] | null
          numero: string
          ordem?: number | null
          ordem_numero?: number | null
          paragrafos?: string[] | null
          rotulo?: string | null
          texto?: string
          titulo?: string | null
        }
        Update: {
          capitulo?: string | null
          caput?: string
          id?: string
          incisos?: string[] | null
          numero?: string
          ordem?: number | null
          ordem_numero?: number | null
          paragrafos?: string[] | null
          rotulo?: string | null
          texto?: string
          titulo?: string | null
        }
        Relationships: []
      }
      LINE_INELEGIBILIDADES: {
        Row: {
          capitulo: string | null
          caput: string
          id: string
          incisos: string[] | null
          numero: string
          ordem: number | null
          ordem_numero: number | null
          paragrafos: string[] | null
          rotulo: string | null
          texto: string
          titulo: string | null
        }
        Insert: {
          capitulo?: string | null
          caput?: string
          id?: string
          incisos?: string[] | null
          numero: string
          ordem?: number | null
          ordem_numero?: number | null
          paragrafos?: string[] | null
          rotulo?: string | null
          texto?: string
          titulo?: string | null
        }
        Update: {
          capitulo?: string | null
          caput?: string
          id?: string
          incisos?: string[] | null
          numero?: string
          ordem?: number | null
          ordem_numero?: number | null
          paragrafos?: string[] | null
          rotulo?: string | null
          texto?: string
          titulo?: string | null
        }
        Relationships: []
      }
      LIT_INTERCEPTACAO_TELEFONICA: {
        Row: {
          capitulo: string | null
          caput: string
          id: string
          incisos: string[] | null
          numero: string
          ordem: number
          ordem_numero: number
          paragrafos: string[] | null
          rotulo: string | null
          texto: string
          titulo: string | null
        }
        Insert: {
          capitulo?: string | null
          caput?: string
          id?: string
          incisos?: string[] | null
          numero: string
          ordem?: number
          ordem_numero?: number
          paragrafos?: string[] | null
          rotulo?: string | null
          texto?: string
          titulo?: string | null
        }
        Update: {
          capitulo?: string | null
          caput?: string
          id?: string
          incisos?: string[] | null
          numero?: string
          ordem?: number
          ordem_numero?: number
          paragrafos?: string[] | null
          rotulo?: string | null
          texto?: string
          titulo?: string | null
        }
        Relationships: []
      }
      LJE_JUIZADOS_ESPECIAIS: {
        Row: {
          capitulo: string | null
          caput: string
          id: string
          incisos: string[] | null
          numero: string
          ordem: number
          ordem_numero: number
          paragrafos: string[] | null
          rotulo: string | null
          texto: string
          titulo: string | null
        }
        Insert: {
          capitulo?: string | null
          caput?: string
          id?: string
          incisos?: string[] | null
          numero: string
          ordem?: number
          ordem_numero?: number
          paragrafos?: string[] | null
          rotulo?: string | null
          texto?: string
          titulo?: string | null
        }
        Update: {
          capitulo?: string | null
          caput?: string
          id?: string
          incisos?: string[] | null
          numero?: string
          ordem?: number
          ordem_numero?: number
          paragrafos?: string[] | null
          rotulo?: string | null
          texto?: string
          titulo?: string | null
        }
        Relationships: []
      }
      LLAV_LAVAGEM_DINHEIRO: {
        Row: {
          capitulo: string | null
          caput: string
          id: string
          incisos: string[] | null
          numero: string
          ordem: number | null
          ordem_numero: number | null
          paragrafos: string[] | null
          rotulo: string | null
          texto: string
          titulo: string | null
        }
        Insert: {
          capitulo?: string | null
          caput?: string
          id?: string
          incisos?: string[] | null
          numero: string
          ordem?: number | null
          ordem_numero?: number | null
          paragrafos?: string[] | null
          rotulo?: string | null
          texto?: string
          titulo?: string | null
        }
        Update: {
          capitulo?: string | null
          caput?: string
          id?: string
          incisos?: string[] | null
          numero?: string
          ordem?: number | null
          ordem_numero?: number | null
          paragrafos?: string[] | null
          rotulo?: string | null
          texto?: string
          titulo?: string | null
        }
        Relationships: []
      }
      LLE_LIBERDADE_ECONOMICA: {
        Row: {
          capitulo: string | null
          caput: string
          id: string
          incisos: string[] | null
          numero: string
          ordem: number | null
          ordem_numero: number | null
          paragrafos: string[] | null
          rotulo: string | null
          texto: string
          titulo: string | null
        }
        Insert: {
          capitulo?: string | null
          caput?: string
          id?: string
          incisos?: string[] | null
          numero: string
          ordem?: number | null
          ordem_numero?: number | null
          paragrafos?: string[] | null
          rotulo?: string | null
          texto?: string
          titulo?: string | null
        }
        Update: {
          capitulo?: string | null
          caput?: string
          id?: string
          incisos?: string[] | null
          numero?: string
          ordem?: number | null
          ordem_numero?: number | null
          paragrafos?: string[] | null
          rotulo?: string | null
          texto?: string
          titulo?: string | null
        }
        Relationships: []
      }
      LMI_MANDADO_INJUNCAO: {
        Row: {
          capitulo: string | null
          caput: string
          id: string
          incisos: string[] | null
          numero: string
          ordem: number | null
          ordem_numero: number | null
          paragrafos: string[] | null
          rotulo: string | null
          texto: string
          titulo: string | null
        }
        Insert: {
          capitulo?: string | null
          caput?: string
          id?: string
          incisos?: string[] | null
          numero: string
          ordem?: number | null
          ordem_numero?: number | null
          paragrafos?: string[] | null
          rotulo?: string | null
          texto?: string
          titulo?: string | null
        }
        Update: {
          capitulo?: string | null
          caput?: string
          id?: string
          incisos?: string[] | null
          numero?: string
          ordem?: number | null
          ordem_numero?: number | null
          paragrafos?: string[] | null
          rotulo?: string | null
          texto?: string
          titulo?: string | null
        }
        Relationships: []
      }
      LMLS_MARCO_LEGAL_STARTUPS: {
        Row: {
          capitulo: string | null
          caput: string
          id: string
          incisos: string[] | null
          numero: string
          ordem: number | null
          ordem_numero: number | null
          paragrafos: string[] | null
          rotulo: string | null
          texto: string
          titulo: string | null
        }
        Insert: {
          capitulo?: string | null
          caput?: string
          id?: string
          incisos?: string[] | null
          numero: string
          ordem?: number | null
          ordem_numero?: number | null
          paragrafos?: string[] | null
          rotulo?: string | null
          texto?: string
          titulo?: string | null
        }
        Update: {
          capitulo?: string | null
          caput?: string
          id?: string
          incisos?: string[] | null
          numero?: string
          ordem?: number | null
          ordem_numero?: number | null
          paragrafos?: string[] | null
          rotulo?: string | null
          texto?: string
          titulo?: string | null
        }
        Relationships: []
      }
      LMP_MARIA_PENHA: {
        Row: {
          capitulo: string | null
          caput: string
          id: string
          incisos: string[] | null
          numero: string
          ordem: number
          ordem_numero: number
          paragrafos: string[] | null
          rotulo: string | null
          texto: string
          titulo: string | null
        }
        Insert: {
          capitulo?: string | null
          caput?: string
          id?: string
          incisos?: string[] | null
          numero: string
          ordem?: number
          ordem_numero?: number
          paragrafos?: string[] | null
          rotulo?: string | null
          texto?: string
          titulo?: string | null
        }
        Update: {
          capitulo?: string | null
          caput?: string
          id?: string
          incisos?: string[] | null
          numero?: string
          ordem?: number
          ordem_numero?: number
          paragrafos?: string[] | null
          rotulo?: string | null
          texto?: string
          titulo?: string | null
        }
        Relationships: []
      }
      LMS_MANDADO_SEGURANCA: {
        Row: {
          capitulo: string | null
          caput: string
          id: string
          incisos: string[] | null
          numero: string
          ordem: number
          ordem_numero: number
          paragrafos: string[] | null
          rotulo: string | null
          texto: string
          titulo: string | null
        }
        Insert: {
          capitulo?: string | null
          caput?: string
          id?: string
          incisos?: string[] | null
          numero: string
          ordem?: number
          ordem_numero?: number
          paragrafos?: string[] | null
          rotulo?: string | null
          texto?: string
          titulo?: string | null
        }
        Update: {
          capitulo?: string | null
          caput?: string
          id?: string
          incisos?: string[] | null
          numero?: string
          ordem?: number
          ordem_numero?: number
          paragrafos?: string[] | null
          rotulo?: string | null
          texto?: string
          titulo?: string | null
        }
        Relationships: []
      }
      LOAS_ASSISTENCIA_SOCIAL: {
        Row: {
          capitulo: string | null
          caput: string
          id: string
          incisos: string[] | null
          numero: string
          ordem: number | null
          ordem_numero: number | null
          paragrafos: string[] | null
          rotulo: string | null
          texto: string
          titulo: string | null
        }
        Insert: {
          capitulo?: string | null
          caput?: string
          id?: string
          incisos?: string[] | null
          numero: string
          ordem?: number | null
          ordem_numero?: number | null
          paragrafos?: string[] | null
          rotulo?: string | null
          texto?: string
          titulo?: string | null
        }
        Update: {
          capitulo?: string | null
          caput?: string
          id?: string
          incisos?: string[] | null
          numero?: string
          ordem?: number | null
          ordem_numero?: number | null
          paragrafos?: string[] | null
          rotulo?: string | null
          texto?: string
          titulo?: string | null
        }
        Relationships: []
      }
      LOC_ORGANIZACAO_CRIMINOSA: {
        Row: {
          capitulo: string | null
          caput: string
          id: string
          incisos: string[] | null
          numero: string
          ordem: number
          ordem_numero: number
          paragrafos: string[] | null
          rotulo: string | null
          texto: string
          titulo: string | null
        }
        Insert: {
          capitulo?: string | null
          caput?: string
          id?: string
          incisos?: string[] | null
          numero: string
          ordem?: number
          ordem_numero?: number
          paragrafos?: string[] | null
          rotulo?: string | null
          texto?: string
          titulo?: string | null
        }
        Update: {
          capitulo?: string | null
          caput?: string
          id?: string
          incisos?: string[] | null
          numero?: string
          ordem?: number
          ordem_numero?: number
          paragrafos?: string[] | null
          rotulo?: string | null
          texto?: string
          titulo?: string | null
        }
        Relationships: []
      }
      LOMAN_LEI_ORGANICA_MAGISTRATURA: {
        Row: {
          capitulo: string | null
          caput: string
          id: string
          incisos: string[] | null
          numero: string
          ordem: number
          ordem_numero: number
          paragrafos: string[] | null
          rotulo: string | null
          texto: string
          titulo: string | null
        }
        Insert: {
          capitulo?: string | null
          caput?: string
          id?: string
          incisos?: string[] | null
          numero: string
          ordem?: number
          ordem_numero?: number
          paragrafos?: string[] | null
          rotulo?: string | null
          texto?: string
          titulo?: string | null
        }
        Update: {
          capitulo?: string | null
          caput?: string
          id?: string
          incisos?: string[] | null
          numero?: string
          ordem?: number
          ordem_numero?: number
          paragrafos?: string[] | null
          rotulo?: string | null
          texto?: string
          titulo?: string | null
        }
        Relationships: []
      }
      LOMP_ORGANICA_MP: {
        Row: {
          capitulo: string | null
          caput: string
          id: string
          incisos: string[] | null
          numero: string
          ordem: number | null
          ordem_numero: number | null
          paragrafos: string[] | null
          rotulo: string | null
          texto: string
          titulo: string | null
        }
        Insert: {
          capitulo?: string | null
          caput?: string
          id?: string
          incisos?: string[] | null
          numero: string
          ordem?: number | null
          ordem_numero?: number | null
          paragrafos?: string[] | null
          rotulo?: string | null
          texto?: string
          titulo?: string | null
        }
        Update: {
          capitulo?: string | null
          caput?: string
          id?: string
          incisos?: string[] | null
          numero?: string
          ordem?: number | null
          ordem_numero?: number | null
          paragrafos?: string[] | null
          rotulo?: string | null
          texto?: string
          titulo?: string | null
        }
        Relationships: []
      }
      LOTCU_ORGANICA_TCU: {
        Row: {
          capitulo: string | null
          caput: string
          id: string
          incisos: string[] | null
          numero: string
          ordem: number | null
          ordem_numero: number | null
          paragrafos: string[] | null
          rotulo: string | null
          texto: string
          titulo: string | null
        }
        Insert: {
          capitulo?: string | null
          caput?: string
          id?: string
          incisos?: string[] | null
          numero: string
          ordem?: number | null
          ordem_numero?: number | null
          paragrafos?: string[] | null
          rotulo?: string | null
          texto?: string
          titulo?: string | null
        }
        Update: {
          capitulo?: string | null
          caput?: string
          id?: string
          incisos?: string[] | null
          numero?: string
          ordem?: number | null
          ordem_numero?: number | null
          paragrafos?: string[] | null
          rotulo?: string | null
          texto?: string
          titulo?: string | null
        }
        Relationships: []
      }
      LPAF_PROCESSO_ADMINISTRATIVO: {
        Row: {
          capitulo: string | null
          caput: string
          id: string
          incisos: string[] | null
          numero: string
          ordem: number | null
          ordem_numero: number | null
          paragrafos: string[] | null
          rotulo: string | null
          texto: string
          titulo: string | null
        }
        Insert: {
          capitulo?: string | null
          caput?: string
          id?: string
          incisos?: string[] | null
          numero: string
          ordem?: number | null
          ordem_numero?: number | null
          paragrafos?: string[] | null
          rotulo?: string | null
          texto?: string
          titulo?: string | null
        }
        Update: {
          capitulo?: string | null
          caput?: string
          id?: string
          incisos?: string[] | null
          numero?: string
          ordem?: number | null
          ordem_numero?: number | null
          paragrafos?: string[] | null
          rotulo?: string | null
          texto?: string
          titulo?: string | null
        }
        Relationships: []
      }
      LPC_PREVIDENCIA_COMPLEMENTAR: {
        Row: {
          capitulo: string | null
          caput: string
          id: string
          incisos: string[] | null
          numero: string
          ordem: number
          ordem_numero: number
          paragrafos: string[] | null
          rotulo: string | null
          texto: string
          titulo: string | null
        }
        Insert: {
          capitulo?: string | null
          caput?: string
          id?: string
          incisos?: string[] | null
          numero: string
          ordem?: number
          ordem_numero?: number
          paragrafos?: string[] | null
          rotulo?: string | null
          texto?: string
          titulo?: string | null
        }
        Update: {
          capitulo?: string | null
          caput?: string
          id?: string
          incisos?: string[] | null
          numero?: string
          ordem?: number
          ordem_numero?: number
          paragrafos?: string[] | null
          rotulo?: string | null
          texto?: string
          titulo?: string | null
        }
        Relationships: []
      }
      LPI_PROPRIEDADE_INDUSTRIAL: {
        Row: {
          capitulo: string | null
          caput: string
          id: string
          incisos: string[] | null
          numero: string
          ordem: number | null
          ordem_numero: number | null
          paragrafos: string[] | null
          rotulo: string | null
          texto: string
          titulo: string | null
        }
        Insert: {
          capitulo?: string | null
          caput?: string
          id?: string
          incisos?: string[] | null
          numero: string
          ordem?: number | null
          ordem_numero?: number | null
          paragrafos?: string[] | null
          rotulo?: string | null
          texto?: string
          titulo?: string | null
        }
        Update: {
          capitulo?: string | null
          caput?: string
          id?: string
          incisos?: string[] | null
          numero?: string
          ordem?: number | null
          ordem_numero?: number | null
          paragrafos?: string[] | null
          rotulo?: string | null
          texto?: string
          titulo?: string | null
        }
        Relationships: []
      }
      LPP_PARTIDOS_POLITICOS: {
        Row: {
          capitulo: string | null
          caput: string
          id: string
          incisos: string[] | null
          numero: string
          ordem: number | null
          ordem_numero: number | null
          paragrafos: string[] | null
          rotulo: string | null
          texto: string
          titulo: string | null
        }
        Insert: {
          capitulo?: string | null
          caput?: string
          id?: string
          incisos?: string[] | null
          numero: string
          ordem?: number | null
          ordem_numero?: number | null
          paragrafos?: string[] | null
          rotulo?: string | null
          texto?: string
          titulo?: string | null
        }
        Update: {
          capitulo?: string | null
          caput?: string
          id?: string
          incisos?: string[] | null
          numero?: string
          ordem?: number | null
          ordem_numero?: number | null
          paragrafos?: string[] | null
          rotulo?: string | null
          texto?: string
          titulo?: string | null
        }
        Relationships: []
      }
      LPPP_PARCERIAS_PUBLICO_PRIVADAS: {
        Row: {
          capitulo: string | null
          caput: string
          id: string
          incisos: string[] | null
          numero: string
          ordem: number | null
          ordem_numero: number | null
          paragrafos: string[] | null
          rotulo: string | null
          texto: string
          titulo: string | null
        }
        Insert: {
          capitulo?: string | null
          caput?: string
          id?: string
          incisos?: string[] | null
          numero: string
          ordem?: number | null
          ordem_numero?: number | null
          paragrafos?: string[] | null
          rotulo?: string | null
          texto?: string
          titulo?: string | null
        }
        Update: {
          capitulo?: string | null
          caput?: string
          id?: string
          incisos?: string[] | null
          numero?: string
          ordem?: number | null
          ordem_numero?: number | null
          paragrafos?: string[] | null
          rotulo?: string | null
          texto?: string
          titulo?: string | null
        }
        Relationships: []
      }
      LPSU_PARCELAMENTO_SOLO: {
        Row: {
          capitulo: string | null
          caput: string
          id: string
          incisos: string[] | null
          numero: string
          ordem: number | null
          ordem_numero: number | null
          paragrafos: string[] | null
          rotulo: string | null
          texto: string
          titulo: string | null
        }
        Insert: {
          capitulo?: string | null
          caput?: string
          id?: string
          incisos?: string[] | null
          numero: string
          ordem?: number | null
          ordem_numero?: number | null
          paragrafos?: string[] | null
          rotulo?: string | null
          texto?: string
          titulo?: string | null
        }
        Update: {
          capitulo?: string | null
          caput?: string
          id?: string
          incisos?: string[] | null
          numero?: string
          ordem?: number | null
          ordem_numero?: number | null
          paragrafos?: string[] | null
          rotulo?: string | null
          texto?: string
          titulo?: string | null
        }
        Relationships: []
      }
      LPT_PROTECAO_TESTEMUNHAS: {
        Row: {
          capitulo: string | null
          caput: string
          id: string
          incisos: string[] | null
          numero: string
          ordem: number | null
          ordem_numero: number | null
          paragrafos: string[] | null
          rotulo: string | null
          texto: string
          titulo: string | null
        }
        Insert: {
          capitulo?: string | null
          caput?: string
          id?: string
          incisos?: string[] | null
          numero: string
          ordem?: number | null
          ordem_numero?: number | null
          paragrafos?: string[] | null
          rotulo?: string | null
          texto?: string
          titulo?: string | null
        }
        Update: {
          capitulo?: string | null
          caput?: string
          id?: string
          incisos?: string[] | null
          numero?: string
          ordem?: number | null
          ordem_numero?: number | null
          paragrafos?: string[] | null
          rotulo?: string | null
          texto?: string
          titulo?: string | null
        }
        Relationships: []
      }
      LRAC_RACISMO: {
        Row: {
          capitulo: string | null
          caput: string
          id: string
          incisos: string[] | null
          numero: string
          ordem: number | null
          ordem_numero: number | null
          paragrafos: string[] | null
          rotulo: string | null
          texto: string
          titulo: string | null
        }
        Insert: {
          capitulo?: string | null
          caput?: string
          id?: string
          incisos?: string[] | null
          numero: string
          ordem?: number | null
          ordem_numero?: number | null
          paragrafos?: string[] | null
          rotulo?: string | null
          texto?: string
          titulo?: string | null
        }
        Update: {
          capitulo?: string | null
          caput?: string
          id?: string
          incisos?: string[] | null
          numero?: string
          ordem?: number | null
          ordem_numero?: number | null
          paragrafos?: string[] | null
          rotulo?: string | null
          texto?: string
          titulo?: string | null
        }
        Relationships: []
      }
      LRF_RESPONSABILIDADE_FISCAL: {
        Row: {
          capitulo: string | null
          caput: string
          id: string
          incisos: string[] | null
          numero: string
          ordem: number | null
          ordem_numero: number | null
          paragrafos: string[] | null
          rotulo: string | null
          texto: string
          titulo: string | null
        }
        Insert: {
          capitulo?: string | null
          caput?: string
          id?: string
          incisos?: string[] | null
          numero: string
          ordem?: number | null
          ordem_numero?: number | null
          paragrafos?: string[] | null
          rotulo?: string | null
          texto?: string
          titulo?: string | null
        }
        Update: {
          capitulo?: string | null
          caput?: string
          id?: string
          incisos?: string[] | null
          numero?: string
          ordem?: number | null
          ordem_numero?: number | null
          paragrafos?: string[] | null
          rotulo?: string | null
          texto?: string
          titulo?: string | null
        }
        Relationships: []
      }
      LRP_REGISTROS_PUBLICOS: {
        Row: {
          capitulo: string | null
          caput: string
          id: string
          incisos: string[] | null
          numero: string
          ordem: number
          ordem_numero: number
          paragrafos: string[] | null
          rotulo: string | null
          texto: string
          titulo: string | null
        }
        Insert: {
          capitulo?: string | null
          caput?: string
          id?: string
          incisos?: string[] | null
          numero: string
          ordem?: number
          ordem_numero?: number
          paragrafos?: string[] | null
          rotulo?: string | null
          texto?: string
          titulo?: string | null
        }
        Update: {
          capitulo?: string | null
          caput?: string
          id?: string
          incisos?: string[] | null
          numero?: string
          ordem?: number
          ordem_numero?: number
          paragrafos?: string[] | null
          rotulo?: string | null
          texto?: string
          titulo?: string | null
        }
        Relationships: []
      }
      LRT_REFORMA_TRIBUTARIA: {
        Row: {
          capitulo: string | null
          caput: string
          id: string
          incisos: string[] | null
          numero: string
          ordem: number | null
          ordem_numero: number | null
          paragrafos: string[] | null
          rotulo: string | null
          texto: string
          titulo: string | null
        }
        Insert: {
          capitulo?: string | null
          caput?: string
          id?: string
          incisos?: string[] | null
          numero: string
          ordem?: number | null
          ordem_numero?: number | null
          paragrafos?: string[] | null
          rotulo?: string | null
          texto?: string
          titulo?: string | null
        }
        Update: {
          capitulo?: string | null
          caput?: string
          id?: string
          incisos?: string[] | null
          numero?: string
          ordem?: number | null
          ordem_numero?: number | null
          paragrafos?: string[] | null
          rotulo?: string | null
          texto?: string
          titulo?: string | null
        }
        Relationships: []
      }
      LSA_SOCIEDADES_ACOES: {
        Row: {
          capitulo: string | null
          caput: string
          id: string
          incisos: string[] | null
          numero: string
          ordem: number | null
          ordem_numero: number | null
          paragrafos: string[] | null
          rotulo: string | null
          texto: string
          titulo: string | null
        }
        Insert: {
          capitulo?: string | null
          caput?: string
          id?: string
          incisos?: string[] | null
          numero: string
          ordem?: number | null
          ordem_numero?: number | null
          paragrafos?: string[] | null
          rotulo?: string | null
          texto?: string
          titulo?: string | null
        }
        Update: {
          capitulo?: string | null
          caput?: string
          id?: string
          incisos?: string[] | null
          numero?: string
          ordem?: number | null
          ordem_numero?: number | null
          paragrafos?: string[] | null
          rotulo?: string | null
          texto?: string
          titulo?: string | null
        }
        Relationships: []
      }
      LSUS_SISTEMA_UNICO_SAUDE: {
        Row: {
          capitulo: string | null
          caput: string
          id: string
          incisos: string[] | null
          numero: string
          ordem: number | null
          ordem_numero: number | null
          paragrafos: string[] | null
          rotulo: string | null
          texto: string
          titulo: string | null
        }
        Insert: {
          capitulo?: string | null
          caput?: string
          id?: string
          incisos?: string[] | null
          numero: string
          ordem?: number | null
          ordem_numero?: number | null
          paragrafos?: string[] | null
          rotulo?: string | null
          texto?: string
          titulo?: string | null
        }
        Update: {
          capitulo?: string | null
          caput?: string
          id?: string
          incisos?: string[] | null
          numero?: string
          ordem?: number | null
          ordem_numero?: number | null
          paragrafos?: string[] | null
          rotulo?: string | null
          texto?: string
          titulo?: string | null
        }
        Relationships: []
      }
      LTORT_TORTURA: {
        Row: {
          capitulo: string | null
          caput: string
          id: string
          incisos: string[] | null
          numero: string
          ordem: number | null
          ordem_numero: number | null
          paragrafos: string[] | null
          rotulo: string | null
          texto: string
          titulo: string | null
        }
        Insert: {
          capitulo?: string | null
          caput?: string
          id?: string
          incisos?: string[] | null
          numero: string
          ordem?: number | null
          ordem_numero?: number | null
          paragrafos?: string[] | null
          rotulo?: string | null
          texto?: string
          titulo?: string | null
        }
        Update: {
          capitulo?: string | null
          caput?: string
          id?: string
          incisos?: string[] | null
          numero?: string
          ordem?: number | null
          ordem_numero?: number | null
          paragrafos?: string[] | null
          rotulo?: string | null
          texto?: string
          titulo?: string | null
        }
        Relationships: []
      }
      MCI_MARCO_CIVIL_INTERNET: {
        Row: {
          capitulo: string | null
          caput: string
          id: string
          incisos: string[] | null
          numero: string
          ordem: number
          ordem_numero: number
          paragrafos: string[] | null
          rotulo: string | null
          texto: string
          titulo: string | null
        }
        Insert: {
          capitulo?: string | null
          caput?: string
          id?: string
          incisos?: string[] | null
          numero: string
          ordem?: number
          ordem_numero?: number
          paragrafos?: string[] | null
          rotulo?: string | null
          texto?: string
          titulo?: string | null
        }
        Update: {
          capitulo?: string | null
          caput?: string
          id?: string
          incisos?: string[] | null
          numero?: string
          ordem?: number
          ordem_numero?: number
          paragrafos?: string[] | null
          rotulo?: string | null
          texto?: string
          titulo?: string | null
        }
        Relationships: []
      }
      mensagens_suporte: {
        Row: {
          assunto: string
          created_at: string
          email: string
          id: string
          mensagem: string
          user_id: string
        }
        Insert: {
          assunto: string
          created_at?: string
          email: string
          id?: string
          mensagem: string
          user_id: string
        }
        Update: {
          assunto?: string
          created_at?: string
          email?: string
          id?: string
          mensagem?: string
          user_id?: string
        }
        Relationships: []
      }
      narracoes_artigos: {
        Row: {
          artigo_numero: string
          audio_url: string
          created_at: string | null
          id: string
          lei_nome: string
          tabela_nome: string
          titulo_artigo: string | null
        }
        Insert: {
          artigo_numero: string
          audio_url: string
          created_at?: string | null
          id?: string
          lei_nome: string
          tabela_nome: string
          titulo_artigo?: string | null
        }
        Update: {
          artigo_numero?: string
          audio_url?: string
          created_at?: string | null
          id?: string
          lei_nome?: string
          tabela_nome?: string
          titulo_artigo?: string | null
        }
        Relationships: []
      }
      newsletter_subscriptions: {
        Row: {
          ativo: boolean
          created_at: string
          email: string
          hora_envio: string
          id: string
          preferencias: Json
          ultimo_envio: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          email: string
          hora_envio?: string
          id?: string
          preferencias?: Json
          ultimo_envio?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          email?: string
          hora_envio?: string
          id?: string
          preferencias?: Json
          ultimo_envio?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      NLL_LICITACOES: {
        Row: {
          capitulo: string | null
          caput: string
          id: string
          incisos: string[] | null
          numero: string
          ordem: number
          ordem_numero: number
          paragrafos: string[] | null
          rotulo: string | null
          texto: string
          titulo: string | null
        }
        Insert: {
          capitulo?: string | null
          caput?: string
          id?: string
          incisos?: string[] | null
          numero: string
          ordem?: number
          ordem_numero?: number
          paragrafos?: string[] | null
          rotulo?: string | null
          texto?: string
          titulo?: string | null
        }
        Update: {
          capitulo?: string | null
          caput?: string
          id?: string
          incisos?: string[] | null
          numero?: string
          ordem?: number
          ordem_numero?: number
          paragrafos?: string[] | null
          rotulo?: string | null
          texto?: string
          titulo?: string | null
        }
        Relationships: []
      }
      noticias_camara: {
        Row: {
          categoria: string | null
          conteudo: string | null
          created_at: string | null
          data_publicacao: string | null
          id: string
          imagem_url: string | null
          link: string
          resumo: string | null
          titulo: string
        }
        Insert: {
          categoria?: string | null
          conteudo?: string | null
          created_at?: string | null
          data_publicacao?: string | null
          id?: string
          imagem_url?: string | null
          link: string
          resumo?: string | null
          titulo: string
        }
        Update: {
          categoria?: string | null
          conteudo?: string | null
          created_at?: string | null
          data_publicacao?: string | null
          id?: string
          imagem_url?: string | null
          link?: string
          resumo?: string | null
          titulo?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          display_name: string | null
          id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          display_name?: string | null
          id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          display_name?: string | null
          id?: string
        }
        Relationships: []
      }
      quiz_categories: {
        Row: {
          color_accent: string | null
          color_primary: string | null
          color_secondary: string | null
          created_at: string
          description: string | null
          icon_url: string | null
          id: string
          name: string
          slug: string
        }
        Insert: {
          color_accent?: string | null
          color_primary?: string | null
          color_secondary?: string | null
          created_at?: string
          description?: string | null
          icon_url?: string | null
          id?: string
          name: string
          slug: string
        }
        Update: {
          color_accent?: string | null
          color_primary?: string | null
          color_secondary?: string | null
          created_at?: string
          description?: string | null
          icon_url?: string | null
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      quiz_match_answers: {
        Row: {
          created_at: string
          id: string
          is_correct: boolean
          match_id: string
          points_earned: number
          question_id: string
          response_time_ms: number
          selected_answer: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_correct: boolean
          match_id: string
          points_earned?: number
          question_id: string
          response_time_ms: number
          selected_answer: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_correct?: boolean
          match_id?: string
          points_earned?: number
          question_id?: string
          response_time_ms?: number
          selected_answer?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_match_answers_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "quiz_matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_match_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "quiz_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_match_questions: {
        Row: {
          id: string
          match_id: string
          question_id: string
          question_order: number
        }
        Insert: {
          id?: string
          match_id: string
          question_id: string
          question_order: number
        }
        Update: {
          id?: string
          match_id?: string
          question_id?: string
          question_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "quiz_match_questions_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "quiz_matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_match_questions_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "quiz_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_matches: {
        Row: {
          category_id: string
          created_at: string
          current_question: number
          finished_at: string | null
          id: string
          player1_id: string | null
          player1_score: number
          player2_id: string | null
          player2_score: number
          started_at: string | null
          status: string
          winner_id: string | null
        }
        Insert: {
          category_id: string
          created_at?: string
          current_question?: number
          finished_at?: string | null
          id?: string
          player1_id?: string | null
          player1_score?: number
          player2_id?: string | null
          player2_score?: number
          started_at?: string | null
          status?: string
          winner_id?: string | null
        }
        Update: {
          category_id?: string
          created_at?: string
          current_question?: number
          finished_at?: string | null
          id?: string
          player1_id?: string | null
          player1_score?: number
          player2_id?: string | null
          player2_score?: number
          started_at?: string | null
          status?: string
          winner_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quiz_matches_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "quiz_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_online_players: {
        Row: {
          category_id: string | null
          id: string
          last_seen_at: string
          user_id: string
        }
        Insert: {
          category_id?: string | null
          id?: string
          last_seen_at?: string
          user_id: string
        }
        Update: {
          category_id?: string | null
          id?: string
          last_seen_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_online_players_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "quiz_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_questions: {
        Row: {
          alternatives: Json
          category_id: string
          correct_answer: number
          created_at: string
          difficulty: string
          explanation: string | null
          id: string
          question: string
        }
        Insert: {
          alternatives: Json
          category_id: string
          correct_answer: number
          created_at?: string
          difficulty?: string
          explanation?: string | null
          id?: string
          question: string
        }
        Update: {
          alternatives?: Json
          category_id?: string
          correct_answer?: number
          created_at?: string
          difficulty?: string
          explanation?: string | null
          id?: string
          question?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_questions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "quiz_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      radar_deputados: {
        Row: {
          atualizado_em: string
          dados_json: Json | null
          email: string | null
          foto_url: string | null
          id: number
          legislatura_id: number | null
          nome: string
          sigla_partido: string | null
          sigla_uf: string | null
        }
        Insert: {
          atualizado_em?: string
          dados_json?: Json | null
          email?: string | null
          foto_url?: string | null
          id: number
          legislatura_id?: number | null
          nome: string
          sigla_partido?: string | null
          sigla_uf?: string | null
        }
        Update: {
          atualizado_em?: string
          dados_json?: Json | null
          email?: string | null
          foto_url?: string | null
          id?: number
          legislatura_id?: number | null
          nome?: string
          sigla_partido?: string | null
          sigla_uf?: string | null
        }
        Relationships: []
      }
      radar_pl_headlines: {
        Row: {
          analise: string | null
          created_at: string | null
          headline: string | null
          id: string
          id_externo: string
        }
        Insert: {
          analise?: string | null
          created_at?: string | null
          headline?: string | null
          id?: string
          id_externo: string
        }
        Update: {
          analise?: string | null
          created_at?: string | null
          headline?: string | null
          id?: string
          id_externo?: string
        }
        Relationships: []
      }
      radar_proposicoes: {
        Row: {
          ano: number | null
          atualizado_em: string
          autor: string | null
          autor_foto: string | null
          dados_json: Json | null
          ementa: string | null
          fonte: string
          id: string
          id_externo: string
          numero: number | null
          sigla_tipo: string | null
          situacao: string | null
          ultima_tramitacao: string | null
          url_inteiro_teor: string | null
        }
        Insert: {
          ano?: number | null
          atualizado_em?: string
          autor?: string | null
          autor_foto?: string | null
          dados_json?: Json | null
          ementa?: string | null
          fonte: string
          id?: string
          id_externo: string
          numero?: number | null
          sigla_tipo?: string | null
          situacao?: string | null
          ultima_tramitacao?: string | null
          url_inteiro_teor?: string | null
        }
        Update: {
          ano?: number | null
          atualizado_em?: string
          autor?: string | null
          autor_foto?: string | null
          dados_json?: Json | null
          ementa?: string | null
          fonte?: string
          id?: string
          id_externo?: string
          numero?: number | null
          sigla_tipo?: string | null
          situacao?: string | null
          ultima_tramitacao?: string | null
          url_inteiro_teor?: string | null
        }
        Relationships: []
      }
      radar_ranking: {
        Row: {
          ano: number | null
          atualizado_em: string | null
          deputado_id: number
          foto_url: string | null
          id: string
          nome: string | null
          presenca_percentual: number | null
          sigla_partido: string | null
          sigla_uf: string | null
          total_despesas: number | null
          total_discursos: number | null
          total_frentes: number | null
          total_orgaos: number | null
          total_proposicoes: number | null
        }
        Insert: {
          ano?: number | null
          atualizado_em?: string | null
          deputado_id: number
          foto_url?: string | null
          id?: string
          nome?: string | null
          presenca_percentual?: number | null
          sigla_partido?: string | null
          sigla_uf?: string | null
          total_despesas?: number | null
          total_discursos?: number | null
          total_frentes?: number | null
          total_orgaos?: number | null
          total_proposicoes?: number | null
        }
        Update: {
          ano?: number | null
          atualizado_em?: string | null
          deputado_id?: number
          foto_url?: string | null
          id?: string
          nome?: string | null
          presenca_percentual?: number | null
          sigla_partido?: string | null
          sigla_uf?: string | null
          total_despesas?: number | null
          total_discursos?: number | null
          total_frentes?: number | null
          total_orgaos?: number | null
          total_proposicoes?: number | null
        }
        Relationships: []
      }
      radar_senadores: {
        Row: {
          atualizado_em: string
          codigo: string
          dados_json: Json | null
          foto_url: string | null
          nome: string
          sigla_partido: string | null
          sigla_uf: string | null
        }
        Insert: {
          atualizado_em?: string
          codigo: string
          dados_json?: Json | null
          foto_url?: string | null
          nome: string
          sigla_partido?: string | null
          sigla_uf?: string | null
        }
        Update: {
          atualizado_em?: string
          codigo?: string
          dados_json?: Json | null
          foto_url?: string | null
          nome?: string
          sigla_partido?: string | null
          sigla_uf?: string | null
        }
        Relationships: []
      }
      radar_votacoes: {
        Row: {
          atualizado_em: string
          dados_json: Json | null
          data: string | null
          descricao: string | null
          fonte: string
          id: string
          id_externo: string
          resultado: string | null
        }
        Insert: {
          atualizado_em?: string
          dados_json?: Json | null
          data?: string | null
          descricao?: string | null
          fonte: string
          id?: string
          id_externo: string
          resultado?: string | null
        }
        Update: {
          atualizado_em?: string
          dados_json?: Json | null
          data?: string | null
          descricao?: string | null
          fonte?: string
          id?: string
          id_externo?: string
          resultado?: string | null
        }
        Relationships: []
      }
      resenha_diaria: {
        Row: {
          created_at: string | null
          data_dou: string
          data_publicacao: string
          ementa: string
          explicacao: string | null
          id: string
          numero_ato: string
          texto_completo: string | null
          tipo_ato: string
          url: string
        }
        Insert: {
          created_at?: string | null
          data_dou: string
          data_publicacao: string
          ementa: string
          explicacao?: string | null
          id?: string
          numero_ato: string
          texto_completo?: string | null
          tipo_ato: string
          url: string
        }
        Update: {
          created_at?: string | null
          data_dou?: string
          data_publicacao?: string
          ementa?: string
          explicacao?: string | null
          id?: string
          numero_ato?: string
          texto_completo?: string | null
          tipo_ato?: string
          url?: string
        }
        Relationships: []
      }
      simulado_process_logs: {
        Row: {
          created_at: string | null
          detalhe: string | null
          etapa: string
          id: string
          image_url: string | null
          questao_numero: number | null
          simulado_id: string
        }
        Insert: {
          created_at?: string | null
          detalhe?: string | null
          etapa: string
          id?: string
          image_url?: string | null
          questao_numero?: number | null
          simulado_id: string
        }
        Update: {
          created_at?: string | null
          detalhe?: string | null
          etapa?: string
          id?: string
          image_url?: string | null
          questao_numero?: number | null
          simulado_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "simulado_process_logs_simulado_id_fkey"
            columns: ["simulado_id"]
            isOneToOne: false
            referencedRelation: "simulados"
            referencedColumns: ["id"]
          },
        ]
      }
      simulado_questoes: {
        Row: {
          alternativa_a: string | null
          alternativa_b: string | null
          alternativa_c: string | null
          alternativa_d: string | null
          alternativa_e: string | null
          enunciado: string
          enunciado_pos_imagem: string | null
          gabarito: string
          id: string
          imagem_url: string | null
          materia: string | null
          numero: number
          ordem: number | null
          simulado_id: string
          texto_base: string | null
        }
        Insert: {
          alternativa_a?: string | null
          alternativa_b?: string | null
          alternativa_c?: string | null
          alternativa_d?: string | null
          alternativa_e?: string | null
          enunciado: string
          enunciado_pos_imagem?: string | null
          gabarito: string
          id?: string
          imagem_url?: string | null
          materia?: string | null
          numero: number
          ordem?: number | null
          simulado_id: string
          texto_base?: string | null
        }
        Update: {
          alternativa_a?: string | null
          alternativa_b?: string | null
          alternativa_c?: string | null
          alternativa_d?: string | null
          alternativa_e?: string | null
          enunciado?: string
          enunciado_pos_imagem?: string | null
          gabarito?: string
          id?: string
          imagem_url?: string | null
          materia?: string | null
          numero?: number
          ordem?: number | null
          simulado_id?: string
          texto_base?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "simulado_questoes_simulado_id_fkey"
            columns: ["simulado_id"]
            isOneToOne: false
            referencedRelation: "simulados"
            referencedColumns: ["id"]
          },
        ]
      }
      simulados: {
        Row: {
          ano: number | null
          banca: string | null
          created_at: string | null
          erro_detalhe: string | null
          gabarito_pdf_url: string | null
          id: string
          imagem_urls: Json | null
          ocr_gabarito_text: string | null
          ocr_prova_text: string | null
          orgao: string | null
          pdf_url: string | null
          questao_offset: number
          status: string
          tipo_prova: string | null
          titulo: string
          total_questoes: number | null
          user_id: string
        }
        Insert: {
          ano?: number | null
          banca?: string | null
          created_at?: string | null
          erro_detalhe?: string | null
          gabarito_pdf_url?: string | null
          id?: string
          imagem_urls?: Json | null
          ocr_gabarito_text?: string | null
          ocr_prova_text?: string | null
          orgao?: string | null
          pdf_url?: string | null
          questao_offset?: number
          status?: string
          tipo_prova?: string | null
          titulo: string
          total_questoes?: number | null
          user_id: string
        }
        Update: {
          ano?: number | null
          banca?: string | null
          created_at?: string | null
          erro_detalhe?: string | null
          gabarito_pdf_url?: string | null
          id?: string
          imagem_urls?: Json | null
          ocr_gabarito_text?: string | null
          ocr_prova_text?: string | null
          orgao?: string | null
          pdf_url?: string | null
          questao_offset?: number
          status?: string
          tipo_prova?: string | null
          titulo?: string
          total_questoes?: number | null
          user_id?: string
        }
        Relationships: []
      }
      study_answers: {
        Row: {
          created_at: string | null
          id: string
          is_correct: boolean
          question_index: number
          selected_answer: string
          session_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_correct?: boolean
          question_index: number
          selected_answer: string
          session_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_correct?: boolean
          question_index?: number
          selected_answer?: string
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "study_answers_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "study_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      study_flashcards: {
        Row: {
          artigo_numero: string
          cards: Json
          created_at: string | null
          id: string
          tabela_nome: string
        }
        Insert: {
          artigo_numero: string
          cards?: Json
          created_at?: string | null
          id?: string
          tabela_nome: string
        }
        Update: {
          artigo_numero?: string
          cards?: Json
          created_at?: string | null
          id?: string
          tabela_nome?: string
        }
        Relationships: []
      }
      study_questions: {
        Row: {
          artigo_numero: string
          created_at: string | null
          id: string
          questions: Json
          tabela_nome: string
        }
        Insert: {
          artigo_numero: string
          created_at?: string | null
          id?: string
          questions?: Json
          tabela_nome: string
        }
        Update: {
          artigo_numero?: string
          created_at?: string | null
          id?: string
          questions?: Json
          tabela_nome?: string
        }
        Relationships: []
      }
      study_sessions: {
        Row: {
          artigo_numero: string
          correct: number
          created_at: string | null
          id: string
          mode: string
          tabela_nome: string
          total: number
          user_id: string
        }
        Insert: {
          artigo_numero: string
          correct?: number
          created_at?: string | null
          id?: string
          mode: string
          tabela_nome: string
          total?: number
          user_id: string
        }
        Update: {
          artigo_numero?: string
          correct?: number
          created_at?: string | null
          id?: string
          mode?: string
          tabela_nome?: string
          total?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "study_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      sumulas: {
        Row: {
          created_at: string | null
          data_publicacao: string | null
          enunciado: string
          id: string
          numero: number
          ordem: number
          referencia: string | null
          situacao: string
          tribunal: string
        }
        Insert: {
          created_at?: string | null
          data_publicacao?: string | null
          enunciado?: string
          id?: string
          numero: number
          ordem?: number
          referencia?: string | null
          situacao?: string
          tribunal: string
        }
        Update: {
          created_at?: string | null
          data_publicacao?: string | null
          enunciado?: string
          id?: string
          numero?: number
          ordem?: number
          referencia?: string | null
          situacao?: string
          tribunal?: string
        }
        Relationships: []
      }
      user_activity_log: {
        Row: {
          current_route: string | null
          display_name: string | null
          email: string | null
          id: string
          last_seen_at: string
          user_id: string
        }
        Insert: {
          current_route?: string | null
          display_name?: string | null
          email?: string | null
          id?: string
          last_seen_at?: string
          user_id: string
        }
        Update: {
          current_route?: string | null
          display_name?: string | null
          email?: string | null
          id?: string
          last_seen_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_preferences: {
        Row: {
          favorites: Json | null
          highlights: Json | null
          id: string
          recents: Json | null
          theme_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          favorites?: Json | null
          highlights?: Json | null
          id?: string
          recents?: Json | null
          theme_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          favorites?: Json | null
          highlights?: Json | null
          id?: string
          recents?: Json | null
          theme_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      mv_ranking_semanal: {
        Row: {
          corretas: number | null
          pct: number | null
          questoes: number | null
          sessoes: number | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "study_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      v_leis_catalogo: {
        Row: {
          nome: string | null
          sigla: string | null
          tabela_nome: string | null
          tipo: string | null
          total_artigos: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      artigos_relacionados: {
        Args: { p_limit?: number; p_numero: string; p_tabela: string }
        Returns: {
          capitulo: string
          caput: string
          numero: string
          titulo: string
        }[]
      }
      buscar_artigos_global: {
        Args: { max_results?: number; search_query: string; tabelas?: string[] }
        Returns: Database["public"]["CompositeTypes"]["artigo_busca_result"][]
        SetofOptions: {
          from: "*"
          to: "artigo_busca_result"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      contar_cache_por_lei: {
        Args: { p_tabela: string }
        Returns: {
          artigo_numero: string
          modos_cached: string[]
        }[]
      }
      estatisticas_estudo: {
        Args: { p_user_id: string }
        Returns: Database["public"]["CompositeTypes"]["estudo_lei_stat"][]
        SetofOptions: {
          from: "*"
          to: "estudo_lei_stat"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      increment_geracao_erros: { Args: never; Returns: undefined }
      increment_geracao_processadas: { Args: never; Returns: undefined }
    }
    Enums: {
      tipo_legislacao:
        | "constituicao"
        | "codigo"
        | "estatuto"
        | "lei-ordinaria"
        | "decreto"
        | "sumula"
    }
    CompositeTypes: {
      artigo_busca_result: {
        numero: string | null
        caput: string | null
        tabela_nome: string | null
        rank: number | null
      }
      estudo_lei_stat: {
        tabela_nome: string | null
        total_questoes: number | null
        total_corretas: number | null
        total_sessoes: number | null
        pct_acerto: number | null
      }
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      tipo_legislacao: [
        "constituicao",
        "codigo",
        "estatuto",
        "lei-ordinaria",
        "decreto",
        "sumula",
      ],
    },
  },
} as const
