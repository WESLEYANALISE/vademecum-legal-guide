import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import AtualizacaoTab from '@/components/vademecum/AtualizacaoTab';

const Aprender = () => {
  const navigate = useNavigate();
  const [searchQuery] = useState('');

  return (
    <div className="min-h-screen bg-background pb-20 lg:pb-0">
      <div className="bg-gradient-to-br from-indigo-500/90 to-indigo-700/80 px-4 pt-10 pb-6 sm:px-6 md:px-8">
        <div className="max-w-5xl mx-auto">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 bg-white/15 hover:bg-white/25 backdrop-blur-sm text-white font-medium transition-all text-sm px-3 py-1.5 rounded-lg mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </button>
          <h1 className="font-display text-2xl text-white font-bold">Aprender</h1>
          <p className="text-white/70 text-sm">Artigos educacionais e conteúdo jurídico</p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 md:px-8 py-6">
        <AtualizacaoTab searchQuery={searchQuery} />
      </div>
    </div>
  );
};

export default Aprender;
