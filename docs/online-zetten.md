# Fits online zetten op fits.alduslab.eu

Fits draait op de Hetzner-server, net als Aldus: in een eigen Docker-container op een interne poort, met de nginx van de server ervoor voor het domein en HTTPS. Anders dan Aldus is Fits geen statische site: er is een database (SQLite, in een Docker-volume), dus **back-ups zijn nodig** (zie onder).

| Website | Domein | Interne poort | Map op de server | Repository |
| --- | --- | --- | --- | --- |
| fits | fits.alduslab.eu | 8005 | ~/fits | github.com/pieterrgrt/fits |

Neem deze rij over in de tabel van *Website live zetten op Hetzner*. Poorten in gebruik: 8001 (liveaux), 8002 (?), 8003 (Aldus), 8004 (Listmonk), 11000 (Nextcloud). De volgende krijgt 8006.

## Stappenplan

1. **DNS bij Infomaniak.** Voeg toe: `A`-record, naam `fits`, doel `178.105.62.224`, TTL 1 uur. Geen AAAA-record. Laat al het andere staan.

   ```bash
   dig +short A fits.alduslab.eu @nsany1.infomaniak.com   # moet 178.105.62.224 geven
   ```

2. **Poort controleren** op de server: `sudo ss -tlnp | grep 127.0.0.1:8005`. Bezet? Zoek een vrije (`sudo ss -tlnp | grep 127.0.0.1`), zet `FITS_POORT=<poort>` in `.env` en gebruik die poort ook in stap 4 en 5.

3. **Code ophalen.**

   ```bash
   git clone https://github.com/pieterrgrt/fits.git ~/fits
   cd ~/fits
   cp .env.example .env    # Strava-sleutels later invullen, zie docs/strava.md
   ```

4. **Starten en testen.**

   ```bash
   docker compose up -d --build
   curl http://127.0.0.1:8005/gezond     # "ok" = goed
   ```

5. **nginx laten doorsturen.** Maak `/etc/nginx/sites-available/fits`:

   ```nginx
   server {
       listen 80;
       server_name fits.alduslab.eu;
       client_max_body_size 2m;
       location / {
           proxy_pass http://127.0.0.1:8005;
           proxy_set_header Host $host;
           proxy_set_header X-Forwarded-For $remote_addr;
           proxy_set_header X-Forwarded-Proto $scheme;
       }
   }
   ```

   ```bash
   sudo ln -s /etc/nginx/sites-available/fits /etc/nginx/sites-enabled/fits
   sudo nginx -t && sudo systemctl reload nginx
   ```

   `X-Forwarded-For` moet het echte adres zijn: de app gebruikt het om te veel inlogpogingen tegen te houden.

6. **HTTPS.** `sudo certbot --nginx -d fits.alduslab.eu`, kies "redirect".

7. **Eerste account.** Open `https://fits.alduslab.eu`. Het eerste account dat je maakt wordt beheerder. Doe dit meteen, zodat niemand anders je voor is.

## Back-ups

De database staat in het Docker-volume `fits_fits-data`. Een back-up maken:

```bash
cd ~/fits && docker compose exec -T web node scripts/backup.js
```

Dat zet een kopie in `/data/backups` in het volume (de laatste 30 blijven bewaard). `deploy/update.sh` doet dit ook vóór elke nieuwe versie. Elke nacht, via `crontab -e`:

```
17 3 * * * cd /root/fits && docker compose exec -T web node scripts/backup.js >/dev/null 2>&1
```

Een back-up naar je laptop halen: `docker compose cp web:/data/backups ./backups`. Zet die map eventueel in Nextcloud.

Terugzetten: stop de app (`docker compose stop web`), kopieer de back-up over `/data/fits.db` (`docker compose cp ./fits-….db web:/data/fits.db`) en start weer.

## Beheer

| Wat | Opdracht (in `~/fits`) |
| --- | --- |
| Nieuwe versie live zetten | gaat vanzelf na een push naar `main`; met de hand: `./deploy/update.sh` |
| Draait alles? | `docker compose ps` (status `healthy`) |
| Logboek van de app | `docker compose logs -f web` |
| Iemand uitnodigen | in de app: Meer → Beheer → Nieuwe code |
| Wachtwoord vergeten | zie hieronder |

Nieuw wachtwoord zetten vanaf de server:

```bash
docker compose exec web node scripts/wachtwoord.js jij@example.com 'nieuw-wachtwoord-van-10+-tekens'
```

## Automatisch online zetten

Na elke push naar `main` bouwt en test GitHub de app. Zijn de geheimen ingesteld, dan logt GitHub in op de server en draait `./deploy/update.sh`, en controleert daarna `https://fits.alduslab.eu/gezond`. Zonder geheimen stopt het na het testen.

Eenmalig instellen, net als bij Aldus maar met een eigen sleutel:

1. Op de server: `ssh-keygen -t ed25519 -N "" -C "github-actions-fits" -f ~/.ssh/github-fits`
2. Beperkt toelaten:

   ```bash
   echo "command=\"cd /root/fits && ./deploy/update.sh\",restrict $(cat ~/.ssh/github-fits.pub)" >> ~/.ssh/authorized_keys
   ```

3. `git pull` zonder wachtwoord (privé repository): fine-grained token met alleen *Contents: Read-only* op `pieterrgrt/fits`, opgeslagen met `git config credential.helper store`.
4. GitHub → repository fits → Settings → Secrets and variables → Actions:

   | Naam | Waarde |
   | --- | --- |
   | `DEPLOY_HOST` | `178.105.62.224` |
   | `DEPLOY_SSH_KEY` | inhoud van `~/.ssh/github-fits` (privésleutel) |
   | `DEPLOY_KNOWN_HOSTS` | uitvoer van `ssh-keyscan -t ed25519 178.105.62.224` |

   Daarna `rm ~/.ssh/github-fits` op de server.
5. GitHub → Actions → *Online zetten* → *Run workflow*.
