import { assetUrl } from '../utils/assetUrl';

export default function Logo() {
  return (
    <img
      src={assetUrl('logo.png')}
      alt="G.CREATER"
      draggable={false}
    />
  );
}
