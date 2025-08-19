# Sendly NFT Gift Card dApp

Децентрализованное приложение для создания и управления NFT подарочными картами на сети Base.

## 🚀 Быстрый старт

### Предварительные требования

- Node.js 18+ 
- npm или yarn
- Браузер с поддержкой Web3 (MetaMask, WalletConnect и т.д.)

### Установка

1. Клонируйте репозиторий:
```bash
git clone <repository-url>
cd sendly-nft-gift-card-dapp
```

2. Установите зависимости:
```bash
npm install
```

3. Запустите сервер разработки:
```bash
npm run dev
```

4. Откройте браузер и перейдите по адресу: `http://localhost:5173`

## 🔧 Конфигурация

### Для продакшена (опционально)

Для полной функциональности с WalletConnect, создайте файл `.env` в корне проекта:

```env
# WalletConnect Cloud Project ID
# Получите бесплатный projectId на https://cloud.walletconnect.com/
VITE_WALLET_CONNECT_PROJECT_ID=your_project_id_here

# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

### Настройка WalletConnect

1. Перейдите на [WalletConnect Cloud](https://cloud.walletconnect.com/)
2. Создайте новый проект
3. Скопируйте Project ID
4. Добавьте его в переменную окружения `VITE_WALLET_CONNECT_PROJECT_ID`

## 🛠️ Технологии

- **Frontend**: React 18, TypeScript, Vite
- **UI**: Tailwind CSS, Radix UI, Lucide React
- **Web3**: Wagmi, Viem
- **Блокчейн**: Base Network (Ethereum L2)
- **База данных**: Supabase (опционально)

## 📁 Структура проекта

```
├── components/          # React компоненты
│   ├── ui/             # UI компоненты (Radix UI)
│   ├── CreateGiftCard.tsx
│   ├── MyCards.tsx
│   ├── SpendCard.tsx
│   └── WalletConnect.tsx
├── contracts/          # Смарт-контракты
├── utils/             # Утилиты
│   ├── web3/          # Web3 конфигурация
│   └── supabase/      # Supabase клиент
├── styles/            # CSS стили
└── src/               # Исходный код
```

## 🔗 Поддерживаемые кошельки

- MetaMask
- Injected wallets (Brave, Opera и др.)
- WalletConnect (при настройке projectId)

## 🌐 Сеть

Приложение работает на сети **Base** (Ethereum L2 от Coinbase).

## 📝 Лицензия

MIT License

## 🤝 Вклад в проект

1. Форкните репозиторий
2. Создайте ветку для новой функции
3. Внесите изменения
4. Создайте Pull Request

## 🆘 Поддержка

Если у вас возникли проблемы:

1. Проверьте, что у вас установлена последняя версия Node.js
2. Убедитесь, что все зависимости установлены
3. Проверьте консоль браузера на наличие ошибок
4. Создайте Issue в репозитории 