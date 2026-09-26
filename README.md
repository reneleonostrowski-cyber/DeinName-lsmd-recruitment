# LSMD Recruitment – öffentliche Bewerbung + privater Besitzerbereich

Diese Version trennt die Bereiche:

- `/` = öffentliche Bewerbungsseite für Bewerber
- `/admin` = privater Besitzerbereich

Besitzer-Zugang (bereits in `.env`):
- Benutzername: `owner`
- Passwort: `LSMD-Admin-2026!`

## Wichtig
Damit andere Personen über einen normalen Link Bewerbungen absenden können und du sie von deinem Gerät aus siehst, muss dieses Projekt einmal bei einem Hosting-Anbieter veröffentlicht werden. Dein eigener PC muss danach **nicht** dauerhaft laufen.

Für eine öffentliche Veröffentlichung sollte das vorgegebene Admin-Passwort vorher in `.env` geändert werden. Je nach Hosting-Anbieter muss außerdem eine dauerhaft gespeicherte Datenbank bzw. ein persistentes Volume eingerichtet werden, damit SQLite-Daten bei Deployments nicht verloren gehen.

## Lokal testen
1. Node.js installieren.
2. Projektordner im Terminal öffnen.
3. `npm install`
4. `npm start`
5. Bewerbungsseite: `http://localhost:3000`
6. Besitzerbereich: `http://localhost:3000/admin`
