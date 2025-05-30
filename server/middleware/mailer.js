const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

exports.sendPlaceApprovalEmail = async (to, placeName, placeId, adminComment) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to,
    subject: `Ваше место "${placeName}" было одобрено`,
    html: `
      <h1>Поздравляем!</h1>
      <p>Ваше предложение места <strong>${placeName}</strong> было одобрено модератором.</p>
      ${adminComment ? `<p>Комментарий модератора: ${adminComment}</p>` : ''}
      <p>Теперь оно доступно для просмотра всем пользователям: 
        <a href="http://localhost:3000/places/${placeId}">Перейти к месту</a>
      </p>
    `,
  };

  await transporter.sendMail(mailOptions);
};

exports.sendPlaceRejectionEmail = async (to, placeName, adminComment) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to,
    subject: `Ваше место "${placeName}" не было одобрено`,
    html: `
      <h1>К сожалению...</h1>
      <p>Ваше предложение места <strong>${placeName}</strong> не прошло модерацию.</p>
      ${adminComment ? `<p>Комментарий модератора: ${adminComment}</p>` : ''}
      <p>Вы можете предложить другое место, соблюдая правила нашего сервиса.</p>
    `,
  };

  await transporter.sendMail(mailOptions);
};