pg_dump: warning: there are circular foreign-key constraints among these tables:
pg_dump: detail: Group
pg_dump: detail: User
pg_dump: hint: You might not be able to restore the dump without using --disable-triggers or temporarily dropping the constraints.
pg_dump: hint: Consider using a full dump instead of a --data-only dump to avoid this problem.
pg_dump: warning: there are circular foreign-key constraints on this table:
pg_dump: detail: User
pg_dump: hint: You might not be able to restore the dump without using --disable-triggers or temporarily dropping the constraints.
pg_dump: hint: Consider using a full dump instead of a --data-only dump to avoid this problem.
--
-- PostgreSQL database dump
--

-- Dumped from database version 16.11 (Homebrew)
-- Dumped by pg_dump version 16.3

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: Admin; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public."Admin" VALUES (1, 'admin', '$2b$10$pISqReMiLH/Uz/aVKWZHheELRkCx/ppSa9SPeyNacmD95.L29g/4K', '2026-01-30 15:20:20.091');


--
-- Data for Name: EvaluationPeriod; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public."EvaluationPeriod" VALUES (1, 'Q1', '2026-01-31 00:00:00', '2026-02-07 00:00:00', true, '2026-01-30 19:49:27.734');


--
-- Data for Name: Group; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public."Group" VALUES (7, 'Советник', '2026-01-30 17:13:32.576', NULL);
INSERT INTO public."Group" VALUES (10, 'Управление системного администрирования', '2026-01-30 17:22:13.298', 14);
INSERT INTO public."Group" VALUES (9, 'Управление сопровождения информационных ресурсов', '2026-01-30 17:21:06.698', 13);
INSERT INTO public."Group" VALUES (8, 'Департамент информационных технологий ', '2026-01-30 17:18:10.81', 12);
INSERT INTO public."Group" VALUES (11, 'Департамент научно-технической информации', '2026-01-30 17:46:24.085', 26);
INSERT INTO public."Group" VALUES (12, 'Управление информации и анализа', '2026-01-30 17:46:57.288', 27);
INSERT INTO public."Group" VALUES (13, 'Управление казахстанской базы цитирования', '2026-01-30 17:47:07.112', 32);
INSERT INTO public."Group" VALUES (5, 'Правление', '2026-01-30 15:43:28.565', 7);
INSERT INTO public."Group" VALUES (6, 'Подразделение защиты государственных секретов ', '2026-01-30 16:13:07.559', 39);
INSERT INTO public."Group" VALUES (14, 'Департамент информационной безопасности       ', '2026-01-30 19:14:53.419', 41);
INSERT INTO public."Group" VALUES (15, ' PR служба', '2026-01-30 19:18:04.75', 43);
INSERT INTO public."Group" VALUES (16, 'Департамент управления персоналом', '2026-01-30 19:22:50.142', 46);


--
-- Data for Name: User; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public."User" VALUES (29, 'Кулбулова Юлия Владимировна', 'Эксперт-аналитик', 12, 27, '2026-01-30 18:57:26.384', '2026-01-30 18:57:26.384', false, NULL, false, false, NULL);
INSERT INTO public."User" VALUES (9, 'Манатбаев Рустем Кусаингазыевич', 'Заместитель Председателя Правления', 5, 7, '2026-01-30 17:10:46.212', '2026-01-30 17:10:46.212', true, '$2b$10$4syCPss8jWSWK7q6pWNEsuFvGJeO1kRKvJvYH04taxHN7RYFSPBp6', true, true, 'manatbaevr');
INSERT INTO public."User" VALUES (10, 'Джолдасов Айдос Абдисалимович', 'Директор Центра научно-технической информации', 5, 7, '2026-01-30 17:11:32.244', '2026-01-30 17:11:32.244', true, '$2b$10$pQW.ztjn6Fy3kI5cDE83KOSdiQNmRH5b.5TwMWOUEGsgIo9pis8u2', true, true, 'dzholdasova');
INSERT INTO public."User" VALUES (11, 'Альханов Адилет Гинаятович', 'Советник Председателя Правления', 7, 7, '2026-01-30 17:14:39.196', '2026-01-30 17:15:03.355', false, '$2b$10$ldRWYo8Mi3omI2i73dSVLuxsfSj6GzLkGCnjRntaSyEo8kieLf.k2', false, false, 'alkhanova');
INSERT INTO public."User" VALUES (13, 'Ахатова Зарина Амантаевна', 'Начальник управления', 9, 12, '2026-01-30 17:21:45.018', '2026-01-30 17:21:45.018', true, '$2b$10$UV9v01dHCdnWajyHmQUHVuCpgXc668wb0OETI8.tB6IGqh7UCxp.O', true, false, 'akhatovaz');
INSERT INTO public."User" VALUES (14, 'Бағдаулет Дастан Саятұлы', 'Начальник управления', 10, 12, '2026-01-30 17:22:52.598', '2026-01-30 17:22:52.598', true, '$2b$10$8ZnYZvyYb/yKwVckZ8G.teSobQX9h.AnMeRq4LbEFZCMT2AEttlXC', true, false, 'bagdauletd');
INSERT INTO public."User" VALUES (15, 'Әшімақын Гүлдана Қанатбекқызы', 'Главный менеджер', 9, 13, '2026-01-30 17:23:38.035', '2026-01-30 17:23:38.035', false, NULL, false, false, NULL);
INSERT INTO public."User" VALUES (16, 'Искакова Мадина Маратовна', 'Главный менеджер', 9, 13, '2026-01-30 17:24:23.012', '2026-01-30 17:24:23.012', false, NULL, false, false, NULL);
INSERT INTO public."User" VALUES (17, 'Амангелдинова Назым Қанатқызы', 'Главный менеджер', 9, 13, '2026-01-30 17:25:11.041', '2026-01-30 17:25:11.041', false, NULL, false, false, NULL);
INSERT INTO public."User" VALUES (30, 'Абдигалиева Роза Сериковна ', 'Главный менеджер', 12, 27, '2026-01-30 18:58:10.639', '2026-01-30 18:58:10.639', false, NULL, false, false, NULL);
INSERT INTO public."User" VALUES (20, 'Оразбек Рүстем Муратұлы', 'Главный менеджер', 9, 13, '2026-01-30 17:26:33.951', '2026-01-30 17:27:34.52', false, NULL, false, false, NULL);
INSERT INTO public."User" VALUES (19, 'Қаржаубаев Қуаныш Әділбекұлы', 'Главный менеджер', 9, 13, '2026-01-30 17:25:53.488', '2026-01-30 17:27:53.377', false, NULL, false, false, NULL);
INSERT INTO public."User" VALUES (18, 'Еспембетов Тамерлан Дауренович', 'Главный менеджер', 9, 13, '2026-01-30 17:25:37.068', '2026-01-30 17:28:09.673', false, NULL, false, false, NULL);
INSERT INTO public."User" VALUES (22, 'Бектемиров Талгат Салихович', 'Главный менеджер', 10, 14, '2026-01-30 17:28:51.68', '2026-01-30 17:28:51.68', false, NULL, false, false, NULL);
INSERT INTO public."User" VALUES (21, 'Бейсханов Еламан Жомартұлы', 'Главный менеджер', 9, 13, '2026-01-30 17:27:11.189', '2026-01-30 17:29:08.342', false, NULL, false, false, NULL);
INSERT INTO public."User" VALUES (23, 'Есжан Әсет Бағдатұлы', 'Главный менеджер', 10, 14, '2026-01-30 17:30:01.664', '2026-01-30 17:30:01.664', false, NULL, false, false, NULL);
INSERT INTO public."User" VALUES (24, 'Бәдіғұл Марлан Ринадұлы', 'Главный менеджер', 10, 14, '2026-01-30 17:30:52.518', '2026-01-30 17:30:52.518', false, NULL, false, false, NULL);
INSERT INTO public."User" VALUES (25, 'Байшир Иса Салихарұлы', 'Главный менеджер', 10, 14, '2026-01-30 17:32:00.3', '2026-01-30 17:32:00.3', false, NULL, false, false, NULL);
INSERT INTO public."User" VALUES (31, 'Беляева Галина Николаевна', 'Главный менеджер', 12, 27, '2026-01-30 18:58:45.871', '2026-01-30 18:58:45.871', false, NULL, false, false, NULL);
INSERT INTO public."User" VALUES (12, 'Жанесенов Айдос Талгатович', 'Директор департамента', 8, 8, '2026-01-30 17:18:48.889', '2026-01-30 18:01:18.355', true, '$2b$10$YU3mt/Qfo7DKUndcyV18XuGKvTCdr/ukmGMf4ysIS/iYKhQ6tO6Zi', true, false, 'zhanesenova');
INSERT INTO public."User" VALUES (46, 'Ташенова Сая Калиевна', 'Директор департамента', 16, 7, '2026-01-30 19:23:40.066', '2026-02-01 06:19:37.06', true, '$2b$10$w6e/iO1v6csk7uoHyyWi0.uOhnVm3FHVUy5FxfnPcsyBqpRhC/S1a', true, false, 'tashenovas');
INSERT INTO public."User" VALUES (28, 'Ержанқызы Дана', 'Эксперт-аналитик', 12, 27, '2026-01-30 18:56:13.524', '2026-01-30 18:56:13.524', false, NULL, false, false, NULL);
INSERT INTO public."User" VALUES (27, 'Джиесова Асем Сапаргалиевна', 'Начальник управления', 12, 26, '2026-01-30 18:55:11.334', '2026-01-30 18:56:30.711', true, '$2b$10$RdNy5iexOPwZvtJxvolHBuZQrv8gPV4YKRJMAMlwQ2sGECgHbt62.', true, false, 'dzhiesovaa');
INSERT INTO public."User" VALUES (33, 'Абдыкалыкова Маржан Кынатовна', 'Главный менеджер', 13, 32, '2026-01-30 19:01:14.133', '2026-01-30 19:01:14.133', false, NULL, false, false, NULL);
INSERT INTO public."User" VALUES (34, 'Бердыкулов Ерлан Багланович', 'Главный менеджер', 13, 32, '2026-01-30 19:01:28.601', '2026-01-30 19:01:28.601', false, NULL, false, false, NULL);
INSERT INTO public."User" VALUES (35, 'Садирбаева Сандугаш Парахатовна', 'Главный менеджер', 13, 32, '2026-01-30 19:01:51.58', '2026-01-30 19:03:04.728', false, NULL, false, false, NULL);
INSERT INTO public."User" VALUES (36, 'Бимурзаева Айгул Бейсеновна', 'Главный менеджер', 13, 32, '2026-01-30 19:01:58.539', '2026-01-30 19:03:16.245', false, NULL, false, false, NULL);
INSERT INTO public."User" VALUES (37, 'Имансаева Айгуль Мейрхановна', 'Главный менеджер', 13, 32, '2026-01-30 19:02:12.603', '2026-01-30 19:03:28.146', false, NULL, false, false, NULL);
INSERT INTO public."User" VALUES (38, 'Малик Джамиля', 'Главный менеджер', 13, 32, '2026-01-30 19:02:19.424', '2026-01-30 19:03:46.979', false, NULL, false, false, NULL);
INSERT INTO public."User" VALUES (26, 'Морозов Антон Александрович', 'Директор департамента', 11, 10, '2026-01-30 17:48:10.497', '2026-01-30 19:04:29.404', true, '$2b$10$PqwWI16NPR4Ml.BnXw2.F.tArt24AdvDprQC56FnCeWwojx40yWfa', true, false, 'morozova');
INSERT INTO public."User" VALUES (32, 'Есимбекова Дания Сагитовна', 'Начальник управления', 13, 26, '2026-01-30 18:59:56.685', '2026-01-30 19:07:07.111', true, '$2b$10$xMmYiuk1ZrdYdcQJKSFl7uPY7NhmJ13SPccuDmorU9aKJmN0vNrk6', true, false, 'esimbekovad');
INSERT INTO public."User" VALUES (39, 'Кубекова Зухра Данабаевна', 'Руководитель ПЗГС', 6, 7, '2026-01-30 19:11:59.19', '2026-01-30 19:12:23.266', true, '$2b$10$z4/JCSVzdVNjjRpFtfcw1e38.rf5LLdAcf4h3PCls/UJxEs/RSw7O', true, false, 'kubekovaz');
INSERT INTO public."User" VALUES (40, 'Байбосынова Жулдыз Саятбековна', 'Главный менеджер', 6, 39, '2026-01-30 19:13:19.716', '2026-01-30 19:13:19.716', false, NULL, false, false, NULL);
INSERT INTO public."User" VALUES (41, 'Мамырбек Ғабит Байжұмаұлы', 'Директор департамента', 14, 7, '2026-01-30 19:15:33.734', '2026-01-30 19:15:38.954', true, '$2b$10$swpykfGjY/LQmrfgKuJMAe5W.lgUOkR1J.yU487.zYRPRJlVfyasK', true, false, 'mamyrbekg');
INSERT INTO public."User" VALUES (42, 'Оразбек Сұңқар Рахымбекұлы', 'Администратор', 14, 41, '2026-01-30 19:16:18.642', '2026-01-30 19:16:18.642', false, NULL, false, false, NULL);
INSERT INTO public."User" VALUES (43, 'Садырова Толкын Туралиевна', 'Руководитель', 15, 7, '2026-01-30 19:18:44.686', '2026-01-30 19:18:44.686', true, '$2b$10$M.gdFkWDjhO8eRVoPXV6XeGmjpFHTWqfIs0J2sHHsXnMO/xfyXEje', true, false, 'sadyrovat');
INSERT INTO public."User" VALUES (44, 'Бажова Татьяна Васильевна', 'Главный менеджер', 15, 43, '2026-01-30 19:19:26.072', '2026-01-30 19:19:26.072', false, NULL, false, false, NULL);
INSERT INTO public."User" VALUES (45, 'Маханов Асылан Жеңісұлы', 'Главный менеджер', 15, 43, '2026-01-30 19:19:59.1', '2026-01-30 19:19:59.1', false, NULL, false, false, NULL);
INSERT INTO public."User" VALUES (47, 'Садуов Казыбек', 'Референт', 16, 46, '2026-01-30 19:24:37.314', '2026-01-30 19:24:37.314', false, NULL, false, false, NULL);
INSERT INTO public."User" VALUES (48, 'Сыралиева Әсел Мұхитқызы', 'Главный менеджер', 16, 46, '2026-01-30 19:25:18.372', '2026-01-30 19:25:18.372', false, NULL, false, false, NULL);
INSERT INTO public."User" VALUES (49, 'Абдулова Асиям Абдуловна', 'Главный менеджер', 16, 46, '2026-01-30 19:25:55.283', '2026-01-30 19:25:55.283', false, NULL, false, false, NULL);
INSERT INTO public."User" VALUES (7, 'Бибосинов Асылхан Жанибекович', 'Председатель Правления ', 5, NULL, '2026-01-30 17:08:37.532', '2026-02-01 07:34:22.823', true, '$2b$10$0mB4shwXKZMp0CmhkFZwuubdU1bN.PmLG18EpSPV3PJWa5K1CGYUK', true, true, 'bibosinova');
INSERT INTO public."User" VALUES (50, 'Елемес Дарын Дәуренұлы', 'Главный менеджер', 16, 46, '2026-01-30 19:27:47.308', '2026-01-30 19:27:47.308', false, NULL, false, false, NULL);
INSERT INTO public."User" VALUES (8, 'Қайнбаев Нұрсұлтан Алмасұлы', 'Заместитель Председателя Правления ', 5, 7, '2026-01-30 17:10:13.468', '2026-02-01 06:26:47.138', true, '$2b$10$95cJih0Zk0Azr.5frRQIHOPsuvk3s26kFmc1N1N7UYvU4EJBIZq2u', true, true, 'qaynbaevn');


--
-- Data for Name: Evaluation; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public."Evaluation" VALUES (1, 1, 8, 12, 'manager', '{"quality": 5, "deadlines": 5, "discipline": 5, "leadership": 5, "noViolations": 5}', '{"quality": "", "deadlines": "", "discipline": "", "leadership": "", "noViolations": ""}', 5, 'Выполняет функциональные обязанности эффективно', '2026-01-30 19:50:39.358', '2026-01-30 19:54:32.137');


--
-- Data for Name: GroupScore; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: Kpi; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public."Kpi" VALUES (2, 'KPI руководства АО «НЦГНТЭ» на 2025 год', 'Утверждены 
решением Совета директоров
АО «Национальный центр государственной
научно-технической экспертизы»
        от «01» декабря 2025 года, протокол №8
', '2026-03-01 00:00:00', 'APPROVED', 1, 7, NULL, '2026-02-01 07:34:45.053', '2026-02-01 07:34:05.139', '2026-02-01 07:29:26.487', '2026-02-01 07:34:45.054');


--
-- Data for Name: KpiAssignment; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public."KpiAssignment" VALUES (2, 2, 7, false, NULL, '2026-02-01 07:29:26.497', '2026-02-01 07:29:26.497');


--
-- Data for Name: KpiBlock; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public."KpiBlock" VALUES (3, 2, 'очноыфоыфоты', 40, 0, '2026-02-01 07:29:26.507', '2026-02-01 07:29:26.507');
INSERT INTO public."KpiBlock" VALUES (4, 2, 'ывыв', 60, 1, '2026-02-01 07:29:26.521', '2026-02-01 07:29:26.521');


--
-- Data for Name: KpiTask; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public."KpiTask" VALUES (5, 'Подготовка информационно-аналитических справочников: «Наука Казахстана в цифрах. 2020-2024 годы»; Научно-технический потенциал регионов Республики Казахстан 2020-2024».', 100, 0, '2026-02-01 07:29:26.515', '2026-02-01 07:33:59.566', 3, 100, 'шт');
INSERT INTO public."KpiTask" VALUES (6, 'ывыв', 100, 0, '2026-02-01 07:29:26.528', '2026-02-01 07:34:04.053', 4, 20, 'шт');


--
-- Data for Name: KpiTaskFact; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public._prisma_migrations VALUES ('c5b7196e-fdab-44f3-9a7c-c8749a9fcb65', '9128445d3ac2f49c812b16ede86f03ff51b4a5cf6c14d9e6b62ccece6f097fb9', '2026-01-30 20:20:13.314488+05', '20260130152013_init', NULL, NULL, '2026-01-30 20:20:13.307925+05', 1);
INSERT INTO public._prisma_migrations VALUES ('5402555b-0040-4b5a-9468-d7453e740fbe', '3dcab17a99ed8ce9519349d89d21a32a67fa0091110c077b30866268b2bbd065', '2026-01-30 20:38:33.138341+05', '20260130153833_add_user_flags_and_password', NULL, NULL, '2026-01-30 20:38:33.135233+05', 1);


--
-- Name: Admin_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."Admin_id_seq"', 1, true);


--
-- Name: EvaluationPeriod_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."EvaluationPeriod_id_seq"', 1, true);


--
-- Name: Evaluation_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."Evaluation_id_seq"', 1, true);


--
-- Name: GroupScore_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."GroupScore_id_seq"', 1, false);


--
-- Name: Group_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."Group_id_seq"', 16, true);


--
-- Name: KpiAssignment_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."KpiAssignment_id_seq"', 2, true);


--
-- Name: KpiBlock_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."KpiBlock_id_seq"', 4, true);


--
-- Name: KpiTaskFact_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."KpiTaskFact_id_seq"', 1, false);


--
-- Name: KpiTask_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."KpiTask_id_seq"', 6, true);


--
-- Name: Kpi_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."Kpi_id_seq"', 2, true);


--
-- Name: User_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."User_id_seq"', 50, true);


--
-- PostgreSQL database dump complete
--

