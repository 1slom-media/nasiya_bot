CREATE TABLE users(
    id serial primary key,
    first_name varchar(20),
    last_name varchar (20),
    phone_number varchar(25),
    tg_name varchar(50),
    chat_id varchar(50),
    role default ('merchant')
);

CREATE TABLE faq(
    id serial primary key,
    question text,
    answer text,
    lang text
);

CREATE TABLE admin_messages(
    id serial primary key,
    first_name text,
    message text,
    tg_name text
);

CREATE TABLE requests(
    id serial primary key,
    chat_id text,
    request_text text,
    response_text text,
    merchant text,
    date timestamp default current_timestamp,
    status_uz text,
    status_ru text,
    message_id text,
    first_name varchar(30),
    last_name varchar (30),
    username varchar (30)
);

CREATE TABLE merchants_bot(
    id serial primary key,
    merchant_id int,
    group_id bigint,
    merchant_name text
);

CREATE TABLE bot_applications(
    id serial primary key,
    application_id int,
    status text default 'new',
    CONSTRAINT unique_application_id UNIQUE (application_id)
);

ALTER TABLE
    bot_applications
ADD
    COLUMN created_at TIMESTAMP;

ALTER TABLE
    bot_applications
ALTER COLUMN
    created_at
SET
    DEFAULT CURRENT_TIMESTAMP;

CREATE TABLE limit_applications(
    id serial primary key,
    application_id int,
    status text default 'new',
    limit
        numeric, anor_limit numeric, davr_limit varchar, provider text, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT unique_application_id UNIQUE (application_id)
);

ALTER TABLE
    limit_applications
ADD
    COLUMN "user" text DEFAULT '0' NOT NULL;

-- 13.03 limit_app alter
ALTER TABLE
    limit_applications
ADD
    COLUMN manager TEXT;

ALTER TABLE
    limit_applications
ADD
    COLUMN partner TEXT;

ALTER TABLE
    limit_applications
ADD
    COLUMN limit_status TEXT;

ALTER TABLE public.limit_applications 
ALTER COLUMN total_sum SET DEFAULT 0,
ALTER COLUMN total_sum SET NOT NULL;

ALTER TABLE
    limit_applications
ADD
    COLUMN product TEXT;

ALTER TABLE
    limit_applications
ADD
    COLUMN period VARCHAR;

ALTER TABLE
    limit_applications
ADD
    COLUMN phone VARCHAR;

ALTER TABLE
    limit_applications
ADD
    COLUMN merchant TEXT DEFAULT '',
ADD
    COLUMN branch TEXT DEFAULT '',
ADD
    COLUMN product_price NUMERIC DEFAULT 0;

ALTER TABLE
    limit_applications
ADD
    COLUMN fio TEXT DEFAULT '';
ALTER TABLE limit_applications ADD COLUMN success BOOLEAN DEFAULT FALSE;
ALTER TABLE limit_applications ADD COLUMN graph BOOLEAN DEFAULT FALSE;
-- insert admin
INSERT INTO
    users(
        first_name,
        last_name,
        phone_number,
        tg_name,
        chat_id,
        role
    )
VALUES
    (
        'Shukurjonov',
        'Muhammad',
        '998940163313',
        '@mshukurjonov',
        '225122655',
        'admin'
    );

-- insert faq uz
INSERT INTO
    faq (question, answer, lang)
VALUES
    (
        'Allgood Насия билан ҳамкор бўълиш учун қандай мурожаат қилиш мумкин?',
        'Агар сиз ҳамкор бўлишни ва Allgood Насия ҳақида батафсил маълумот олишни истасангиз, биз билан +998 55 520 90 90 рақамига қўнғироқ қилиб, расмий сайтида allgoodnasiya.uz со''ров қолдиришингиз ёки телеграмда @nasiyahamkor билан боғланишингиз мумкин.',
        'uz'
    ),
    (
        'Тўловларни муддатли сотиш учун ёш чекловлари борми?',
        'Ҳа, мижознинг ёши 21 дан 65 ёшгача бўлиши керак.',
        'uz'
    ),
    (
        'Рўйхатдан ўтиш учун қандай карталар керак?',
        'Allgood Насия тизими Ўзбекистоннинг барча банк карталарини, корпоратив карталар, шунингдек, Visa, MasterCard ва бошқа халқаро карталарни қабул қилади.',
        'uz'
    ),
    (
        'Сотилган маҳсулотлар учун тўлов қанча вақт ичида келади?',
        'Allgood Насия тизими орқали сотилган маҳсулотлар учун тўлов 3 банк куни ичида амалга оширилади.',
        'uz'
    ),
    (
        'Янги картани тизимга қўшиш мумкинми?',
        'Киритилган карта охирги 4 ой давомида фаол бўлиши ва охирги 3 ой ичида 1.000.000 сўмдан ортиқ келиб тушган бўлиши керак.',
        'uz'
    ),
    (
        'Мижоздан ҳужжатлар талаб қилинадими?',
        'Мижозни рўйхатдан ўтказиш учун банк картаси маълумотлари, шунингдек, мижознинг паспорт маълумотлари талаб қилинади.',
        'uz'
    ),
    (
        'Мижоз расмий ишда бўлиши шартми?',
        'Расмий ишда бўлиши шарт эмас. Охирги 4 ой ичида фаол карта ва охирги 3 ойда 1.000.000 сўмдан ортиқ келиб тушиши кифоя.',
        'uz'
    ),
    (
        'Мижозни скoring қилиш учун қанча вақт керак бўлади?',
        'Ўртача, жараён 3-5 дақиқа давом этади.',
        'uz'
    ),
    (
        'Қўшимча маълумот олиш учун мижоз қаерга мурожаат қилиши керак?',
        'Мижозлар ўз саволларига батафсил жавобларни +998 93 267 44 55 рақамига қўнғироқ қилиб олишлари мумкин.',
        'uz'
    ),
    (
        'Мижозларни рўйхатга олиш қандай жадвалда амалга оширилади?',
        'Мижозларни рўйхатга олиш ҳар куни 9:00 дан 22:00 гача амалга оширилади.',
        'uz'
    ),
    (
        'Ҳарбий хизmatchиларни рўйхатдан ўтказиш мумкинми?',
        'Ҳа, мумкин.',
        'uz'
    ),
    (
        'Шахсий кабинет паролини ўзгартириш мумкинми?',
        'Ҳа, асосий менеджерингизга мурожаат қилсангиз бўлади.',
        'uz'
    ),
    (
        'Мижознинг муддатли тўловлари қачон ечиб олинади?',
        'Автоматик ечиб олиш кейинги ойнинг 15-куни амалга оширилади, агар мавжуд бўлса.',
        'uz'
    ),
    (
        'Муддатли тўлов тизими нималар?',
        'Муддатли тўлов тизими мижозларга товар ёки хизматларни 3, 6 ёки 12 ой давомида тенг тўловлар билан тўлаш имконини берувчи дастурдир.',
        'uz'
    ),
    (
        'Минимал ва максимал лимит қанча?',
        'Турли мижозлар учун лимит 500.000 сўмдан бошланади ва мижознинг даромади ва карта айланмасига қараб 50.000.000 сўмгача бўлиши мумкин.',
        'uz'
    ),
    (
        'Мижоз муддатли тўловни олдиндан тўлаши мумкинми?',
        'Ҳа, бу Anorbank мобил илова орқали амалга оширилиши мумкин. Мижоз ўз шахсий кабинетига кириб, "Расрочка" бўлимига ўтиб, "Тўлаш" тугмасини босиб, муддатли тўловни олдиндан тўлаши мумкин.',
        'uz'
    ),
    (
        'Тўлов жадвали ва ойлик тўлов суммасига қаерда кўриш мумкин?',
        'Тўлов жадвали ва ойлик тўлов суммаси ҳақида маълумот олиш учун Allgood Насия мобил иловаининг "Аризалар" бўлимида керакли шартномани танланг ва тўлов жадвалини кўринг. Шунингдек, +998 55 520 90 90 рақамига қўнғироқ қилиб, қўшимча маълумот олишингиз мумкин.',
        'uz'
    );

--   insert faq ru
INSERT INTO
    faq (question, answer, lang)
VALUES
    (
        'Как можно стать партнером Allgood Nasiya?',
        'Если вы хотите стать партнером и получить подробную информацию о Allgood Nasiya, свяжитесь с нами через контактный центр по телефону 55 520 90 90, оставьте заявку на официальном сайте allgoodnasiya.uz или напишите нам в телеграм @nasiyahamkor.',
        'ru'
    ),
    (
        'Есть ли ограничения по возрасту для оформления рассрочки?',
        'Да, для успешной регистрации клиента его возраст должен быть от 21 до 65 лет.',
        'ru'
    ),
    (
        'Какие карты нужны для прохождения регистрации?',
        'Система Allgood Nasiya принимает карты всех банков Узбекистана, кроме корпоративных, а также карт Visa, MasterCard и других международных систем.',
        'ru'
    ),
    (
        'Через какое время поступает оплата за проданные товары?',
        'Оплата за товары, проданные через систему Allgood Nasiya, будет зачислена в течение 3 банковских дней.',
        'ru'
    ),
    (
        'Можно ли добавить новую карту в систему?',
        'Подключаемая карта должна быть активной за последние 4 месяца и иметь поступления более 1 000 000 сум за последние 3 месяца.',
        'ru'
    ),
    (
        'Необходимо ли клиенту иметь при себе какие-либо документы?',
        'При регистрации клиента, необходимы данные банковской карты, а также паспортные данные клиента.',
        'ru'
    ),
    (
        'Должен ли клиент быть официально трудоустроенным?',
        'Официальное трудоустройство не обязательно. Достаточно иметь активную карту за последние 4 месяца и поступления свыше 1 000 000 сум за последние 3 месяца.',
        'ru'
    ),
    (
        'Сколько времени уходит на скоринг клиента?',
        'В среднем, процесс занимает 3-5 минут.',
        'ru'
    ),
    (
        'Куда клиенту обратиться для получения дополнительной информации?',
        'Клиенты могут получить подробные ответы на свои вопросы, обратившись по номеру +998 93 267 44 55.',
        'ru'
    ),
    (
        'В каком графике проводится регистрация клиентов?',
        'Регистрация клиентов в нашей системе доступна ежедневно с 9:00 до 22:00.',
        'ru'
    ),
    (
        'Можно ли зарегистрировать военнослужащих?',
        'Да, можно.',
        'ru'
    ),
    (
        'Можно ли изменить пароль от личного кабинета?',
        'Да, можно обратившись к своему ключевому менеджеру.',
        'ru'
    ),
    (
        'Какого числа осуществляется списание суммы за рассрочку у клиента?',
        'Автосписание осуществляется 15-го числа следующего месяца, и в дальнейшем.',
        'ru'
    ),
    (
        'Что такое система рассрочки?',
        'Система рассрочки представляет собой программу, которая дает покупателям возможность оплачивать товары или услуги равными платежами в течение 3, 6 или 12 месяцев.',
        'ru'
    ),
    (
        'Какой минимальный и максимальный лимит выдается по рассрочке?',
        'Лимит для разных клиентов начинается от 500.000 сум и до 50.000.000 сум в зависимости от доходов и оборотов на карте клиента.',
        'ru'
    ),
    (
        'Можно ли клиенту досрочно выплатить свою рассрочку?',
        'Да, это возможно через мобильное приложение Anorbank. Клиент может досрочно погасить рассрочку войдя в свой личный кабинет и перейдя в раздел "Рассрочка" и нажав на кнопку "Погашение".',
        'ru'
    ),
    (
        'Где можно ознакомиться с графиком платежей и суммой ежемесячной оплаты?',
        'Вы можете найти информацию в мобильном приложении Allgood Nasiya в разделе "Заявки". Выберите нужный договор и просмотрите соответствующий график платежей. Также можно обратиться в наш контактный центр по номеру +998 55 520 90 90.',
        'ru'
    );

-- insert merchants
INSERT INTO
    merchants_bot (merchant_id, merchant_name, group_id)
VALUES
    (374, 'MCHJ  "OMADLI SHUKRONA" MCHJ', -4551479181);