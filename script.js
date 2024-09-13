const express = require('express');
const { Telegraf } = require('telegraf');
const app = express();
const bodyParser = require('body-parser');

app.use(bodyParser.json());
app.use(express.static('public')); // Для статических файлов (картинки и CSS)

let users = {}; // Простая база данных (в памяти)
let referralLinks = {};
let tasks = [
    { id: 1, name: 'Задание 1', reward: 3, link: 'https://t.me/Ric_GOLD' },
    { id: 2, name: 'Задание 2', reward: 3, link: 'https://t.me/RIC_GOLDA' },
];

// Токен вашего Telegram бота
const BOT_TOKEN = '7492648311:AAG4nat37QOC4zLdTGP-BuAzOh-Vq809s1M';
const bot = new Telegraf(BOT_TOKEN);

// Генерация уникальной реферальной ссылки
function generateReferralLink(userId) {
    const referralCode = `${userId}_${Math.random().toString(36).substring(7)}`;
    referralLinks[referralCode] = userId; // Привязываем код к пользователю
    return `https://tgfrixi1337.github.io/so2click/referral/${referralCode}`;
}

// API для создания реферальной ссылки на сайте
app.get('/generate-referral/:userId', (req, res) => {
    const userId = req.params.userId;

    if (!users[userId]) {
        users[userId] = { balance: 0, referrals: [] }; // Создаем пользователя
    }

    const referralLink = generateReferralLink(userId);
    res.json({ referralLink }); // Возвращаем ссылку клиенту
});

// API для обработки переходов по реферальным ссылкам
app.get('/referral/:referralCode', (req, res) => {
    const referralCode = req.params.referralCode;

    if (referralLinks[referralCode]) {
        const referrerId = referralLinks[referralCode];
        users[referrerId].referrals.push(Date.now()); // Записываем нового реферала
        users[referrerId].balance += 5; // Начисляем 5 монет за реферала
        res.send('Реферал учтен, начислено 5 монет.');
    } else {
        res.status(404).send('Реферальная ссылка недействительна.');
    }
});

// Логика для начисления монет при нажатии на картинку
app.post('/add-coins/:userId', (req, res) => {
    const userId = req.params.userId;

    if (users[userId]) {
        users[userId].balance += 0.001; // Начисляем 0.001 монет
        res.json({ balance: users[userId].balance });
    } else {
        res.status(404).json({ error: 'Пользователь не найден.' });
    }
});

// Логика для обработки задания (начисляем монеты за выполнение)
app.get('/task/:taskId/:userId', (req, res) => {
    const { taskId, userId } = req.params;
    const task = tasks.find(t => t.id == taskId);

    if (task) {
        if (!users[userId]) {
            users[userId] = { balance: 0, referrals: [], tasksCompleted: [] };
        }

        if (!users[userId].tasksCompleted.includes(taskId)) {
            users[userId].tasksCompleted.push(taskId);
            users[userId].balance += task.reward; // Начисляем награду за задание
        }

        res.redirect(task.link); // Перенаправляем на ссылку задания
    } else {
        res.status(404).send('Задание не найдено.');
    }
});

// Telegram бот

bot.start((ctx) => {
    const userId = ctx.from.id;

    if (!users[userId]) {
        users[userId] = { balance: 0, referrals: [], tasksCompleted: [] }; // Регистрируем нового пользователя
    }

    // Генерируем реферальную ссылку через сайт
    const referralLink = generateReferralLink(userId);

    // Отправляем пользователю его уникальную ссылку
    ctx.reply(`Привет! Вот твоя реферальная ссылка: ${referralLink}\nПриглашай друзей и зарабатывай монеты!`);
});

// Команда для проверки баланса и количества рефералов
bot.command('balance', (ctx) => {
    const userId = ctx.from.id;

    if (users[userId]) {
        const balance = users[userId].balance;
        const referralsCount = users[userId].referrals.length;
        ctx.reply(`Ваш баланс: ${balance} монет. Вы пригласили ${referralsCount} рефералов.`);
    } else {
        ctx.reply('Вы еще не зарегистрированы. Используйте /start для начала.');
    }
});

bot.launch(); // Запускаем бота

// Запуск сервера
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Сервер запущен на порту ${PORT}`);
});
