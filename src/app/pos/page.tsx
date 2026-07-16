// Envoltorio del POS. La logica interactiva vive en POSClient.
import POSClient from './POSClient';
export const dynamic = 'force-dynamic';
export default function POSPage() {
  return <POSClient />;
}
