import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import Backend from 'i18next-http-backend';

i18n
  .use(Backend)
  .use(initReactI18next)
  .init({
    lng: 'ru', // язык по умолчанию
    fallbackLng: 'ru',
    debug: true, // временно включите для отладки
    ns: ['common', 'profile', 'places', 'news', 'placeNewsDetail'], // явно укажите namespace'ы
    defaultNS: 'common',
    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json',
      crossDomain: true // если API на другом домене
    },
    interpolation: {
      escapeValue: false,
    }
  });

export default i18n;