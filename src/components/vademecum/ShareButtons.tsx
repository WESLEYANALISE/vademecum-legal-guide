import { WhatsappShareButton, TelegramShareButton, WhatsappIcon, TelegramIcon } from 'react-share';

interface ShareButtonsProps {
  artigoNumero: string;
  artigoTexto: string;
  leiNome?: string;
}

const ShareButtons = ({ artigoNumero, artigoTexto, leiNome }: ShareButtonsProps) => {
  const text = `Art. ${artigoNumero}${leiNome ? ` do ${leiNome}` : ''}\n\n${artigoTexto.slice(0, 300)}${artigoTexto.length > 300 ? '…' : ''}\n\nvia Vacatio - Vade Mecum`;
  const url = window.location.href;

  return (
    <div className="flex items-center gap-2">
      <WhatsappShareButton url={url} title={text}>
        <WhatsappIcon size={32} round />
      </WhatsappShareButton>
      <TelegramShareButton url={url} title={text}>
        <TelegramIcon size={32} round />
      </TelegramShareButton>
    </div>
  );
};

export default ShareButtons;
