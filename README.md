# Matematyka na co dzień

Polskojęzyczna aplikacja PWA do samodzielnego ćwiczenia matematyki w klasach 1–8. Trening działa lokalnie. Opcjonalna synchronizacja korzysta z szyfrowanego zapisu online.

## Pierwsze uruchomienie

1. Rozpakuj ZIP. W terminalu przejdź do folderu zawierającego ten plik.
2. Uruchom `python3 -m http.server 8000 --directory dist`.
3. Otwórz [http://localhost:8000](http://localhost:8000).
4. Wybierz kategorię, poziom oraz liczbę zadań. Wpisuj wyniki ekranową lub fizyczną klawiaturą. Z treningu można wyjść w dowolnej chwili, a każda sprawdzona odpowiedź zapisuje się od razu.

Otwarcie samego pliku HTML z dysku nie wystarcza, ponieważ przeglądarka musi załadować moduły JavaScript i zarejestrować Service Workera.

## Publikacja i instalacja

Prześlij całą zawartość `dist/` na statyczny hosting HTTPS, np. GitHub Pages, Cloudflare Pages lub Netlify. Ustaw katalog publikacji na `dist` i pomiń polecenie kompilacji. Sprawdź, czy hosting serwuje `.mjs` jako JavaScript i udostępnia `sw.js` z tego samego adresu co aplikację. Zachowaj strukturę plików. Przy zmianie aplikacji zwiększ nazwę pamięci podręcznej w `sw.js`, aby przeglądarki pobrały nowe zasoby.

Na iPhonie otwórz stronę w Safari, wybierz **Udostępnij → Dodaj do ekranu początkowego**. Na Androidzie otwórz menu Chrome i wybierz **Zainstaluj aplikację** lub **Dodaj do ekranu głównego**. Aby używać aplikacji offline, najpierw załaduj ją w pełni online. Pamięć przeglądarki, adres strony i profile są powiązane. Kopia JSON pozwala przenieść dane na inny adres lub urządzenie. W prywatnym trybie przeglądania dane mogą wygasnąć po zamknięciu sesji.

## Nauka, zwierzęta i profile

- Klasa 4 obejmuje system dziesiętny i porównywanie liczb naturalnych. Dostępne poziomy to Łatwy (+8/−4), Średni (+10/−5) i Trudny (+13/−7).
- Karmienie wymaga jednej porcji ze sklepu i wybranej liczby niewykorzystanych poprawnych odpowiedzi z ostatnich 24 godzin. Jedna odpowiedź = 10 punktów karmienia = 96 minut; 150 pkt = 24 godziny. Czas sumuje się bez limitu gry. Za każde siedem poprawnych odpowiedzi profil otrzymuje zabawkę.
- Ustawienia → Link do logowania na drugim telefonie pozwala przenieść się na inne urządzenie. Otwórz prywatny link i podaj hasło. Przy pracy offline postępy zapisują się lokalnie. Konflikt wersji wymaga wyboru wersji po zachowaniu kopii.
- Opcjonalna kopia haseł w ustawieniach wydaje osobny plik klucza rodzica i zbiera zaszyfrowane hasła przy kolejnych logowaniach na tym urządzeniu. Przechowuj klucz osobno od kopii. Odczyt wymaga obu plików (RSA-OAEP, SHA-256, szyfrogram zakodowany szesnastkowo).
- Każdą z trzech nagród dziennych można odebrać raz na profil. Wyzwania i liczniki odświeżają się o północy w strefie Europe/Warsaw.
- Opanowanie wymaga minimum 12 zadań na dostępnych poziomach, co najmniej 10 poprawnych odpowiedzi i skuteczności co najmniej 80% na tych poziomach. Ranga jest liczona z aktualnej liczby opanowanych kategorii. Po spadku skuteczności może się zmienić.
- Paski potrzeb mają zakres 0–150, lecz zapas najedzenia może przekraczać 24 godziny. Po ponad 24 godzinach głodu zwierzę opuszcza hodowlę. Kontrola następuje przy otwarciu aktywnego profilu i podczas korzystania z aplikacji, ranking aktualizuje się online. Przy migracji głodne zwierzęta otrzymują 24 godziny okresu przejściowego. Szczęście i energia maleją przez 48 godzin. Drzemka trwa dwie minuty, a zwierzę można wcześniej obudzić.
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
- `node tests/check.mjs` (Node.js 22+) — Losowe zadania z niezależnym obliczeniem wyników, kombinacje kategorii i poziomu, sprawdzenie struktury wyjaśnień, monet, rang, wyzwań, wszystkich zakupów, karmienia, zabawy, snu i walidacji kopii.

Przeglądarkowy test lokalnego podglądu objął trening z poprawnymi i błędnymi odpowiedziami, podsumowanie 9/10 i 90 monet, odbiór nagrody, kupno chomika, karmienie, zabawę, usypianie oraz budzenie. Sprawdzono przełączanie motywu i animacji, osobny stan drugiego profilu, zachowanie zapisu po przeładowaniu oraz ponowne uruchomienie aplikacji i otwarcie sklepu z ilustracjami po zatrzymaniu serwera podglądu. Instalacja PWA na fizycznym urządzeniu zależy od hostingu i przeglądarki.

## Aktualizacje z GitHuba

Publiczna aplikacja działa na [GitHub Pages](https://karasbartlomiej-lgtm.github.io/matematyka-na-co-dzien/). Każda zmiana w gałęzi `main` uruchamia testy GitHub Actions. Po ich przejściu workflow wdraża katalog `dist/` i publikuje ZIP w zakładce **Releases**. Identyfikator pamięci podręcznej PWA zmienia się przy każdym wdrożeniu.

Postępy są powiązane z adresem strony. Aby przenieść profile z wcześniejszego podglądu, wyeksportuj tam kopię w **Ustawieniach**, a następnie zaimportuj ją na GitHub Pages.
