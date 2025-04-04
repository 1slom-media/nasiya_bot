const messagesUz = {
  start: "Ассалому алайкум! Тилни танланг.",
  welcome: "Ботга хуш келибсиз! Ботдан фойдаланиш учун рўйхатдан ўтинг.",
  changeLanguage: "Тилни ўзгартириш учун тугмани босинг.",
  sendQuestion: "Мурожаат юбориш",
  allQuestion: "Мурожаатларим",
  checkQuestion: "Мурожаатни текшириш",
  faq: "FAQ",
  service: "Хизматларимиз:",
  register: "Рўйхатдан ўтиш",
  username: "Илтимос, исмингизни киритинг:",
  surname: "Энди, фамилиянгизни киритинг:",
  phone: "Телефон рақам",
  phoneApprove: "Телефон рақамингизни қуйидаги тугмани босиш орқали жўнатинг!",
  error: "Хатолик юз берди, қайта уриниб кўринг.",
  saveUser: "Раҳмат! Маълумотларингиз қабул қилинди ва сақланди.",
  back: "Орқага",
  selectQuestion: "Саволни танланг:",
  faqError: "Кечирасиз, бу саволга жавоб топилмади.",
  answer: "Жавоб:",
  writeQuestion: "Илтимос, мурожаатингизни ёзинг:",
  registerError: "Сиз рўйхатдан ўтмаган экансиз.",
  successQuestion: "Мурожаатингиз муваффақиятли юборилди!",
  askId: "Илтимос, текширмоқчи бўлган мурожаат ID рақамини киритинг:",
  notFound: "Бундай ID рақамли мурожаат топилмади ёки сизга тегишли эмас.",
  technical: "Техник",
  business: "Бизнес",
  other: "Бошқа",
  type: "Мурожаатингиз турини танланг:",
  viewReq: "Мурожаатни кўриш",
  sendMes: "Хабар юбориш",
  0: "Мурожаат:",
  1: "Статус:",
  2: "Сизнинг барча мурожаатларингиз",
  3: "Сизда ҳеч қандай мурожаат йўқ.",
  4: "Янги мурожаат:",
  5: "Мурожаатчи:",
  6: "Алоқа учун:",
  7: "Мерчант:",
  8: "Вақти:",
  9: "Хабрни киритинг: ",
  10: "Хабар юборилди: ",
  11: "Заяфка Ид ни киритинг: ",
  12: "Кодни киритинг: ",
  13:"мерчант номи",
  14:"мерчант чат Ид : -10000000",
  15:"мерчант аллгоод Ид",
  16:"Мерчант муваффақиятли қўшилди!",
  sendSMS: "Переотправка СМС- кода",
  verifySMS: "Подтверждение СМС-кода",
  merchant:"мерчант қўшиш"
};

const messagesRu = {
  start: "Здравствуйте! Выберите язык.",
  welcome:
    "Добро пожаловать в бот! Зарегистрируйтесь, чтобы использовать бота.",
  changeLanguage: "Нажмите кнопку для смены языка.",
  sendQuestion: "Отправить заявку",
  allQuestion: "Мои запросы",
  checkQuestion: "Проверить запрос",
  faq: "Часто задаваемые вопросы",
  service: "Наши услуги:",
  register: "Зарегистрироваться",
  username: "Пожалуйста, введите ваше имя:",
  surname: "Теперь введите вашу фамилию:",
  phone: "Номер телефона",
  phoneApprove:
    "Пожалуйста, отправьте свой номер телефона, нажав на кнопку ниже!",
  error: "Произошла ошибка, попробуйте снова.",
  saveUser: "Спасибо! Ваши данные были приняты и сохранены.",
  back: "Назад",
  selectQuestion: "Выберите вопрос:",
  faqError: "Извините, ответ на этот вопрос не найден.",
  answer: "Ответ:",
  writeQuestion: "Пожалуйста, напишите Ваш запрос:",
  registerError: "Вы не зарегистрированы.",
  successQuestion: "Ваш запрос успешно отправлен!",
  askId: "Пожалуйста, введите ID обращения, которое хотите проверить:",
  notFound: "Обращение с таким ID не найдено или оно не принадлежит вам.",
  technical: "Техник",
  business: "Бизнес",
  other: "Другой",
  type: "Выберите тип вашего запрос:",
  sendMes: "Отправить сообщение",
  0: "Запрос:",
  1: "Статус:",
  2: "Ваши все запросы",
  3: "У вас нет запросов.",
  4: "Новый запрос:",
  5: "Отправитель:",
  6: "Контактный номер:",
  7: "Мерчант:",
  8: "Время:",
  9: "Введите сообщение: ",
  10: "Сообщение отправлено: ",
  11: "Введите Заяфка Ид: ",
  12: "Введите код: ",
  13:"имя мерчант",
  14:"мерчант чат Ид :-10000000",
  15:"мерчант аллгоод Ид",
  16:"Мерчант успешно добавлен!",
  sendSMS: "Переотправка СМС- кода",
  verifySMS: "Подтверждение СМС-кода",
  merchant:"добавить мерчант"
};

const statuses = {
  0: "Ko'rildi",
  1: "Просмотрено",
};

const state = {
  success: "Оформлено",
  bank: "Ошибка банка",
  test: "Тест",
  debt: "Задолженность",
  card: "Карта на 18/24",
  two: "Дубль",
  datareject: "Дата оплаты не подходит",
  limit: "Недостаточно Лимита",
  reject: "Клиент отказался",
  drp: "Другой партнер",
};

export { messagesUz, messagesRu, statuses, state };
