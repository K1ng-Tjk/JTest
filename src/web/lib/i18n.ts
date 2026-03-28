export type Lang = "ru" | "tj" | "en";

const translations: Record<string, Record<Lang, string>> = {
  // Auth
  "auth.login": { ru: "Войти", tj: "Даромадан", en: "Login" },
  "auth.register": { ru: "Регистрация", tj: "Сабти ном", en: "Register" },
  "auth.phone": { ru: "Номер телефона", tj: "Рақами телефон", en: "Phone number" },
  "auth.password": { ru: "Пароль", tj: "Парол", en: "Password" },
  "auth.firstName": { ru: "Имя", tj: "Ном", en: "First name" },
  "auth.lastName": { ru: "Фамилия", tj: "Насаб", en: "Last name" },
  "auth.middleName": { ru: "Отчество", tj: "Номи падар", en: "Middle name" },
  "auth.gender": { ru: "Пол", tj: "Ҷинс", en: "Gender" },
  "auth.male": { ru: "Мужской", tj: "Мард", en: "Male" },
  "auth.female": { ru: "Женский", tj: "Зан", en: "Female" },
  "auth.birthDate": { ru: "Дата рождения", tj: "Санаи таввалуд", en: "Birth date" },
  "auth.email": { ru: "Email (по желанию)", tj: "Почта (ихтиёрӣ)", en: "Email (optional)" },
  "auth.noAccount": { ru: "Нет аккаунта? Зарегистрироваться", tj: "Аккаунт надоред? Бақайд гиред", en: "No account? Register" },
  "auth.hasAccount": { ru: "Уже есть аккаунт? Войти", tj: "Аккаунт доред? Даромадед", en: "Have account? Login" },
  "auth.phoneHint": { ru: "Номер должен начинаться с +992", tj: "Рақам бояд аз +992 оғоз ёбад", en: "Number must start with +992" },

  // Nav
  "nav.home": { ru: "Главная", tj: "Асосӣ", en: "Home" },
  "nav.training": { ru: "Тренировка", tj: "Машқ", en: "Training" },
  "nav.rating": { ru: "Рейтинг", tj: "Рейтинг", en: "Rating" },
  "nav.exam": { ru: "Экзамен", tj: "Имтиҳон", en: "Exam" },
  "nav.chat": { ru: "Чаты", tj: "Суҳбат", en: "Chats" },
  "nav.profile": { ru: "Профиль", tj: "Профил", en: "Profile" },

  // Home
  "home.welcome": { ru: "Добро пожаловать", tj: "Хуш омадед", en: "Welcome" },
  "home.totalTests": { ru: "Всего тестов", tj: "Ҳамаги тестҳо", en: "Total tests" },
  "home.completed": { ru: "Пройдено", tj: "Гузаштааст", en: "Completed" },
  "home.avgScore": { ru: "Средний балл", tj: "Миёнаи хол", en: "Avg score" },
  "home.startTraining": { ru: "Начать тренировку", tj: "Машқро оғоз кунед", en: "Start training" },
  "home.myTests": { ru: "Мои тесты", tj: "Тестҳои ман", en: "My tests" },
  "home.sharedTests": { ru: "Общие тесты", tj: "Тестҳои умумӣ", en: "Shared tests" },

  // Tests
  "tests.create": { ru: "Создать тест", tj: "Тест сохтан", en: "Create test" },
  "tests.import": { ru: "Импорт тестов", tj: "Импорти тестҳо", en: "Import tests" },
  "tests.edit": { ru: "Редактировать", tj: "Таҳрир кардан", en: "Edit" },
  "tests.delete": { ru: "Удалить", tj: "Нест кардан", en: "Delete" },
  "tests.start": { ru: "Начать", tj: "Оғоз кардан", en: "Start" },
  "tests.questions": { ru: "вопросов", tj: "савол", en: "questions" },
  "tests.single": { ru: "Один ответ", tj: "Як ҷавоб", en: "Single answer" },
  "tests.multiple": { ru: "Несколько ответов", tj: "Якчанд ҷавоб", en: "Multiple answers" },
  "tests.pending": { ru: "На проверке", tj: "Дар тафтиш", en: "Pending" },
  "tests.approved": { ru: "Одобрен", tj: "Тасдиқшуда", en: "Approved" },
  "tests.rejected": { ru: "Отклонён", tj: "Рад шуда", en: "Rejected" },
  "tests.personal": { ru: "Личный", tj: "Шахсӣ", en: "Personal" },
  "tests.shared": { ru: "Общий", tj: "Умумӣ", en: "Shared" },
  "tests.noTests": { ru: "Нет тестов", tj: "Тестҳо нест", en: "No tests" },
  "tests.timeLimit": { ru: "Ограничение времени (мин)", tj: "Маҳдудияти вақт (дақ)", en: "Time limit (min)" },
  "tests.passingScore": { ru: "Проходной балл (%)", tj: "Холи гузаштан (%)", en: "Passing score (%)" },

  // Import
  "import.title": { ru: "Импорт тестов", tj: "Импорти тестҳо", en: "Import tests" },
  "import.method1": { ru: "Авто-разбивка", tj: "Авто-ҷудокунӣ", en: "Auto parse" },
  "import.method2": { ru: "Ручная настройка", tj: "Дастӣ танзим кардан", en: "Manual setup" },
  "import.method1desc": { ru: "Одноответные автоматически. Многоответные по маркерам а1 б2 с3 д4", tj: "Якҷавобаҳо автоматӣ. Бисёрҷавобаҳо тавассути нишонаҳо", en: "Single auto. Multiple by markers a1 b2 c3 d4" },
  "import.method2desc": { ru: "Сам выбираешь тип каждого вопроса вручную", tj: "Худатон навъи ҳар саволро интихоб мекунед", en: "Manually choose type for each question" },
  "import.dropFile": { ru: "Перетащи файл или нажми", tj: "Файлро кашед ё пахш кунед", en: "Drop file or click" },
  "import.formats": { ru: "PDF, DOCX, TXT до 25 МБ", tj: "PDF, DOCX, TXT то 25 МБ", en: "PDF, DOCX, TXT up to 25MB" },
  "import.preview": { ru: "Предпросмотр", tj: "Пешнамоиш", en: "Preview" },
  "import.save": { ru: "Сохранить тест", tj: "Тестро захира кунед", en: "Save test" },

  // Chat
  "chat.general": { ru: "Общий чат", tj: "Чати умумӣ", en: "General chat" },
  "chat.private": { ru: "Личные сообщения", tj: "Паёмҳои шахсӣ", en: "Private messages" },
  "chat.admin": { ru: "Чат с админом", tj: "Чати бо маъмур", en: "Admin chat" },
  "chat.send": { ru: "Отправить", tj: "Фиристодан", en: "Send" },
  "chat.message": { ru: "Сообщение...", tj: "Паём...", en: "Message..." },
  "chat.delete": { ru: "Удалить", tj: "Нест кардан", en: "Delete" },

  // Profile
  "profile.title": { ru: "Профиль", tj: "Профил", en: "Profile" },
  "profile.edit": { ru: "Редактировать", tj: "Таҳрир кардан", en: "Edit" },
  "profile.save": { ru: "Сохранить", tj: "Захира кардан", en: "Save" },
  "profile.logout": { ru: "Выйти", tj: "Баромадан", en: "Logout" },
  "profile.history": { ru: "История тестов", tj: "Таърихи тестҳо", en: "Test history" },

  // Admin
  "admin.title": { ru: "Панель администратора", tj: "Панели маъмур", en: "Admin Panel" },
  "admin.users": { ru: "Пользователи", tj: "Корбарон", en: "Users" },
  "admin.pendingTests": { ru: "Тесты на проверке", tj: "Тестҳо дар тафтиш", en: "Pending tests" },
  "admin.approve": { ru: "Одобрить", tj: "Тасдиқ кардан", en: "Approve" },
  "admin.reject": { ru: "Отклонить", tj: "Рад кардан", en: "Reject" },
  "admin.ban": { ru: "Заблокировать", tj: "Манъ кардан", en: "Ban" },
  "admin.unban": { ru: "Разблокировать", tj: "Озод кардан", en: "Unban" },
  "admin.resetExam": { ru: "Сбросить экзамен", tj: "Имтиҳонро бозгардонидан", en: "Reset exam" },

  // Ratings
  "rating.title": { ru: "Рейтинг", tj: "Рейтинг", en: "Rating" },
  "rating.rank": { ru: "Место", tj: "Ҷой", en: "Rank" },
  "rating.score": { ru: "Баллы", tj: "Холҳо", en: "Score" },
  "rating.grade": { ru: "Оценка", tj: "Баҳо", en: "Grade" },

  // Common
  "common.cancel": { ru: "Отмена", tj: "Бекор кардан", en: "Cancel" },
  "common.confirm": { ru: "Подтвердить", tj: "Тасдиқ", en: "Confirm" },
  "common.loading": { ru: "Загрузка...", tj: "Боргузорӣ...", en: "Loading..." },
  "common.error": { ru: "Ошибка", tj: "Хато", en: "Error" },
  "common.success": { ru: "Успешно", tj: "Бомуваффақият", en: "Success" },
  "common.save": { ru: "Сохранить", tj: "Захира кардан", en: "Save" },
  "common.close": { ru: "Закрыть", tj: "Пӯшидан", en: "Close" },
  "common.back": { ru: "Назад", tj: "Бозгашт", en: "Back" },
  "common.next": { ru: "Далее", tj: "Баъдӣ", en: "Next" },
  "common.finish": { ru: "Завершить", tj: "Ба анҷом расонидан", en: "Finish" },
  "common.settings": { ru: "Настройки", tj: "Танзимот", en: "Settings" },
  "common.theme": { ru: "Тема", tj: "Мавзӯъ", en: "Theme" },
  "common.language": { ru: "Язык", tj: "Забон", en: "Language" },
  "common.online": { ru: "Онлайн", tj: "Онлайн", en: "Online" },
  "common.offline": { ru: "Оффлайн", tj: "Офлайн", en: "Offline" },
};

export function t(key: string, lang: Lang): string {
  const entry = translations[key];
  if (!entry) return key;
  return entry[lang] || entry["ru"] || key;
}

export function useT(lang: Lang) {
  return (key: string) => t(key, lang);
}
