import BibliotecaView from '@/components/estudar/BibliotecaView';
import { useNavigate } from 'react-router-dom';

export default function BibliotecaAdmin() {
  const navigate = useNavigate();
  return <BibliotecaView onBack={() => navigate(-1)} />;
}
