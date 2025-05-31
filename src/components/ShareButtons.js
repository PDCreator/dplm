import {
  FacebookShareButton,
  TwitterShareButton,
  VKShareButton,
  TelegramShareButton,
  WhatsappShareButton,
  FacebookIcon,
  TwitterIcon,
  VKIcon,
  TelegramIcon,
  WhatsappIcon
} from 'react-share';
import '../styles/ShareButtons.css';

function ShareButtons({ url, title, description }) {
  return (
    <div className="share-buttons">
      <VKShareButton
        url={url}
        title={title}
        description={description}
        className="share-button"
      >
        <VKIcon size={32} round />
      </VKShareButton>
      
      <TelegramShareButton
        url={url}
        title={title}
        className="share-button"
      >
        <TelegramIcon size={32} round />
      </TelegramShareButton>
      
      <WhatsappShareButton
        url={url}
        title={title}
        className="share-button"
      >
        <WhatsappIcon size={32} round />
      </WhatsappShareButton>
    </div>
  );
}

export default ShareButtons;