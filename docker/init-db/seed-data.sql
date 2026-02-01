-- Seed data for KPD Platform
-- This script runs after Prisma migrations

-- Disable triggers for circular FK constraints
SET session_replication_role = 'replica';

-- Admin (password: admin123)
INSERT INTO "Admin" (id, username, "passwordHash", "createdAt") VALUES
(1, 'admin', '$2b$10$pISqReMiLH/Uz/aVKWZHheELRkCx/ppSa9SPeyNacmD95.L29g/4K', '2026-01-30 15:20:20.091')
ON CONFLICT (id) DO NOTHING;

-- Groups
INSERT INTO "Group" (id, name, "createdAt", "headId") VALUES
(5, 'Правление', '2026-01-30 15:43:28.565', NULL),
(6, 'Подразделение защиты государственных секретов', '2026-01-30 16:13:07.559', NULL),
(7, 'Советник', '2026-01-30 17:13:32.576', NULL),
(8, 'Департамент информационных технологий', '2026-01-30 17:18:10.81', NULL),
(9, 'Управление сопровождения информационных ресурсов', '2026-01-30 17:21:06.698', NULL),
(10, 'Управление системного администрирования', '2026-01-30 17:22:13.298', NULL),
(11, 'Департамент научно-технической информации', '2026-01-30 17:46:24.085', NULL),
(12, 'Управление информации и анализа', '2026-01-30 17:46:57.288', NULL),
(13, 'Управление казахстанской базы цитирования', '2026-01-30 17:47:07.112', NULL),
(14, 'Департамент информационной безопасности', '2026-01-30 19:14:53.419', NULL),
(15, 'PR служба', '2026-01-30 19:18:04.75', NULL),
(16, 'Департамент управления персоналом', '2026-01-30 19:22:50.142', NULL)
ON CONFLICT (id) DO NOTHING;

-- Users
INSERT INTO "User" (id, "fullName", position, "groupId", "supervisorId", "createdAt", "updatedAt", "canLogin", "passwordHash", "canApproveKpi", "canEvaluate", username) VALUES
(7, 'Бибосинов Асылхан Жанибекович', 'Председатель Правления', 5, NULL, '2026-01-30 17:08:37.532', '2026-02-01 07:34:22.823', true, '$2b$10$0mB4shwXKZMp0CmhkFZwuubdU1bN.PmLG18EpSPV3PJWa5K1CGYUK', true, true, 'bibosinova'),
(8, 'Қайнбаев Нұрсұлтан Алмасұлы', 'Заместитель Председателя Правления', 5, 7, '2026-01-30 17:10:13.468', '2026-02-01 06:26:47.138', true, '$2b$10$95cJih0Zk0Azr.5frRQIHOPsuvk3s26kFmc1N1N7UYvU4EJBIZq2u', true, true, 'qaynbaevn'),
(9, 'Манатбаев Рустем Кусаингазыевич', 'Заместитель Председателя Правления', 5, 7, '2026-01-30 17:10:46.212', '2026-01-30 17:10:46.212', true, '$2b$10$4syCPss8jWSWK7q6pWNEsuFvGJeO1kRKvJvYH04taxHN7RYFSPBp6', true, true, 'manatbaevr'),
(10, 'Джолдасов Айдос Абдисалимович', 'Директор Центра научно-технической информации', 5, 7, '2026-01-30 17:11:32.244', '2026-01-30 17:11:32.244', true, '$2b$10$pQW.ztjn6Fy3kI5cDE83KOSdiQNmRH5b.5TwMWOUEGsgIo9pis8u2', true, true, 'dzholdasova'),
(11, 'Альханов Адилет Гинаятович', 'Советник Председателя Правления', 7, 7, '2026-01-30 17:14:39.196', '2026-01-30 17:15:03.355', false, '$2b$10$ldRWYo8Mi3omI2i73dSVLuxsfSj6GzLkGCnjRntaSyEo8kieLf.k2', false, false, 'alkhanova'),
(12, 'Жанесенов Айдос Талгатович', 'Директор департамента', 8, 8, '2026-01-30 17:18:48.889', '2026-01-30 18:01:18.355', true, '$2b$10$YU3mt/Qfo7DKUndcyV18XuGKvTCdr/ukmGMf4ysIS/iYKhQ6tO6Zi', true, false, 'zhanesenova'),
(13, 'Ахатова Зарина Амантаевна', 'Начальник управления', 9, 12, '2026-01-30 17:21:45.018', '2026-01-30 17:21:45.018', true, '$2b$10$UV9v01dHCdnWajyHmQUHVuCpgXc668wb0OETI8.tB6IGqh7UCxp.O', true, false, 'akhatovaz'),
(14, 'Бағдаулет Дастан Саятұлы', 'Начальник управления', 10, 12, '2026-01-30 17:22:52.598', '2026-01-30 17:22:52.598', true, '$2b$10$8ZnYZvyYb/yKwVckZ8G.teSobQX9h.AnMeRq4LbEFZCMT2AEttlXC', true, false, 'bagdauletd'),
(15, 'Әшімақын Гүлдана Қанатбекқызы', 'Главный менеджер', 9, 13, '2026-01-30 17:23:38.035', '2026-01-30 17:23:38.035', false, NULL, false, false, NULL),
(16, 'Искакова Мадина Маратовна', 'Главный менеджер', 9, 13, '2026-01-30 17:24:23.012', '2026-01-30 17:24:23.012', false, NULL, false, false, NULL),
(17, 'Амангелдинова Назым Қанатқызы', 'Главный менеджер', 9, 13, '2026-01-30 17:25:11.041', '2026-01-30 17:25:11.041', false, NULL, false, false, NULL),
(18, 'Еспембетов Тамерлан Дауренович', 'Главный менеджер', 9, 13, '2026-01-30 17:25:37.068', '2026-01-30 17:28:09.673', false, NULL, false, false, NULL),
(19, 'Қаржаубаев Қуаныш Әділбекұлы', 'Главный менеджер', 9, 13, '2026-01-30 17:25:53.488', '2026-01-30 17:27:53.377', false, NULL, false, false, NULL),
(20, 'Оразбек Рүстем Муратұлы', 'Главный менеджер', 9, 13, '2026-01-30 17:26:33.951', '2026-01-30 17:27:34.52', false, NULL, false, false, NULL),
(21, 'Бейсханов Еламан Жомартұлы', 'Главный менеджер', 9, 13, '2026-01-30 17:27:11.189', '2026-01-30 17:29:08.342', false, NULL, false, false, NULL),
(22, 'Бектемиров Талгат Салихович', 'Главный менеджер', 10, 14, '2026-01-30 17:28:51.68', '2026-01-30 17:28:51.68', false, NULL, false, false, NULL),
(23, 'Есжан Әсет Бағдатұлы', 'Главный менеджер', 10, 14, '2026-01-30 17:30:01.664', '2026-01-30 17:30:01.664', false, NULL, false, false, NULL),
(24, 'Бәдіғұл Марлан Ринадұлы', 'Главный менеджер', 10, 14, '2026-01-30 17:30:52.518', '2026-01-30 17:30:52.518', false, NULL, false, false, NULL),
(25, 'Байшир Иса Салихарұлы', 'Главный менеджер', 10, 14, '2026-01-30 17:32:00.3', '2026-01-30 17:32:00.3', false, NULL, false, false, NULL),
(26, 'Морозов Антон Александрович', 'Директор департамента', 11, 10, '2026-01-30 17:48:10.497', '2026-01-30 19:04:29.404', true, '$2b$10$PqwWI16NPR4Ml.BnXw2.F.tArt24AdvDprQC56FnCeWwojx40yWfa', true, false, 'morozova'),
(27, 'Джиесова Асем Сапаргалиевна', 'Начальник управления', 12, 26, '2026-01-30 18:55:11.334', '2026-01-30 18:56:30.711', true, '$2b$10$RdNy5iexOPwZvtJxvolHBuZQrv8gPV4YKRJMAMlwQ2sGECgHbt62.', true, false, 'dzhiesovaa'),
(28, 'Ержанқызы Дана', 'Эксперт-аналитик', 12, 27, '2026-01-30 18:56:13.524', '2026-01-30 18:56:13.524', false, NULL, false, false, NULL),
(29, 'Кулбулова Юлия Владимировна', 'Эксперт-аналитик', 12, 27, '2026-01-30 18:57:26.384', '2026-01-30 18:57:26.384', false, NULL, false, false, NULL),
(30, 'Абдигалиева Роза Сериковна', 'Главный менеджер', 12, 27, '2026-01-30 18:58:10.639', '2026-01-30 18:58:10.639', false, NULL, false, false, NULL),
(31, 'Беляева Галина Николаевна', 'Главный менеджер', 12, 27, '2026-01-30 18:58:45.871', '2026-01-30 18:58:45.871', false, NULL, false, false, NULL),
(32, 'Есимбекова Дания Сагитовна', 'Начальник управления', 13, 26, '2026-01-30 18:59:56.685', '2026-01-30 19:07:07.111', true, '$2b$10$xMmYiuk1ZrdYdcQJKSFl7uPY7NhmJ13SPccuDmorU9aKJmN0vNrk6', true, false, 'esimbekovad'),
(33, 'Абдыкалыкова Маржан Кынатовна', 'Главный менеджер', 13, 32, '2026-01-30 19:01:14.133', '2026-01-30 19:01:14.133', false, NULL, false, false, NULL),
(34, 'Бердыкулов Ерлан Багланович', 'Главный менеджер', 13, 32, '2026-01-30 19:01:28.601', '2026-01-30 19:01:28.601', false, NULL, false, false, NULL),
(35, 'Садирбаева Сандугаш Парахатовна', 'Главный менеджер', 13, 32, '2026-01-30 19:01:51.58', '2026-01-30 19:03:04.728', false, NULL, false, false, NULL),
(36, 'Бимурзаева Айгул Бейсеновна', 'Главный менеджер', 13, 32, '2026-01-30 19:01:58.539', '2026-01-30 19:03:16.245', false, NULL, false, false, NULL),
(37, 'Имансаева Айгуль Мейрхановна', 'Главный менеджер', 13, 32, '2026-01-30 19:02:12.603', '2026-01-30 19:03:28.146', false, NULL, false, false, NULL),
(38, 'Малик Джамиля', 'Главный менеджер', 13, 32, '2026-01-30 19:02:19.424', '2026-01-30 19:03:46.979', false, NULL, false, false, NULL),
(39, 'Кубекова Зухра Данабаевна', 'Руководитель ПЗГС', 6, 7, '2026-01-30 19:11:59.19', '2026-01-30 19:12:23.266', true, '$2b$10$z4/JCSVzdVNjjRpFtfcw1e38.rf5LLdAcf4h3PCls/UJxEs/RSw7O', true, false, 'kubekovaz'),
(40, 'Байбосынова Жулдыз Саятбековна', 'Главный менеджер', 6, 39, '2026-01-30 19:13:19.716', '2026-01-30 19:13:19.716', false, NULL, false, false, NULL),
(41, 'Мамырбек Ғабит Байжұмаұлы', 'Директор департамента', 14, 7, '2026-01-30 19:15:33.734', '2026-01-30 19:15:38.954', true, '$2b$10$swpykfGjY/LQmrfgKuJMAe5W.lgUOkR1J.yU487.zYRPRJlVfyasK', true, false, 'mamyrbekg'),
(42, 'Оразбек Сұңқар Рахымбекұлы', 'Администратор', 14, 41, '2026-01-30 19:16:18.642', '2026-01-30 19:16:18.642', false, NULL, false, false, NULL),
(43, 'Садырова Толкын Туралиевна', 'Руководитель', 15, 7, '2026-01-30 19:18:44.686', '2026-01-30 19:18:44.686', true, '$2b$10$M.gdFkWDjhO8eRVoPXV6XeGmjpFHTWqfIs0J2sHHsXnMO/xfyXEje', true, false, 'sadyrovat'),
(44, 'Бажова Татьяна Васильевна', 'Главный менеджер', 15, 43, '2026-01-30 19:19:26.072', '2026-01-30 19:19:26.072', false, NULL, false, false, NULL),
(45, 'Маханов Асылан Жеңісұлы', 'Главный менеджер', 15, 43, '2026-01-30 19:19:59.1', '2026-01-30 19:19:59.1', false, NULL, false, false, NULL),
(46, 'Ташенова Сая Калиевна', 'Директор департамента', 16, 7, '2026-01-30 19:23:40.066', '2026-02-01 06:19:37.06', true, '$2b$10$w6e/iO1v6csk7uoHyyWi0.uOhnVm3FHVUy5FxfnPcsyBqpRhC/S1a', true, false, 'tashenovas'),
(47, 'Садуов Казыбек', 'Референт', 16, 46, '2026-01-30 19:24:37.314', '2026-01-30 19:24:37.314', false, NULL, false, false, NULL),
(48, 'Сыралиева Әсел Мұхитқызы', 'Главный менеджер', 16, 46, '2026-01-30 19:25:18.372', '2026-01-30 19:25:18.372', false, NULL, false, false, NULL),
(49, 'Абдулова Асиям Абдуловна', 'Главный менеджер', 16, 46, '2026-01-30 19:25:55.283', '2026-01-30 19:25:55.283', false, NULL, false, false, NULL),
(50, 'Елемес Дарын Дәуренұлы', 'Главный менеджер', 16, 46, '2026-01-30 19:27:47.308', '2026-01-30 19:27:47.308', false, NULL, false, false, NULL)
ON CONFLICT (id) DO NOTHING;

-- Update Group heads
UPDATE "Group" SET "headId" = 7 WHERE id = 5;
UPDATE "Group" SET "headId" = 39 WHERE id = 6;
UPDATE "Group" SET "headId" = 12 WHERE id = 8;
UPDATE "Group" SET "headId" = 13 WHERE id = 9;
UPDATE "Group" SET "headId" = 14 WHERE id = 10;
UPDATE "Group" SET "headId" = 26 WHERE id = 11;
UPDATE "Group" SET "headId" = 27 WHERE id = 12;
UPDATE "Group" SET "headId" = 32 WHERE id = 13;
UPDATE "Group" SET "headId" = 41 WHERE id = 14;
UPDATE "Group" SET "headId" = 43 WHERE id = 15;
UPDATE "Group" SET "headId" = 46 WHERE id = 16;

-- EvaluationPeriod
INSERT INTO "EvaluationPeriod" (id, name, "startDate", "endDate", "isActive", "createdAt") VALUES
(1, 'Q1', '2026-01-31 00:00:00', '2026-02-07 00:00:00', true, '2026-01-30 19:49:27.734')
ON CONFLICT (id) DO NOTHING;

-- Reset sequences
SELECT setval('"Admin_id_seq"', COALESCE((SELECT MAX(id) FROM "Admin"), 1));
SELECT setval('"Group_id_seq"', COALESCE((SELECT MAX(id) FROM "Group"), 1));
SELECT setval('"User_id_seq"', COALESCE((SELECT MAX(id) FROM "User"), 1));
SELECT setval('"EvaluationPeriod_id_seq"', COALESCE((SELECT MAX(id) FROM "EvaluationPeriod"), 1));
SELECT setval('"Evaluation_id_seq"', COALESCE((SELECT MAX(id) FROM "Evaluation"), 1));
SELECT setval('"Kpi_id_seq"', COALESCE((SELECT MAX(id) FROM "Kpi"), 1));
SELECT setval('"KpiBlock_id_seq"', COALESCE((SELECT MAX(id) FROM "KpiBlock"), 1));
SELECT setval('"KpiTask_id_seq"', COALESCE((SELECT MAX(id) FROM "KpiTask"), 1));
SELECT setval('"KpiAssignment_id_seq"', COALESCE((SELECT MAX(id) FROM "KpiAssignment"), 1));
SELECT setval('"KpiTaskFact_id_seq"', COALESCE((SELECT MAX(id) FROM "KpiTaskFact"), 1));
SELECT setval('"GroupScore_id_seq"', COALESCE((SELECT MAX(id) FROM "GroupScore"), 1));

-- Re-enable triggers
SET session_replication_role = 'origin';
