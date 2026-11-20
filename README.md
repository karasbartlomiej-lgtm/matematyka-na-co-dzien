# Matematyka na co dzień

Polskojęzyczna aplikacja PWA do samodzielnego ćwiczenia matematyki w klasach 1–8. Nie wymaga rejestracji, serwera aplikacyjnego, bazy danych, kompilacji ani zewnętrznych bibliotek.

## Pierwsze uruchomienie

1. Rozpakuj ZIP. W terminalu przejdź do folderu zawierającego ten plik.
2. Uruchom `python3 -m http.server 8000 --directory dist`.
3. Otwórz [http://localhost:8000](http://localhost:8000).
4. Wybierz klasę, kategorię, poziom oraz liczbę zadań. Wpisuj wyniki ekranową lub fizyczną klawiaturą. Z treningu można wyjść w dowolnej chwili, a każda sprawdzona odpowiedź zapisuje się od razu.

Otwarcie samego pliku HTML z dysku nie wystarcza, ponieważ przeglądarka musi załadować moduły JavaScript i zarejestrować Service Workera.

## Publikacja i instalacja

Prześlij całą zawartość `dist/` na statyczny hosting HTTPS, np. GitHub Pages, Cloudflare Pages lub Netlify. Ustaw katalog publikacji na `dist` i pomiń polecenie kompilacji. Sprawdź, czy hosting serwuje `.mjs` jako JavaScript i udostępnia `sw.js` z tego samego adresu co aplikację. Zachowaj strukturę plików. Przy zmianie aplikacji zwiększ nazwę pamięci podręcznej w `sw.js`, aby przeglądarki pobrały nowe zasoby.

Na iPhonie otwórz stronę w Safari, wybierz **Udostępnij → Dodaj do ekranu początkowego**. Na Androidzie otwórz menu Chrome i wybierz **Zainstaluj aplikację** lub **Dodaj do ekranu głównego**. Aby używać aplikacji offline, najpierw załaduj ją w pełni online. Pamięć przeglądarki, adres strony i profile są powiązane. Kopia JSON pozwala przenieść dane na inny adres lub urządzenie. W prywatnym trybie przeglądania dane mogą wygasnąć po zamknięciu sesji.

## Nauka, zwierzęta i profile

- Trening obejmuje 56 kategorii przypisanych do klas i pięć poziomów na kategorię. Ten sam dział w innej klasie ma osobny postęp. Kategorie i zakresy ćwiczeń oparto na podstawach programowych właściwych dla roku szkolnego 2026/2027. Podstawa formułuje część wymagań dla etapów, a aplikacja rozkłada je na klasy. Zestaw ćwiczeń ma charakter uzupełniający i obejmuje wybrane umiejętności, w tym zadania przekrojowe w klasie ósmej.
- Za każdą poprawną odpowiedź przyznawane jest 10 monet. Co 3 poprawne odpowiedzi dają porcję jedzenia, a co 7 jedną zabawkę. Zakupy są wirtualne.
- Każdą z trzech nagród dziennych można odebrać raz na profil, niezależnie od przełączania klas. Wyzwania i liczniki odświeżają się o północy w strefie Europe/Warsaw.
- Opanowanie wymaga minimum 12 zadań na poziomach 3–5, co najmniej 10 poprawnych odpowiedzi i skuteczności co najmniej 80% na tych poziomach. Ranga jest liczona z aktualnej liczby opanowanych kategorii. Po spadku skuteczności może się zmienić.
- Wartości potrzeb zwierząt mają dolną granicę 25%. Zwierzęta pozostają w kolekcji. Drzemka trwa dwie minuty, a zwierzę można wcześniej obudzić.
- W ustawieniach można zmienić motyw, ograniczyć animacje, zarządzać profilami i zapisać komplet danych do pliku JSON. Import zastępuje wszystkie obecne profile dopiero po potwierdzeniu. Usuwanie profilu i reset jego postępów również wymagają potwierdzenia. W trakcie treningu niesprawdzona odpowiedź znajduje się w pamięci bieżącej karty.

## Źródła programu nauczania

- [Rozporządzenie Ministra Edukacji z 11 marca 2026 r., Dz.U. poz. 378](https://dziennikustaw.gov.pl/D2026000037801.pdf)
- [Rozporządzenie Ministra Edukacji z 28 czerwca 2024 r., Dz.U. poz. 996](https://isap.sejm.gov.pl/isap.nsf/download.xsp/WDU20240000996/O/D20240996.pdf)
- [Harmonogram wdrożenia podstawy programowej](https://reforma26.men.gov.pl/nowe-podstawy-programowe-wychowania-przedszkolnego-i-ksztalcenia-ogolnego-dla-szkoly-podstawowej-wraz-ze-zmianami-w-ramowych-planach-nauczania-dla-publicznych-szkol-podstawowych-rozporzadzenia-podpi/)

## Kod i testy

- `dist/math.mjs` — kategorie, generatory, objaśnienia i sprawdzanie odpowiedzi.
- `dist/game.mjs` — profile, postępy, rangi, wyzwania, sklep, opieka i walidacja kopii.
- `dist/app.mjs` — interfejs, sesje, obsługa podanych odpowiedzi i lokalny zapis.
- `dist/sw.js` — obsługa offline. `dist/app.webmanifest` i ikony PNG umożliwiają instalowanie.
- `dist/pets/` — 18 osobnych ilustracji PNG. `dist/logo.svg` jest źródłem ikon.
- `node tests/check.mjs` (Node.js 22+) — 22 400 losowych zadań z niezależnym obliczeniem wyników, wszystkie 280 kombinacji klasy, kategorii i poziomu, sprawdzenie struktury wyjaśnień, monet, rang, wyzwań, wszystkich zakupów, karmienia, zabawy, snu i walidacji kopii.

Przeglądarkowy test lokalnego podglądu objął trening z poprawnymi i błędnymi odpowiedziami, podsumowanie 9/10 i 90 monet, odbiór nagrody, kupno chomika, karmienie, zabawę, usypianie oraz budzenie. Sprawdzono przełączanie motywu i animacji, osobny stan drugiego profilu, zachowanie zapisu po przeładowaniu oraz ponowne uruchomienie aplikacji i otwarcie sklepu z ilustracjami po zatrzymaniu serwera podglądu. Instalacja PWA na fizycznym urządzeniu zależy od hostingu i przeglądarki.

## Aktualizacje z GitHuba

Publiczna aplikacja działa na [GitHub Pages](https://karasbartlomiej-lgtm.github.io/matematyka-na-co-dzien/). Każda zmiana w gałęzi `main` uruchamia testy GitHub Actions. Po ich przejściu workflow wdraża katalog `dist/` i publikuje ZIP w zakładce **Releases**. Identyfikator pamięci podręcznej PWA zmienia się przy każdym wdrożeniu.

Postępy są powiązane z adresem strony. Aby przenieść profile z wcześniejszego podglądu, wyeksportuj tam kopię w **Ustawieniach**, a następnie zaimportuj ją na GitHub Pages.
